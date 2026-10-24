const mongoose = require('mongoose');

const attendanceCorrectionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  requestedCheckIn: {
    type: String, // HH:mm or ISO string
    required: true
  },
  requestedCheckOut: {
    type: String, // HH:mm or ISO string
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  reviewComment: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
