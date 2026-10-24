const leaveService = require('../services/leaveService');

class LeaveController {
  async getBalances(req, res, next) {
    try {
      let targetEmployeeId = req.query.employeeId;

      if (req.user.role === 'employee') {
        const empId = req.user.employeeId?._id || req.user.employeeId;
        if (!empId) return res.status(403).json({ message: 'No employee linked to your account.' });
        targetEmployeeId = empId;
      } else if (!targetEmployeeId) {
        const empId = req.user.employeeId?._id || req.user.employeeId;
        targetEmployeeId = empId;
      }

      if (!targetEmployeeId) {
        return res.status(400).json({ message: 'Employee ID is required.' });
      }

      const balances = await leaveService.getLeaveBalances(targetEmployeeId, req.query.year);
      res.json(balances);
    } catch (err) {
      next(err);
    }
  }

  async calculateDays(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required.' });
      }
      const days = await leaveService.calculateWorkingDays(startDate, endDate);
      res.json({ workingDays: days });
    } catch (err) {
      next(err);
    }
  }

  async applyLeave(req, res, next) {
    try {
      const empId = req.user.employeeId?._id || req.user.employeeId;
      if (!empId) {
        return res.status(400).json({ message: 'No employee profile linked to user.' });
      }

      const { leaveTypeId, startDate, endDate, reason } = req.body;
      const result = await leaveService.applyLeave(
        { employeeId: empId, leaveTypeId, startDate, endDate, reason },
        req
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async cancelLeave(req, res, next) {
    try {
      const empId = req.user.employeeId?._id || req.user.employeeId;
      if (!empId) {
        return res.status(400).json({ message: 'No employee profile linked to user.' });
      }

      const result = await leaveService.cancelLeave(req.params.id, empId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async reviewLeave(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reviewComment } = req.body;
      const result = await leaveService.reviewLeave({ leaveRequestId: id, status, reviewComment }, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getLeaveRequests(req, res, next) {
    try {
      let targetEmployeeId = req.query.employeeId;

      if (req.user.role === 'employee') {
        const empId = req.user.employeeId?._id || req.user.employeeId;
        targetEmployeeId = empId;
      }

      const requests = await leaveService.getLeaveRequests({
        employeeId: targetEmployeeId,
        status: req.query.status,
        departmentId: req.query.departmentId,
        year: req.query.year
      });
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LeaveController();
