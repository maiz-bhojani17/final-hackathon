const commsService = require('../services/commsService');

class CommsController {
  // Announcements
  async getAnnouncements(req, res, next) {
    try {
      const announcements = await commsService.getAnnouncements();
      res.json(announcements);
    } catch (err) {
      next(err);
    }
  }

  async createAnnouncement(req, res, next) {
    try {
      const announcement = await commsService.createAnnouncement(req.body, req);
      res.status(201).json(announcement);
    } catch (err) {
      next(err);
    }
  }

  // Notifications
  async getNotifications(req, res, next) {
    try {
      const notifications = await commsService.getNotifications(req.user._id);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }

  async markNotificationRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await commsService.markNotificationRead(id, req.user._id);
      res.json(notification);
    } catch (err) {
      next(err);
    }
  }

  async markAllNotificationsRead(req, res, next) {
    try {
      const result = await commsService.markAllNotificationsRead(req.user._id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Audit Logs (Admin only)
  async getAuditLogs(req, res, next) {
    try {
      const { action, entity, startDate, endDate, page, limit } = req.query;
      const logs = await commsService.getAuditLogs({ action, entity, startDate, endDate, page, limit });
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CommsController();
