const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  response: {
    type: String,
    default: ''
  },
  toolCalled: {
    type: String,
    default: null
  },
  toolArgs: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  durationMs: {
    type: Number,
    default: 0
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

module.exports = mongoose.model('AiLog', aiLogSchema);
