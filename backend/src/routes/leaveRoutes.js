const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const auth = require('../middleware/auth');
const { requireRole, scopeGuard } = require('../middleware/rbac');

// Balances and working days calculation
router.get('/balances', auth, scopeGuard, leaveController.getBalances);
router.get('/calculate-days', auth, leaveController.calculateDays);

// History & requests
router.get('/', auth, scopeGuard, leaveController.getLeaveRequests);

// Apply & cancel (Own)
router.post('/apply', auth, leaveController.applyLeave);
router.patch('/:id/cancel', auth, leaveController.cancelLeave);

// Approve / Reject (HR & Admin)
router.patch('/:id/review', auth, requireRole('hr', 'admin'), leaveController.reviewLeave);

module.exports = router;
