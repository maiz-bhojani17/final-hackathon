const payrollService = require('../services/payrollService');

class PayrollController {
  async generatePayrollDraft(req, res, next) {
    try {
      const { month } = req.body;
      const result = await payrollService.generatePayrollDraft(month, req);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async finalizePayroll(req, res, next) {
    try {
      const { id } = req.params;
      const result = await payrollService.finalizePayroll(id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getPayrollRuns(req, res, next) {
    try {
      const runs = await payrollService.getPayrollRuns();
      res.json(runs);
    } catch (err) {
      next(err);
    }
  }

  async getPayslipsForRun(req, res, next) {
    try {
      const { runId } = req.params;
      let targetEmpId = null;

      if (req.user.role === 'employee') {
        targetEmpId = req.user.employeeId?._id || req.user.employeeId;
      }

      const payslips = await payrollService.getPayslipsForRun(runId, targetEmpId);
      res.json(payslips);
    } catch (err) {
      next(err);
    }
  }

  async getMyPayslips(req, res, next) {
    try {
      const empId = req.user.employeeId?._id || req.user.employeeId;
      if (!empId) {
        return res.status(400).json({ message: 'No employee profile linked to user account.' });
      }

      const payslips = await payrollService.getEmployeePayslips(empId);
      res.json(payslips);
    } catch (err) {
      next(err);
    }
  }

  async downloadPayslipPdf(req, res, next) {
    try {
      const { id } = req.params;

      // If user is employee, verify scope: payslip must belong to them
      if (req.user.role === 'employee') {
        const empId = req.user.employeeId?._id || req.user.employeeId;
        const Payslip = require('../models/Payslip');
        const p = await Payslip.findById(id);
        if (!p || p.employeeId.toString() !== empId.toString()) {
          return res.status(403).json({ message: 'Employees can only download their own payslips.' });
        }
      }

      await payrollService.generatePayslipPdf(id, res);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PayrollController();
