const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['present', 'late', 'half_day', 'absent', 'on_leave', 'missing_checkout'],
    required: true,
    default: 'present',
    index: true
  },
  totalHours: {
    type: Number,
    default: 0
  },
  workMinutes: {
    type: Number,
    default: 0
  },
  checkInSource: {
    type: String,
    enum: ['web', 'camera'],
    default: 'web'
  },
  location: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    distanceMeters: Number,
    insideGeofence: Boolean
  },
  faceVerified: {
    type: Boolean,
    default: false
  },
  anomalyFlag: {
    type: Boolean,
    default: false // Anomaly detection (e.g., repeated missing checkouts, extreme check-in times)
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
