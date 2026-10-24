const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { recordAudit } = require('../middleware/audit');

class CommsService {
  // Announcements
  async getAnnouncements() {
    return Announcement.find().sort({ createdAt: -1 }).limit(30);
  }

  async createAnnouncement({ title, content, priority = 'normal' }, req = null) {
    if (!title || !content) {
      const err = new Error('Title and content are required.');
      err.statusCode = 422;
      throw err;
    }

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      priority,
      postedBy: req.user._id,
      postedByName: `${req.user.role.toUpperCase()} Team`
    });
    await announcement.save();

    await recordAudit({
      req,
      action: 'POST_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: announcement._id,
      afterJson: { title, priority }
    });

    return announcement;
  }

  // Notifications
  async getNotifications(userId) {
    return Notification.find({ recipientUserId: userId })
      .sort({ createdAt: -1 })
      .limit(30);
  }

  async markNotificationRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientUserId: userId },
      { read: true },
      { new: true }
    );
    return notification;
  }

  async markAllNotificationsRead(userId) {
    await Notification.updateMany({ recipientUserId: userId }, { read: true });
    return { message: 'All notifications marked as read' };
  }

  // Audit Logs (Admin only)
  async getAuditLogs({ action, entity, startDate, endDate, page = 1, limit = 50 }) {
    const query = {};

    if (action) {
      query.action = action;
    }

    if (entity) {
      query.entity = entity;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }
}

module.exports = new CommsService();
