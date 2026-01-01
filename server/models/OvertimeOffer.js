const mongoose = require('mongoose');

const overtimeOfferSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  weekStart: { type: Date, required: true },
  hoursRequired: { type: Number, required: true, min: 1 },
  bonusAmount: { type: Number, required: true, min: 0 },
  note: { type: String, trim: true },
  status: { type: String, enum: ['open', 'accepted', 'closed'], default: 'open' },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acceptedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('OvertimeOffer', overtimeOfferSchema);


