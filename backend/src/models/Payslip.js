const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
  payrollRunId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PayrollRun',
    required: true,
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
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
  basicSalary: {
    type: Number,
    required: true
  },
  hra: {
    type: Number,
    required: true
  },
  medical: {
    type: Number,
    required: true
  },
  otherAllowances: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    required: true
  },
  perDayRate: {
    type: Number,
    required: true
  },
  // Attendance & deductions
  workedDays: {
    type: Number,
    default: 0
  },
  absentDays: {
    type: Number,
    default: 0
  },
  unpaidLeaveDays: {
    type: Number,
    default: 0
  },
  halfDays: {
    type: Number,
    default: 0
  },
  lateCount: {
    type: Number,
    default: 0
  },
  deductions: {
    absentDeduction: { type: Number, default: 0 },
    unpaidLeaveDeduction: { type: Number, default: 0 },
    halfDayDeduction: { type: Number, default: 0 },
    latePenaltyDeduction: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 }
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'finalized'],
    default: 'draft',
    index: true
  }
}, {
  timestamps: true
});

payslipSchema.index({ employeeId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payslip', payslipSchema);
