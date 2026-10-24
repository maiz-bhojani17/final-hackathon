const PDFDocument = require('pdfkit');
const PayrollRun = require('../models/PayrollRun');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const { recordAudit } = require('../middleware/audit');

class PayrollService {
  calculateAnnualTax(annualGross) {
    if (annualGross <= 600000) {
      return 0;
    } else if (annualGross <= 1200000) {
      return (annualGross - 600000) * 0.05;
    } else if (annualGross <= 2400000) {
      return 30000 + (annualGross - 1200000) * 0.15;
    } else if (annualGross <= 3600000) {
      return 210000 + (annualGross - 2400000) * 0.25;
    } else {
      return 510000 + (annualGross - 3600000) * 0.35;
    }
  }

  async getMonthWorkingDays(year, month) {
    // year: 2026, month: 10
    const settings = (await Settings.findOne()) || { weekendDays: [0, 6] };
    const weekends = settings.weekendDays || [0, 6];

    const holidays = await Holiday.find({ date: { $regex: `^${year}-${String(month).padStart(2, '0')}` } });
    const holidayDates = new Set(holidays.map(h => h.date));

    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (!weekends.includes(d.getDay()) && !holidayDates.has(dateStr)) {
        workingDays++;
      }
    }

    return Math.max(1, workingDays);
  }

  async generatePayrollDraft(monthStr, req = null) {
    // monthStr format: 'YYYY-MM'
    if (!/^\d{4}-\d{2}$/.test(monthStr)) {
      const err = new Error('Invalid month format. Expected YYYY-MM');
      err.statusCode = 400;
      throw err;
    }

    const [year, month] = monthStr.split('-').map(Number);

    // Check if payroll already exists and finalized
    const existing = await PayrollRun.findOne({ month: monthStr });
    if (existing && existing.status === 'finalized') {
      const err = new Error(`Payroll for ${monthStr} is already finalized and locked against edits.`);
      err.statusCode = 422;
      throw err;
    }

    const settings = (await Settings.findOne()) || {
      latePenaltyEnabled: true,
      weekendDays: [0, 6]
    };

    const totalWorkingDays = await this.getMonthWorkingDays(year, month);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStartDate = `${monthStr}-01`;
    const monthEndDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

    // Active or probation employees, or employees who worked during this month
    const employees = await Employee.find({
      joiningDate: { $lte: new Date(monthEndDate) },
      $or: [
        { exitDate: null },
        { exitDate: { $gte: new Date(monthStartDate) } }
      ]
    }).populate('departmentId', 'name code').populate('designationId', 'title');

    // Remove old draft payslips if replacing draft
    if (existing) {
      await Payslip.deleteMany({ payrollRunId: existing._id });
    }

    const payrollRun = existing || new PayrollRun({
      month: monthStr,
      year,
      workingDays: totalWorkingDays,
      status: 'draft',
      createdBy: req.user._id
    });
    await payrollRun.save();

    let runTotalGross = 0;
    let runTotalDeductions = 0;
    let runTotalTax = 0;
    let runTotalNet = 0;
    const payslips = [];

    for (const emp of employees) {
      // Basic & components
      const basic = emp.basicSalary;
      const hra = emp.hra || basic * 0.40;
      const medical = emp.medical || basic * 0.10;
      const other = emp.otherAllowances || 0;
      let gross = basic + hra + medical + other;

      // Proration for joiner / leaver
      const empJoin = new Date(emp.joiningDate);
      const isJoinedThisMonth = empJoin.getFullYear() === year && (empJoin.getMonth() + 1) === month;
      let activeDaysRatio = 1.0;

      if (isJoinedThisMonth) {
        // Calculate remaining working days from join date
        const joinDay = empJoin.getDate();
        let activeWorkingDays = 0;
        for (let d = joinDay; d <= daysInMonth; d++) {
          const checkDate = new Date(year, month - 1, d);
          if (!settings.weekendDays.includes(checkDate.getDay())) {
            activeWorkingDays++;
          }
        }
        activeDaysRatio = Math.min(1.0, activeWorkingDays / totalWorkingDays);
        gross = gross * activeDaysRatio;
      }

      const perDayRate = gross / totalWorkingDays;

      // Attendance records for this employee in this month
      const attendanceList = await Attendance.find({
        employeeId: emp._id,
        date: { $regex: `^${monthStr}` }
      });

      const presentCount = attendanceList.filter(a => a.status === 'present').length;
      const lateCount = attendanceList.filter(a => a.status === 'late').length;
      const halfDayCount = attendanceList.filter(a => a.status === 'half_day').length;

      // Approved leaves
      const approvedLeaves = await LeaveRequest.find({
        employeeId: emp._id,
        status: 'approved',
        $or: [
          { startDate: { $regex: `^${monthStr}` } },
          { endDate: { $regex: `^${monthStr}` } }
        ]
      }).populate('leaveTypeId', 'isPaid');

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      approvedLeaves.forEach(l => {
        if (l.leaveTypeId?.isPaid) {
          paidLeaveDays += l.workingDaysCount;
        } else {
          unpaidLeaveDays += l.workingDaysCount;
        }
      });

      const recordedDays = presentCount + lateCount + halfDayCount + paidLeaveDays + unpaidLeaveDays;
      // Absent days: expected working days minus recorded
      const absentDays = Math.max(0, Math.round((totalWorkingDays * activeDaysRatio) - recordedDays));

      // Calculate Deductions
      const absentDeduction = absentDays * perDayRate;
      const unpaidLeaveDeduction = unpaidLeaveDays * perDayRate;
      const halfDayDeduction = halfDayCount * 0.5 * perDayRate;

      // Bonus late penalty rule: 3 lates = 0.5 day deduction
      let latePenaltyDeduction = 0;
      if (settings.latePenaltyEnabled && lateCount >= 3) {
        const penaltyBlocks = Math.floor(lateCount / 3);
        latePenaltyDeduction = penaltyBlocks * (0.5 * perDayRate);
      }

      // Annual Tax Calculation
      const annualGross = (emp.basicSalary * 1.5 + (emp.otherAllowances || 0)) * 12;
      const annualTax = this.calculateAnnualTax(annualGross);
      const monthlyTax = annualTax / 12;

      const totalDeduction = absentDeduction + unpaidLeaveDeduction + halfDayDeduction + latePenaltyDeduction + monthlyTax;
      const netSalary = Math.max(0, Math.round(gross - totalDeduction));

      const payslip = new Payslip({
        payrollRunId: payrollRun._id,
        employeeId: emp._id,
        month: monthStr,
        year,
        workingDays: totalWorkingDays,
        basicSalary: Math.round(basic),
        hra: Math.round(hra),
        medical: Math.round(medical),
        otherAllowances: Math.round(other),
        grossSalary: Math.round(gross),
        perDayRate: parseFloat(perDayRate.toFixed(2)),
        workedDays: presentCount + lateCount,
        absentDays,
        unpaidLeaveDays,
        halfDays: halfDayCount,
        lateCount,
        deductions: {
          absentDeduction: Math.round(absentDeduction),
          unpaidLeaveDeduction: Math.round(unpaidLeaveDeduction),
          halfDayDeduction: Math.round(halfDayDeduction),
          latePenaltyDeduction: Math.round(latePenaltyDeduction),
          incomeTax: Math.round(monthlyTax),
          otherDeductions: 0
        },
        totalDeductions: Math.round(totalDeduction),
        netSalary,
        status: 'draft'
      });

      await payslip.save();
      payslips.push(payslip);

      runTotalGross += payslip.grossSalary;
      runTotalDeductions += payslip.totalDeductions;
      runTotalTax += payslip.deductions.incomeTax;
      runTotalNet += payslip.netSalary;
    }

    payrollRun.totalEmployees = employees.length;
    payrollRun.totalGross = runTotalGross;
    payrollRun.totalDeductions = runTotalDeductions;
    payrollRun.totalTax = runTotalTax;
    payrollRun.totalNet = runTotalNet;
    await payrollRun.save();

    await recordAudit({
      req,
      action: 'CREATE_PAYROLL_DRAFT',
      entity: 'PayrollRun',
      entityId: payrollRun._id,
      afterJson: {
        month: monthStr,
        totalEmployees: employees.length,
        totalGross: runTotalGross,
        totalNet: runTotalNet
      }
    });

    return { payrollRun, payslipCount: payslips.length };
  }

  async finalizePayroll(payrollRunId, req = null) {
    const run = await PayrollRun.findById(payrollRunId);
    if (!run) {
      const err = new Error('Payroll run not found');
      err.statusCode = 404;
      throw err;
    }

    if (run.status === 'finalized') {
      const err = new Error('This payroll run is already finalized and locked.');
      err.statusCode = 400;
      throw err;
    }

    run.status = 'finalized';
    run.finalizedBy = req.user._id;
    run.finalizedAt = new Date();
    await run.save();

    // Lock all payslips
    await Payslip.updateMany({ payrollRunId: run._id }, { status: 'finalized' });

    // Send notifications to all employees
    const payslips = await Payslip.find({ payrollRunId: run._id }).populate({
      path: 'employeeId',
      select: 'userId firstName lastName'
    });

    for (const ps of payslips) {
      if (ps.employeeId?.userId) {
        await Notification.create({
          recipientUserId: ps.employeeId.userId,
          title: `Payslip Available for ${run.month}`,
          message: `Your payslip for ${run.month} is now finalized. Net pay: ${run.totalNet ? ps.netSalary.toLocaleString() : ps.netSalary}. You can view and download it now.`,
          type: 'payroll'
        });
      }
    }

    await recordAudit({
      req,
      action: 'FINALIZE_PAYROLL',
      entity: 'PayrollRun',
      entityId: run._id,
      afterJson: {
        month: run.month,
        totalNet: run.totalNet,
        finalizedAt: run.finalizedAt
      }
    });

    return run;
  }

  async getPayrollRuns() {
    return PayrollRun.find()
      .populate('createdBy', 'email role')
      .populate('finalizedBy', 'email role')
      .sort({ month: -1 });
  }

  async getPayslipsForRun(payrollRunId, employeeId = null) {
    const query = { payrollRunId };
    if (employeeId) {
      query.employeeId = employeeId;
    }

    return Payslip.find(query)
      .populate({
        path: 'employeeId',
        select: 'employeeCode firstName lastName email phone departmentId designationId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'designationId', select: 'title' }
        ]
      })
      .sort({ 'employeeId.firstName': 1 });
  }

  async getEmployeePayslips(employeeId) {
    return Payslip.find({ employeeId, status: 'finalized' })
      .populate('payrollRunId', 'month year status')
      .sort({ month: -1 });
  }

  async generatePayslipPdf(payslipId, res) {
    const payslip = await Payslip.findById(payslipId)
      .populate({
        path: 'employeeId',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      })
      .populate('payrollRunId');

    if (!payslip) {
      const err = new Error('Payslip not found');
      err.statusCode = 404;
      throw err;
    }

    const settings = (await Settings.findOne()) || { companyName: 'HCM Lite Enterprises' };

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=payslip_${payslip.employeeId.employeeCode}_${payslip.month}.pdf`);

    doc.pipe(res);

    // Header Design
    doc.rect(40, 40, 515, 60).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(18).text(settings.companyName.toUpperCase(), 55, 55);
    doc.fontSize(10).fillColor('#94A3B8').text(`CONFIDENTIAL SALARY PAYSLIP - ${payslip.month}`, 55, 78);

    doc.moveDown(3);
    doc.fillColor('#0F172A').fontSize(12);

    // Employee & Run Details Card
    const startY = 120;
    doc.rect(40, startY, 515, 85).strokeColor('#E2E8F0').stroke();

    doc.fontSize(10).fillColor('#475569');
    doc.text(`Employee Code:`, 55, startY + 12);
    doc.fillColor('#0F172A').text(payslip.employeeId.employeeCode, 150, startY + 12);

    doc.fillColor('#475569').text(`Employee Name:`, 55, startY + 28);
    doc.fillColor('#0F172A').text(`${payslip.employeeId.firstName} ${payslip.employeeId.lastName}`, 150, startY + 28);

    doc.fillColor('#475569').text(`Department:`, 55, startY + 44);
    doc.fillColor('#0F172A').text(payslip.employeeId.departmentId?.name || 'N/A', 150, startY + 44);

    doc.fillColor('#475569').text(`Designation:`, 55, startY + 60);
    doc.fillColor('#0F172A').text(payslip.employeeId.designationId?.title || 'N/A', 150, startY + 60);

    // Right column
    doc.fillColor('#475569').text(`Pay Period:`, 320, startY + 12);
    doc.fillColor('#0F172A').text(payslip.month, 420, startY + 12);

    doc.fillColor('#475569').text(`Working Days:`, 320, startY + 28);
    doc.fillColor('#0F172A').text(`${payslip.workingDays}`, 420, startY + 28);

    doc.fillColor('#475569').text(`Days Worked:`, 320, startY + 44);
    doc.fillColor('#0F172A').text(`${payslip.workedDays}`, 420, startY + 44);

    doc.fillColor('#475569').text(`Status:`, 320, startY + 60);
    doc.fillColor(payslip.status === 'finalized' ? '#16A34A' : '#EAB308')
      .text(payslip.status.toUpperCase(), 420, startY + 60);

    // Earnings & Deductions Table
    const tableY = 225;
    doc.rect(40, tableY, 250, 24).fill('#F1F5F9');
    doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold').text('EARNINGS', 55, tableY + 7);
    doc.text('AMOUNT (PKR)', 190, tableY + 7);

    doc.rect(305, tableY, 250, 24).fill('#F1F5F9');
    doc.fillColor('#1E293B').text('DEDUCTIONS', 320, tableY + 7);
    doc.text('AMOUNT (PKR)', 455, tableY + 7);

    // Table Content
    let rowY = tableY + 30;
    doc.font('Helvetica').fontSize(9).fillColor('#334155');

    const earnings = [
      { label: 'Basic Salary', val: payslip.basicSalary },
      { label: 'HRA (40%)', val: payslip.hra },
      { label: 'Medical Allowance (10%)', val: payslip.medical },
      { label: 'Other Allowances', val: payslip.otherAllowances }
    ];

    const deductions = [
      { label: `Absent (${payslip.absentDays} days)`, val: payslip.deductions.absentDeduction },
      { label: `Unpaid Leave (${payslip.unpaidLeaveDays} days)`, val: payslip.deductions.unpaidLeaveDeduction },
      { label: `Half Day (${payslip.halfDays})`, val: payslip.deductions.halfDayDeduction },
      { label: `Late Penalties (${payslip.lateCount} lates)`, val: payslip.deductions.latePenaltyDeduction },
      { label: 'Income Tax (Monthly)', val: payslip.deductions.incomeTax }
    ];

    const maxRows = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < maxRows; i++) {
      if (earnings[i]) {
        doc.text(earnings[i].label, 55, rowY);
        doc.text(earnings[i].val.toLocaleString(), 210, rowY, { align: 'right', width: 60 });
      }
      if (deductions[i]) {
        doc.text(deductions[i].label, 320, rowY);
        doc.text(deductions[i].val.toLocaleString(), 475, rowY, { align: 'right', width: 60 });
      }
      rowY += 20;
    }

    // Totals bar
    rowY += 10;
    doc.rect(40, rowY, 250, 24).fill('#E2E8F0');
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10);
    doc.text('TOTAL GROSS:', 55, rowY + 7);
    doc.text(`PKR ${payslip.grossSalary.toLocaleString()}`, 170, rowY + 7, { align: 'right', width: 100 });

    doc.rect(305, rowY, 250, 24).fill('#E2E8F0');
    doc.text('TOTAL DEDUCTIONS:', 320, rowY + 7);
    doc.text(`PKR ${payslip.totalDeductions.toLocaleString()}`, 435, rowY + 7, { align: 'right', width: 100 });

    // Net Salary Card
    rowY += 45;
    doc.rect(40, rowY, 515, 50).fill('#0284C7');
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('NET TAKE HOME PAY:', 55, rowY + 18);
    doc.fontSize(16).text(`PKR ${payslip.netSalary.toLocaleString()}`, 350, rowY + 16, { align: 'right', width: 185 });

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#94A3B8');
    doc.text('This is a system-generated payslip computed by HCM Lite and does not require a physical signature.', 55, 750, { align: 'center', width: 485 });

    doc.end();
  }
}

module.exports = new PayrollService();
