const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Aynı departmanda aynı isimde pozisyon olamaz
positionSchema.index({ department: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Position', positionSchema); 