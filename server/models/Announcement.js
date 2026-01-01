const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  audience: {
    type: String,
    enum: ['all', 'workers', 'department', 'specific'],
    default: 'all',
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  workers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Duyurunun yalnızca gönderildiği anda mevcut işçilere görünmesi için snapshot mantığı:
  // Zaten workers alanına gönderim anındaki alıcılar yazılıyor.
  // Ek alan gerekmiyor; createdAt zaten mevcut ve otomatik.
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Announcement', announcementSchema);


