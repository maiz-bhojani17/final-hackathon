const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getAdminDashboard(req, res, next) {
    try {
      const { startDate, endDate, departmentId } = req.query;
      const metrics = await dashboardService.getAdminMetrics({ startDate, endDate, departmentId });
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }

  async getHrDashboard(req, res, next) {
    try {
      const { startDate, endDate, departmentId } = req.query;
      const metrics = await dashboardService.getHrMetrics({ startDate, endDate, departmentId });
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }

  async getEmployeeDashboard(req, res, next) {
    try {
      const empId = req.user.employeeId?._id || req.user.employeeId;
      if (!empId) {
        return res.status(400).json({ message: 'No employee record associated with user.' });
      }

      const metrics = await dashboardService.getEmployeeMetrics(empId);
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
