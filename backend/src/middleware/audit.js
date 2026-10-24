const AuditLog = require('../models/AuditLog');

const recordAudit = async ({
  req = null,
  actorUserId = null,
  actorEmail = 'system',
  actorRole = 'system',
  action,
  entity,
  entityId = '',
  beforeJson = null,
  afterJson = null
}) => {
  try {
    let resolvedUserId = actorUserId;
    let resolvedEmail = actorEmail;
    let resolvedRole = actorRole;
    let ipAddress = '';
    let userAgent = '';

    if (req) {
      if (req.user) {
        resolvedUserId = req.user._id;
        resolvedEmail = req.user.email;
        resolvedRole = req.user.role;
      }
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
      userAgent = req.headers['user-agent'] || '';
    }

    const logEntry = new AuditLog({
      actorUserId: resolvedUserId,
      actorEmail: resolvedEmail,
      actorRole: resolvedRole,
      action,
      entity,
      entityId: entityId ? entityId.toString() : '',
      beforeJson,
      afterJson,
      ipAddress,
      userAgent
    });

    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('[AuditLog Error]', error.message);
    return null;
  }
};

module.exports = {
  recordAudit
};
