const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // HH:mm
    required: true,
  },
  endTime: {
    type: String, // HH:mm
    required: true,
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Shift', shiftSchema);
