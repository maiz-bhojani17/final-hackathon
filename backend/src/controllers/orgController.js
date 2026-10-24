const orgService = require('../services/orgService');

class OrgController {
  // Departments
  async getDepartments(req, res, next) {
    try {
      const depts = await orgService.getDepartments();
      res.json(depts);
    } catch (err) {
      next(err);
    }
  }

  async createDepartment(req, res, next) {
    try {
      const dept = await orgService.createDepartment(req.body, req);
      res.status(201).json(dept);
    } catch (err) {
      next(err);
    }
  }

  async updateDepartment(req, res, next) {
    try {
      const dept = await orgService.updateDepartment(req.params.id, req.body, req);
      res.json(dept);
    } catch (err) {
      next(err);
    }
  }

  async deleteDepartment(req, res, next) {
    try {
      const result = await orgService.deleteDepartment(req.params.id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Designations
  async getDesignations(req, res, next) {
    try {
      const desigs = await orgService.getDesignations(req.query.departmentId);
      res.json(desigs);
    } catch (err) {
      next(err);
    }
  }

  async createDesignation(req, res, next) {
    try {
      const desig = await orgService.createDesignation(req.body, req);
      res.status(201).json(desig);
    } catch (err) {
      next(err);
    }
  }

  async updateDesignation(req, res, next) {
    try {
      const desig = await orgService.updateDesignation(req.params.id, req.body, req);
      res.json(desig);
    } catch (err) {
      next(err);
    }
  }

  async deleteDesignation(req, res, next) {
    try {
      const result = await orgService.deleteDesignation(req.params.id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Leave Types
  async getLeaveTypes(req, res, next) {
    try {
      const types = await orgService.getLeaveTypes();
      res.json(types);
    } catch (err) {
      next(err);
    }
  }

  async createLeaveType(req, res, next) {
    try {
      const type = await orgService.createLeaveType(req.body, req);
      res.status(201).json(type);
    } catch (err) {
      next(err);
    }
  }

  async updateLeaveType(req, res, next) {
    try {
      const type = await orgService.updateLeaveType(req.params.id, req.body, req);
      res.json(type);
    } catch (err) {
      next(err);
    }
  }

  async deleteLeaveType(req, res, next) {
    try {
      const result = await orgService.deleteLeaveType(req.params.id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Holidays
  async getHolidays(req, res, next) {
    try {
      const holidays = await orgService.getHolidays(req.query.year);
      res.json(holidays);
    } catch (err) {
      next(err);
    }
  }

  async createHoliday(req, res, next) {
    try {
      const holiday = await orgService.createHoliday(req.body, req);
      res.status(201).json(holiday);
    } catch (err) {
      next(err);
    }
  }

  async updateHoliday(req, res, next) {
    try {
      const holiday = await orgService.updateHoliday(req.params.id, req.body, req);
      res.json(holiday);
    } catch (err) {
      next(err);
    }
  }

  async deleteHoliday(req, res, next) {
    try {
      const result = await orgService.deleteHoliday(req.params.id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrgController();
