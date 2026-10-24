const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Monthly draft generation (HR & Admin)
router.post('/draft', auth, requireRole('hr', 'admin'), payrollController.generatePayrollDraft);

// Finalize payroll (ADMIN ONLY - locked thereafter)
router.patch('/runs/:id/finalize', auth, requireRole('admin'), payrollController.finalizePayroll);

// Run lists
router.get('/runs', auth, requireRole('hr', 'admin'), payrollController.getPayrollRuns);
router.get('/runs/:runId/payslips', auth, payrollController.getPayslipsForRun);

// Employee payslips (Own)
router.get('/my-payslips', auth, payrollController.getMyPayslips);

// PDF download (Admin & HR view all, Employee views own)
router.get('/payslips/:id/pdf', auth, payrollController.downloadPayslipPdf);

module.exports = router;
