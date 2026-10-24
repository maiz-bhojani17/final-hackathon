const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/admin', auth, requireRole('admin'), dashboardController.getAdminDashboard);
router.get('/hr', auth, requireRole('hr', 'admin'), dashboardController.getHrDashboard);
router.get('/employee', auth, dashboardController.getEmployeeDashboard);

module.exports = router;
