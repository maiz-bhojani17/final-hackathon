const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden. You do not have permission (${req.user.role} is not permitted). Required: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Server-side data scope guard:
 * If user is 'employee', they can only view or act on their own employee_id.
 * If user is 'admin' or 'hr', they have broader scope according to their permissions.
 */
const scopeGuard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'employee') {
    if (!req.user.employeeId) {
      return res.status(403).json({ message: 'No employee record linked to your user account.' });
    }

    const employeeIdStr = req.user.employeeId._id
      ? req.user.employeeId._id.toString()
      : req.user.employeeId.toString();

    // Attach verified employee scope
    req.scopedEmployeeId = employeeIdStr;

    // Check query or params if client specified an employeeId
    const targetId = req.params.employeeId || req.query.employeeId || (req.body && req.body.employeeId);
    if (targetId && targetId.toString() !== employeeIdStr) {
      return res.status(403).json({
        message: 'Security Violation: Employees are strictly forbidden from viewing or modifying other records.'
      });
    }
  }

  next();
};

module.exports = {
  requireRole,
  scopeGuard
};
