const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  level: {
    type: String,
    trim: true,
    default: 'Associate'
  }
}, {
  timestamps: true
});

designationSchema.index({ title: 1, departmentId: 1 }, { unique: true });

module.exports = mongoose.model('Designation', designationSchema);
