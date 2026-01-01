const express = require('express');
const Shift = require('../models/Shift');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Tüm vardiyaları getir (admin için)
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const shifts = await Shift.find()
      .populate('user', 'name email department')
      .sort({ date: -1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kullanıcının kendi vardiyalarını getir
router.get('/', auth, async (req, res) => {
  try {
    const shifts = await Shift.find({ user: req.user.id })
      .sort({ date: -1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni vardiya oluştur (admin için)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { userId, date, startTime, endTime, overtimeHours, notes } = req.body;
    
    const shift = new Shift({
      user: userId,
      date,
      startTime,
      endTime,
      overtimeHours: overtimeHours || 0,
      notes
    });
    
    const savedShift = await shift.save();
    res.status(201).json(savedShift);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Vardiyayı güncelle (admin için)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const updatedShift = await Shift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedShift);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Vardiyayı sil (admin için)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vardiya silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Haftalık fazla mesai hesapla
router.get('/overtime/weekly', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const shifts = await Shift.find({
      user: req.user.id,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });
    
    const totalOvertime = shifts.reduce((sum, shift) => sum + (shift.overtimeHours || 0), 0);
    
    res.json({ totalOvertime, shifts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aylık fazla mesai hesapla
router.get('/overtime/monthly', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    // Vardiyalardan gelen fazla mesai
    const shifts = await Shift.find({
      user: req.user.id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const shiftsOvertime = shifts.reduce((sum, shift) => sum + (shift.overtimeHours || 0), 0);
    
    // Kabul edilen tekliflerden gelen fazla mesai
    const OvertimeOffer = require('../models/OvertimeOffer');
    const acceptedOffers = await OvertimeOffer.find({
      acceptedBy: req.user._id,
      status: 'accepted',
      acceptedAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const offersOvertime = acceptedOffers.reduce((sum, offer) => sum + offer.hoursRequired, 0);
    
    // Toplam fazla mesai
    const totalOvertime = shiftsOvertime + offersOvertime;
    
    res.json({ 
      totalOvertime, 
      shiftsOvertime,
      offersOvertime,
      shifts,
      acceptedOffers: acceptedOffers.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


