const express = require('express');
const router = express.Router();
const multer = require('multer');
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Directory listing & profile
router.get('/', auth, employeeController.getEmployeeList);
router.get('/:id/profile360', auth, employeeController.getEmployee360);

// Register employee (HR only)
router.post('/', auth, requireRole('hr', 'admin'), employeeController.registerEmployee);

// Edit employee (HR & Admin can edit all details; Employee can edit only phone/address via scope guard)
router.put('/:id', auth, employeeController.updateEmployee);

// CSV Import & Export (HR & Admin)
router.post('/csv/dry-run', auth, requireRole('hr', 'admin'), upload.single('file'), employeeController.dryRunCsv);
router.post('/csv/import', auth, requireRole('hr', 'admin'), upload.single('file'), employeeController.executeCsvImport);
router.get('/csv/export', auth, requireRole('hr', 'admin'), employeeController.exportCsv);

module.exports = router;
