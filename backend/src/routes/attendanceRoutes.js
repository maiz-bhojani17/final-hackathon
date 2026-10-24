const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const { requireRole, scopeGuard } = require('../middleware/rbac');

// Check in & check out
router.post('/check-in', auth, attendanceController.checkIn);
router.post('/check-out', auth, attendanceController.checkOut);

// Daily attendance board (Admin & HR)
router.get('/board', auth, requireRole('admin', 'hr'), attendanceController.getDailyBoard);

// Calendar (Employee views own; HR & Admin can view any)
router.get('/calendar', auth, scopeGuard, attendanceController.getCalendar);

// Attendance corrections
router.post('/corrections', auth, attendanceController.requestCorrection);
router.get('/corrections/pending', auth, requireRole('admin', 'hr'), attendanceController.getPendingCorrections);
router.patch('/corrections/:id/review', auth, requireRole('hr', 'admin'), attendanceController.reviewCorrection);

module.exports = router;
