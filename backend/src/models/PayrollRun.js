const mongoose = require('mongoose');

const payrollRunSchema = new mongoose.Schema({
  month: {
    type: String, // YYYY-MM
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true
  },
  workingDays: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'finalized'],
    default: 'draft',
    index: true
  },
  totalEmployees: {
    type: Number,
    default: 0
  },
  totalGross: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  totalNet: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  finalizedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

payrollRunSchema.index({ month: 1 }, { unique: true });

module.exports = mongoose.model('PayrollRun', payrollRunSchema);
