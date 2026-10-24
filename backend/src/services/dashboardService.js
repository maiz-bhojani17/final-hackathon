const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');
const PayrollRun = require('../models/PayrollRun');
const Payslip = require('../models/Payslip');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const AuditLog = require('../models/AuditLog');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const Settings = require('../models/Settings');

class DashboardService {
  getTodayDateString(d = new Date()) {
    return d.toISOString().split('T')[0];
  }

  async getAdminMetrics({ startDate, endDate, departmentId }) {
    const todayStr = this.getTodayDateString();
    const currentYear = new Date().getFullYear();
    const startPeriod = startDate || `${currentYear}-01-01`;
    const endPeriod = endDate || todayStr;

    // Headcount filter
    const empMatch = {};
    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      empMatch.departmentId = new mongoose.Types.ObjectId(departmentId);
    }

    const allEmployees = await Employee.find(empMatch).populate('departmentId', 'name code').populate('designationId', 'title');

    // Headcount = active + probation on end date
    const activeEmployees = allEmployees.filter(e => ['active', 'probation'].includes(e.status));
    const headcount = activeEmployees.length;

    // Exits in period
    const exits = allEmployees.filter(e =>
      e.exitDate &&
      new Date(e.exitDate) >= new Date(startPeriod) &&
      new Date(e.exitDate) <= new Date(endPeriod)
    ).length;

    // Attrition YTD = (exits / average headcount) * 100
    const avgHeadcount = headcount > 0 ? (headcount + exits / 2) : 1;
    const attritionYTD = parseFloat(((exits / avgHeadcount) * 100).toFixed(2));

    // Payroll cost & avg salary
    const currentMonthStr = todayStr.substring(0, 7);
    const lastFinalizedRun = await PayrollRun.findOne({ status: 'finalized' }).sort({ month: -1 });
    const targetMonth = lastFinalizedRun ? lastFinalizedRun.month : currentMonthStr;

    const payslips = await Payslip.find({ month: targetMonth }).populate('employeeId', 'departmentId designationId');
    const filteredPayslips = departmentId
      ? payslips.filter(p => p.employeeId?.departmentId?.toString() === departmentId.toString())
      : payslips;

    const totalPayrollGross = filteredPayslips.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalPayrollNet = filteredPayslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const avgSalary = activeEmployees.length > 0
      ? Math.round(activeEmployees.reduce((sum, e) => sum + (e.grossSalary || 0), 0) / activeEmployees.length)
      : 0;

    // Headcount by Department
    const deptHeadcountMap = {};
    const departments = await Department.find();
    departments.forEach(d => { deptHeadcountMap[d.name] = 0; });

    activeEmployees.forEach(e => {
      const deptName = e.departmentId?.name || 'Unassigned';
      deptHeadcountMap[deptName] = (deptHeadcountMap[deptName] || 0) + 1;
    });

    const headcountByDept = Object.keys(deptHeadcountMap).map(name => ({
      name,
      count: deptHeadcountMap[name]
    }));

    // Payroll cost by Department
    const deptPayrollMap = {};
    filteredPayslips.forEach(p => {
      const dName = departments.find(d => d._id.toString() === p.employeeId?.departmentId?.toString())?.name || 'Other';
      deptPayrollMap[dName] = (deptPayrollMap[dName] || 0) + p.grossSalary;
    });
    const payrollByDept = Object.keys(deptPayrollMap).map(name => ({
      name,
      cost: deptPayrollMap[name]
    }));

    // Gender breakdown
    const genderMap = { Male: 0, Female: 0, Other: 0 };
    activeEmployees.forEach(e => {
      if (genderMap[e.gender] !== undefined) genderMap[e.gender]++;
      else genderMap.Other++;
    });
    const genderData = Object.keys(genderMap).map(key => ({ name: key, count: genderMap[key] }));

