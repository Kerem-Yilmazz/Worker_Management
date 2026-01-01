const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const OvertimeOffer = require('../models/OvertimeOffer');
const Department = require('../models/Department');
const router = express.Router();

// Admin: teklif oluştur
router.post('/offers', auth, adminOnly, async (req, res) => {
  try {
    const { department, weekStart, hoursRequired, bonusAmount, note } = req.body;
    if (!department || !weekStart || !hoursRequired || bonusAmount == null) {
      return res.status(400).json({ message: 'Zorunlu alanlar eksik' });
    }
    const dept = await Department.findById(department);
    if (!dept) return res.status(404).json({ message: 'Departman bulunamadı' });
    const start = new Date(weekStart);
    start.setHours(0,0,0,0);

    const existingOpen = await OvertimeOffer.findOne({ department, weekStart: start, status: 'open' });
    if (existingOpen) return res.status(400).json({ message: 'Bu hafta için açık teklif zaten var' });

    const offer = await OvertimeOffer.create({
      department,
      weekStart: start,
      hoursRequired,
      bonusAmount,
      note,
      createdBy: req.user._id
    });
    res.status(201).json(offer);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: teklifler listesi
router.get('/offers', auth, adminOnly, async (req, res) => {
  try {
    const list = await OvertimeOffer.find()
      .sort({ createdAt: -1 })
      .populate('department', 'name')
      .populate('acceptedBy', 'firstName lastName email');
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// İşçi: açık teklifleri gör (kendi departmanı)
router.get('/offers/open', auth, async (req, res) => {
  try {
    const deptId = req.user.department;
    if (!deptId) return res.json([]);
    const list = await OvertimeOffer.find({ department: deptId, status: 'open' }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// İşçi: kabul edilen teklifleri gör
router.get('/offers/accepted', auth, async (req, res) => {
  try {
    const list = await OvertimeOffer.find({ 
      acceptedBy: req.user._id, 
      status: 'accepted' 
    }).sort({ acceptedAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// İşçi: teklifi kabul et — ilk gelen alır
router.post('/offers/:id/accept', auth, async (req, res) => {
  try {
    const offer = await OvertimeOffer.findOne({ _id: req.params.id, status: 'open' });
    if (!offer) return res.status(404).json({ message: 'Teklif bulunamadı veya kapalı' });
    if (req.user.department?.toString() !== offer.department.toString()) {
      return res.status(403).json({ message: 'Bu departman için yetkiniz yok' });
    }

    offer.status = 'accepted';
    offer.acceptedBy = req.user._id;
    offer.acceptedAt = new Date();
    await offer.save();
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: teklifi sil
router.delete('/offers/:id', auth, adminOnly, async (req, res) => {
  try {
    const deleted = await OvertimeOffer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    res.json({ message: 'Teklif silindi' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;


