const express = require('express');
const Request = require('../models/Request');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Tüm talepleri getir (admin için)
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('user', 'firstName lastName email department')
      .populate('respondedBy', 'firstName lastName')
      .populate('acknowledgedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kullanıcının kendi taleplerini getir
router.get('/', auth, async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('respondedBy', 'firstName lastName');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni talep oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    
    const request = new Request({
      user: req.user.id,
      title,
      message,
      type: type || 'general'
    });
    
    const savedRequest = await request.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Talebi güncelle (sadece kendi talebi)
router.put('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Talep bulunamadı' });
    }
    
    if (request.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu işlemi yapmaya yetkiniz yok' });
    }
    
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Talebe yanıt ver (admin için)
router.put('/admin/:id', auth, adminOnly, async (req, res) => {
  try {
    const { response, status, acknowledged } = req.body;
    const updateDoc = {
      ...(response !== undefined ? { response } : {}),
      ...(status !== undefined ? { status } : {}),
    };
    if (acknowledged !== undefined) {
      updateDoc.acknowledged = !!acknowledged;
      updateDoc.acknowledgedAt = acknowledged ? new Date() : undefined;
      updateDoc.acknowledgedBy = acknowledged ? req.user.id : undefined;
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      {
        ...updateDoc,
        ...(response !== undefined || status !== undefined
          ? { respondedBy: req.user.id, respondedAt: new Date() }
          : {}),
      },
      { new: true }
    )
      .populate('user', 'firstName lastName email department')
      .populate('respondedBy', 'firstName lastName')
      .populate('acknowledgedBy', 'firstName lastName');
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Talebi sil (sadece kendi talebi)
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Talep bulunamadı' });
    }
    
    if (request.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu işlemi yapmaya yetkiniz yok' });
    }
    
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'Talep silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: talebi sil
router.delete('/admin/:id', auth, adminOnly, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Talep bulunamadı' });
    await Request.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: 'Talep silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


