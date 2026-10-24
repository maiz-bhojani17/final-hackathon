const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  exitDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'probation', 'resigned', 'terminated'],
    default: 'probation',
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  designationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designation',
    required: true,
    index: true
  },
  // Salary Structure: gross = 1.5 x basic (HRA 40%, medical 10%)
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  hra: {
    type: Number,
    default: function () {
      return (this.basicSalary || 0) * 0.40;
    }
  },
  medical: {
    type: Number,
    default: function () {
      return (this.basicSalary || 0) * 0.10;
    }
  },
  otherAllowances: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    default: function () {
      return (this.basicSalary || 0) * 1.5 + (this.otherAllowances || 0);
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  faceDescriptor: {
    type: [Number], // Optional enrolled face descriptors for bonus camera verification
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Employee', employeeSchema);
