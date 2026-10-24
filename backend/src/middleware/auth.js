const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_jwt_secret_key_change_in_production_2026');

    const user = await User.findById(decoded.userId).populate('employeeId');
    if (!user) {
      return res.status(401).json({ message: 'User not found or session expired.' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'Account has been deactivated. Please contact administrator.' });
    }

    // Force password change check
    const allowedPath = req.baseUrl.endsWith('/auth') && (req.path === '/change-password' || req.path === '/me' || req.path === '/logout');
    if (user.mustChangePassword && !allowedPath) {
      return res.status(403).json({
        message: 'You must change your temporary password before accessing the system.',
        mustChangePassword: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
};

module.exports = auth;
