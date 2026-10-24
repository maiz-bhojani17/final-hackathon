const express = require('express');
const router = express.Router();
const commsController = require('../controllers/commsController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Announcements: Admin & HR post, all read
router.get('/announcements', auth, commsController.getAnnouncements);
router.post('/announcements', auth, requireRole('admin', 'hr'), commsController.createAnnouncement);

// Notifications: user specific
router.get('/notifications', auth, commsController.getNotifications);
router.patch('/notifications/:id/read', auth, commsController.markNotificationRead);
router.patch('/notifications/read-all', auth, commsController.markAllNotificationsRead);

// Audit logs: Admin view only
router.get('/audit-logs', auth, requireRole('admin'), commsController.getAuditLogs);

module.exports = router;
