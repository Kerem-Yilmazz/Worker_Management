const express = require('express');
const LeaveRequest = require('../models/LeaveRequest');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Tüm izin taleplerini getir (admin için)
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        select: 'firstName lastName email department',
        populate: { path: 'department', select: 'name' }
      })
      .populate({ path: 'decidedBy', select: 'firstName lastName' });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kullanıcının kendi izin taleplerini getir
router.get('/', auth, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alias: /me
router.get('/me', auth, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni izin talebi oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;

    // Tarih doğrulama
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Başlangıç ve bitiş tarihleri zorunludur' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Geçersiz tarih değerleri' });
    }
    if (end < start) {
      return res.status(400).json({ message: 'Bitiş tarihi başlangıç tarihinden önce olamaz' });
    }
    // Maksimum 14 gün (başlangıç ve bitiş dahil)
    const oneDayMs = 24 * 60 * 60 * 1000;
    const days = Math.floor((end.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / oneDayMs) + 1;
    if (days > 14) {
      return res.status(400).json({ message: 'İzin süresi en fazla 14 gün olabilir' });
    }

    const leaveRequest = new LeaveRequest({
      user: req.user.id,
      startDate: start,
      endDate: end,
      type,
      reason
    });

    const savedLeave = await leaveRequest.save();
    res.status(201).json(savedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// İzin talebini güncelle (sadece kendi talebi)
router.put('/:id', auth, async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'İzin talebi bulunamadı' });
    }
    
    if (leave.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu işlemi yapmaya yetkiniz yok' });
    }
    
    const updatedLeave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// İzin talebini onayla/reddet (admin için)
router.put('/admin/:id', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum' });
    }
    const updatedLeave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        decidedBy: req.user.id,
        decisionAt: new Date()
      },
      { new: true }
    );
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// İzin talebini sil (sadece kendi talebi)
router.delete('/:id', auth, async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'İzin talebi bulunamadı' });
    }
    
    if (leave.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu işlemi yapmaya yetkiniz yok' });
    }
    
    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'İzin talebi silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