    // Tenure distribution
    const nowMs = Date.now();
    const tenureMap = { '< 1 Year': 0, '1 - 3 Years': 0, '3 - 5 Years': 0, '5+ Years': 0 };
    activeEmployees.forEach(e => {
      const joinMs = new Date(e.joiningDate).getTime();
      const years = (nowMs - joinMs) / (1000 * 60 * 60 * 24 * 365.25);
      if (years < 1) tenureMap['< 1 Year']++;
      else if (years <= 3) tenureMap['1 - 3 Years']++;
      else if (years <= 5) tenureMap['3 - 5 Years']++;
      else tenureMap['5+ Years']++;
    });
    const tenureData = Object.keys(tenureMap).map(key => ({ range: key, count: tenureMap[key] }));

    // Recent Audit feed (last 10)
    const auditFeed = await AuditLog.find().sort({ createdAt: -1 }).limit(10);

    return {
      kpi: {
        headcount,
        attritionYTD,
        totalPayrollGross,
        totalPayrollNet,
        avgSalary,
        targetMonth
      },
      headcountByDept,
      payrollByDept,
      genderData,
      tenureData,
      auditFeed
    };
  }

  async getHrMetrics({ startDate, endDate, departmentId }) {
    const todayStr = this.getTodayDateString();
    const currentMonth = todayStr.substring(0, 7);

    // Active employees
    const empFilter = { status: { $in: ['active', 'probation'] } };
    if (departmentId) {
      empFilter.departmentId = departmentId;
    }
    const employees = await Employee.find(empFilter).select('_id firstName lastName departmentId designationId');
    const employeeIds = employees.map(e => e._id);
    const headcount = employees.length;

    // Today's attendance
    const todayAttendance = await Attendance.find({
      date: todayStr,
      employeeId: { $in: employeeIds }
    });

    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const lateToday = todayAttendance.filter(a => a.status === 'late').length;

    // Today on leave
    const todayLeaves = await LeaveRequest.find({
      status: 'approved',
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr },
      employeeId: { $in: employeeIds }
    });
    const onLeaveToday = todayLeaves.length;

    // Pending approvals (leaves + corrections)
    const [pendingLeavesCount, pendingCorrectionsCount] = await Promise.all([
      LeaveRequest.countDocuments({ status: 'pending', employeeId: { $in: employeeIds } }),
      AttendanceCorrection.countDocuments({ status: 'pending', employeeId: { $in: employeeIds } })
    ]);
    const pendingApprovals = pendingLeavesCount + pendingCorrectionsCount;

    // Month attendance rate formula:
    // (present + late + missing_checkout + 0.5 * half_day) / (working-day records - on_leave)
    const monthRecords = await Attendance.find({
      date: { $regex: `^${currentMonth}` },
      employeeId: { $in: employeeIds }
    });

    const mPresent = monthRecords.filter(r => r.status === 'present').length;
    const mLate = monthRecords.filter(r => r.status === 'late').length;
    const mMissingCheckout = monthRecords.filter(r => r.status === 'missing_checkout').length;
    const mHalfDay = monthRecords.filter(r => r.status === 'half_day').length;
    const mOnLeave = monthRecords.filter(r => r.status === 'on_leave').length;

    const numerator = mPresent + mLate + mMissingCheckout + (0.5 * mHalfDay);
    const denominator = Math.max(1, monthRecords.length - mOnLeave);
    const attendanceRate = monthRecords.length > 0 ? parseFloat(((numerator / denominator) * 100).toFixed(1)) : 100;

    // Top 5 Late-comers this month
    const lateAggregation = await Attendance.aggregate([
      { $match: { date: { $regex: `^${currentMonth}` }, status: 'late', employeeId: { $in: employeeIds } } },
      { $group: { _id: '$employeeId', lateCount: { $sum: 1 } } },
      { $sort: { lateCount: -1 } },
      { $limit: 5 }
    ]);

    const populatedLateComers = [];
    for (const item of lateAggregation) {
      const emp = employees.find(e => e._id.toString() === item._id.toString());
      if (emp) {
        populatedLateComers.push({
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          lateCount: item.lateCount
        });
      }
    }

    // Leave by Type breakdown this month
    const monthLeaves = await LeaveRequest.find({
      status: 'approved',
      startDate: { $regex: `^${currentMonth}` },
      employeeId: { $in: employeeIds }
    }).populate('leaveTypeId', 'name code');

    const leaveTypeCount = {};
    monthLeaves.forEach(l => {
      const typeName = l.leaveTypeId?.name || 'Other';
      leaveTypeCount[typeName] = (leaveTypeCount[typeName] || 0) + l.workingDaysCount;
    });
    const leaveByType = Object.keys(leaveTypeCount).map(name => ({ name, days: leaveTypeCount[name] }));

    // Attendance trend for last 7 days
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const recordsForDay = await Attendance.find({ date: dStr, employeeId: { $in: employeeIds } });
      trend.push({
        date: dStr.substring(5), // MM-DD
        present: recordsForDay.filter(r => ['present', 'late'].includes(r.status)).length,
        late: recordsForDay.filter(r => r.status === 'late').length,
        halfDay: recordsForDay.filter(r => r.status === 'half_day').length
      });
    }

    return {
      kpi: {
        headcount,
        presentToday,
        lateToday,
        onLeaveToday,
        pendingApprovals,
        attendanceRate
      },
      topLateComers: populatedLateComers,
      leaveByType,
      attendanceTrend: trend
    };
  }

  async getEmployeeMetrics(employeeId) {
    const todayStr = this.getTodayDateString();
    const currentMonth = todayStr.substring(0, 7);

    // Today's attendance
    const todayAttendance = await Attendance.findOne({ employeeId, date: todayStr });

    // Weekly hours (Monday to Sunday of current week)
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // Monday = 1, Sunday = 7
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    const mondayStr = monday.toISOString().split('T')[0];

    const weekAttendance = await Attendance.find({
      employeeId,
      date: { $gte: mondayStr, $lte: todayStr }
    });

    const hoursThisWeek = weekAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);

    // Late count this month
    const lateCountThisMonth = await Attendance.countDocuments({
      employeeId,
      date: { $regex: `^${currentMonth}` },
      status: 'late'
    });

    // Leave balances
    const leaveTypes = await LeaveType.find();
    const yearStart = `${now.getFullYear()}-01-01`;
    const approvedLeaves = await LeaveRequest.find({
      employeeId,
      status: 'approved',
      startDate: { $gte: yearStart }
    });

    const leaveSummary = leaveTypes.map(lt => {
      const used = approvedLeaves
        .filter(l => l.leaveTypeId.toString() === lt._id.toString())
        .reduce((sum, l) => sum + l.workingDaysCount, 0);
      const isUnlimited = lt.yearlyQuota < 0 || lt.yearlyQuota >= 999;
      return {
        name: lt.name,
        code: lt.code,
        quota: isUnlimited ? '∞' : lt.yearlyQuota,
        used,
        remaining: isUnlimited ? '∞' : Math.max(0, lt.yearlyQuota - used)
      };
    });

    // Last payslip
    const lastPayslip = await Payslip.findOne({ employeeId, status: 'finalized' }).sort({ month: -1 });

    return {
      todayStatus: todayAttendance?.status || 'not_checked_in',
      checkInTime: todayAttendance?.checkInTime || null,
      checkOutTime: todayAttendance?.checkOutTime || null,
      hoursThisWeek: parseFloat(hoursThisWeek.toFixed(1)),
      targetHours: 40,
      lateCountThisMonth,
      leaveSummary,
      lastPayslip: lastPayslip ? {
        id: lastPayslip._id,
        month: lastPayslip.month,
        netSalary: lastPayslip.netSalary,
        grossSalary: lastPayslip.grossSalary
      } : null
    };
  }
}

module.exports = new DashboardService();
