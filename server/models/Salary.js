const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  bonus: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Net maaş hesaplama
salarySchema.pre('save', function(next) {
  this.netSalary = this.baseSalary + this.bonus - this.deductions;
  next();
});

// Aynı ay ve yıl için tek kayıt
salarySchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema); 