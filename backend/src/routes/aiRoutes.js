const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { requireRole } = require('../middleware/rbac');

// Chat with tools (All roles with user-scoped tool execution, 20 req/hr rate limited)
router.post('/chat', auth, aiRateLimiter, aiController.chat);

// Dashboard summary (Admin & HR)
router.post('/summarize', auth, requireRole('admin', 'hr'), aiController.summarize);

// Smart leave parser (Employee & HR)
router.post('/smart-leave', auth, aiController.smartLeave);

module.exports = router;
