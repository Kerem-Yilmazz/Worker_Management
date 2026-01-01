const express = require('express');
const Department = require('../models/Department');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Tüm departmanları getir
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('manager', 'firstName lastName');
    
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Departman ekle (Admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, manager } = req.body;

    const department = new Department({
      name,
      description,
      manager
    });

    await department.save();

    res.status(201).json({
      message: 'Departman başarıyla eklendi',
      department
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Departman güncelle (Admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, manager, isActive } = req.body;
    
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, manager, isActive },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ message: 'Departman bulunamadı' });
    }

    res.json({
      message: 'Departman başarıyla güncellendi',
      department
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Departman sil (Admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Departman bulunamadı' });
    }

    res.json({ message: 'Departman başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router; 