const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
    default: 'HCM Lite Enterprises'
  },
  workStartTime: {
    type: String,
    default: '09:00' // HH:mm format
  },
  workEndTime: {
    type: String,
    default: '18:00' // HH:mm format
  },
  gracePeriodMinutes: {
    type: Number,
    default: 15 // late after 09:15
  },
  halfDayHours: {
    type: Number,
    default: 5 // half day if worked < 5h
  },
  weekendDays: {
    type: [Number], // 0 = Sunday, 1 = Monday, ..., 6 = Saturday. Default Sat(6) & Sun(0)
    default: [0, 6]
  },
  officeLocation: {
    lat: {
      type: Number,
      default: 24.8607 // default coordinates (e.g. Karachi / Zaitoon Ashraf IT Park approx)
    },
    lng: {
      type: Number,
      default: 67.0011
    },
    radiusMeters: {
      type: Number,
      default: 150 // 150m radius
    },
    address: {
      type: String,
      default: 'Zaitoon Ashraf IT Park'
    }
  },
  latePenaltyEnabled: {
    type: Boolean,
    default: true // Bonus rule: 3 lates = 0.5 day salary deduction
  },
  currency: {
    type: String,
    default: 'PKR'
  },
  setupCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
