require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const authService = require('./src/services/authService');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const orgRoutes = require('./src/routes/orgRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');
const payrollRoutes = require('./src/routes/payrollRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const commsRoutes = require('./src/routes/commsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HCM Lite Backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/comms', commsRoutes);

// Serverless DB Middleware for Vercel
let isInitialized = false;
app.use(async (req, res, next) => {
  if (process.env.VERCEL && !isInitialized) {
    try {
      const conn = await connectDB();
      if (conn) {
        await authService.checkAndSeedFromEnv();
        await authService.seedDemoAccounts();
        isInitialized = true;
      }
    } catch (e) {
      console.warn('[Vercel DB Init Warning]:', e.message);
    }
  }
  next();
});

// Global Error Handler
app.use(errorHandler);

// Connect DB & start server (for local development)
const startServer = async () => {
  const conn = await connectDB();
  if (conn) {
    try {
      await authService.checkAndSeedFromEnv();
      await authService.seedDemoAccounts();
      console.log('✅ Demo accounts ready: admin@hcmlite.com / hr@hcmlite.com / ali@hcmlite.com');
    } catch (seedErr) {
      console.warn('[First Run Seed Warning]:', seedErr.message);
    }
  } else {
    console.warn('⚠️ [MongoDB Warning] MongoDB is not connected yet. Running in offline/disconnected mode.');
    console.warn('👉 Please verify your MONGODB_URI in backend/.env or make sure MongoDB service is running.');
  }

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 HCM Lite Backend running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
};

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('[Startup Error]:', err);
  });
}

module.exports = app;
