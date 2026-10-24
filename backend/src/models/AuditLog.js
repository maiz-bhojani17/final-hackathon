const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actorEmail: {
    type: String,
    required: true,
    default: 'system'
  },
  actorRole: {
    type: String,
    default: 'system'
  },
  action: {
    type: String,
    required: true,
    index: true // e.g. 'CREATE_EMPLOYEE', 'APPROVE_LEAVE', 'FINALIZE_PAYROLL'
  },
  entity: {
    type: String,
    required: true,
    index: true // e.g. 'Employee', 'LeaveRequest', 'PayrollRun', 'Settings'
  },
  entityId: {
    type: String,
    default: ''
  },
  beforeJson: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  afterJson: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Only createdAt
});

// Enforce append-only: throw error if someone tries to update or delete audit logs
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function () {
  throw new Error('Audit logs are append-only. Modification is strictly prohibited.');
});

auditLogSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'], function () {
  throw new Error('Audit logs are append-only. Deletion is strictly prohibited.');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
