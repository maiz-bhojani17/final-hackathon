const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Public endpoints
router.get('/status', authController.getSystemStatus);
router.post('/setup', authController.setupFirstRun);
router.post('/seed-demo', authController.seedDemo);
router.post('/login', authController.login);

// Authenticated endpoints
router.get('/me', auth, authController.getMe);
router.post('/change-password', auth, authController.changePassword);

// Admin-only user management
router.get('/users', auth, requireRole('admin'), authController.listUsers);
router.post('/create-hr', auth, requireRole('admin'), authController.createHrLogin);
router.patch('/users/:userId/status', auth, requireRole('admin'), authController.toggleUserStatus);
router.post('/users/:userId/reset-password', auth, requireRole('admin'), authController.resetUserPassword);

module.exports = router;
