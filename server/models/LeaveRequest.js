const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['annual', 'sick', 'unpaid', 'other'],
    default: 'annual',
  },
  reason: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  decidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  decisionAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
