const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String, // Stored as ISO YYYY-MM-DD for deterministic date match without timezone shifts
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Holiday', holidaySchema);
