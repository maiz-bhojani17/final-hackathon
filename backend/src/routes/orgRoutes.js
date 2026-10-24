const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Departments: Admin manages, HR & Employee can view
router.get('/departments', auth, orgController.getDepartments);
router.post('/departments', auth, requireRole('admin'), orgController.createDepartment);
router.put('/departments/:id', auth, requireRole('admin'), orgController.updateDepartment);
router.delete('/departments/:id', auth, requireRole('admin'), orgController.deleteDepartment);

// Designations: Admin manages, HR & Employee can view
router.get('/designations', auth, orgController.getDesignations);
router.post('/designations', auth, requireRole('admin'), orgController.createDesignation);
router.put('/designations/:id', auth, requireRole('admin'), orgController.updateDesignation);
router.delete('/designations/:id', auth, requireRole('admin'), orgController.deleteDesignation);

// Leave Types: Admin manages, HR & Employee can view
router.get('/leave-types', auth, orgController.getLeaveTypes);
router.post('/leave-types', auth, requireRole('admin'), orgController.createLeaveType);
router.put('/leave-types/:id', auth, requireRole('admin'), orgController.updateLeaveType);
router.delete('/leave-types/:id', auth, requireRole('admin'), orgController.deleteLeaveType);

// Holidays: Admin manages, all can view
router.get('/holidays', auth, orgController.getHolidays);
router.post('/holidays', auth, requireRole('admin'), orgController.createHoliday);
router.put('/holidays/:id', auth, requireRole('admin'), orgController.updateHoliday);
router.delete('/holidays/:id', auth, requireRole('admin'), orgController.deleteHoliday);

module.exports = router;
