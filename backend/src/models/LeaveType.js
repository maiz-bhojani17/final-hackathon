const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  yearlyQuota: {
    type: Number,
    required: true,
    default: 10 // e.g. annual 14, sick 8, casual 10, -1 for unlimited
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
