const express = require('express');
const Position = require('../models/Position');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Tüm pozisyonları getir
router.get('/', auth, async (req, res) => {
  try {
    const positions = await Position.find({ isActive: true })
      .populate('department', 'name')
      .sort({ department: 1, level: 1 });
    
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Departmana göre pozisyonları getir
router.get('/department/:departmentId', auth, async (req, res) => {
  try {
    const positions = await Position.find({ 
      department: req.params.departmentId,
      isActive: true 
    }).sort({ level: 1 });
    
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Pozisyon ekle (Admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, department, level, description } = req.body;

    const position = new Position({
      name,
      department,
      level: level || 1,
      description
    });

    await position.save();

    const savedPosition = await Position.findById(position._id)
      .populate('department', 'name');

    res.status(201).json({
      message: 'Pozisyon başarıyla eklendi',
      position: savedPosition
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu departmanda aynı isimde pozisyon zaten var' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Pozisyon güncelle (Admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, level, description, isActive } = req.body;
    
    const position = await Position.findByIdAndUpdate(
      req.params.id,
      { name, level, description, isActive },
      { new: true, runValidators: true }
    ).populate('department', 'name');

    if (!position) {
      return res.status(404).json({ message: 'Pozisyon bulunamadı' });
    }

    res.json({
      message: 'Pozisyon başarıyla güncellendi',
      position
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Pozisyon sil (Admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const position = await Position.findByIdAndDelete(req.params.id);
    
    if (!position) {
      return res.status(404).json({ message: 'Pozisyon bulunamadı' });
    }

    res.json({ message: 'Pozisyon başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router; 