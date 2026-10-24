const employeeService = require('../services/employeeService');

class EmployeeController {
  async registerEmployee(req, res, next) {
    try {
      const result = await employeeService.registerEmployee(req.body, req);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateEmployee(req, res, next) {
    try {
      const targetId = req.params.id;

      // Scope check for employee
      if (req.user.role === 'employee') {
        const empId = req.user.employeeId?._id || req.user.employeeId;
        if (!empId || empId.toString() !== targetId.toString()) {
          return res.status(403).json({ message: 'Employees can only edit their own profile.' });
        }
      }

      const updated = await employeeService.updateEmployee(targetId, req.body, req);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async getEmployeeList(req, res, next) {
    try {
      const { search, departmentId, status, page, limit } = req.query;
      const result = await employeeService.getEmployeeList({ search, departmentId, status, page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getEmployee360(req, res, next) {
    try {
      const targetId = req.params.id;

      // Scope check for employee
      if (req.user.role === 'employee') {
        const empId = req.user.employeeId?._id || req.user.employeeId;
        if (!empId || empId.toString() !== targetId.toString()) {
          return res.status(403).json({ message: 'Employees can only access their own 360 profile.' });
        }
      }

      const profile = await employeeService.getEmployee360(targetId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  async dryRunCsv(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded' });
      }
      const report = await employeeService.dryRunCsv(req.file.buffer);
      res.json(report);
    } catch (err) {
      next(err);
    }
  }

  async executeCsvImport(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded' });
      }
      const result = await employeeService.executeCsvImport(req.file.buffer, req);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async exportCsv(req, res, next) {
    try {
      const csvData = await employeeService.exportCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees_export.csv"');
      res.status(200).send(csvData);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmployeeController();
