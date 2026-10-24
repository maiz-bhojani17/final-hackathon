const authService = require('../services/authService');

class AuthController {
  async getSystemStatus(req, res, next) {
    try {
      const status = await authService.getSystemStatus();
      res.json(status);
    } catch (err) {
      next(err);
    }
  }

  async setupFirstRun(req, res, next) {
    try {
      const result = await authService.setupFirstRun(req.body, req);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async seedDemo(req, res, next) {
    try {
      const result = await authService.seedDemoAccounts();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      res.json({
        user: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role,
          mustChangePassword: req.user.mustChangePassword,
          employee: req.user.employeeId
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user._id, currentPassword, newPassword, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createHrLogin(req, res, next) {
    try {
      const result = await authService.createHrLogin(req.body, req);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req, res, next) {
    try {
      const users = await authService.listUsers(req);
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async toggleUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      const result = await authService.toggleUserStatus(userId, status, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetUserPassword(req, res, next) {
    try {
      const { userId } = req.params;
      const { temporaryPassword } = req.body;
      const result = await authService.resetUserPassword(userId, temporaryPassword, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
