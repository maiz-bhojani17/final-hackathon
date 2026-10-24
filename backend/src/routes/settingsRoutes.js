const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Admin manages, HR views, Employee has no access
router.get('/', auth, requireRole('admin', 'hr'), settingsController.getSettings);
router.put('/', auth, requireRole('admin'), settingsController.updateSettings);

module.exports = router;
