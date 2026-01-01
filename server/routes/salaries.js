const express = require('express');
const Salary = require('../models/Salary');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Maaşları getir (Admin tümünü, işçi sadece kendininkini)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    console.log('Salaries request from user:', req.user.role, req.user._id);
    
    // İşçi sadece kendi maaşlarını görebilir
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    console.log('Salaries query:', query);

    const salaries = await Salary.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ year: -1, month: -1 });
    
    console.log('Found salaries:', salaries.length);
    salaries.forEach(s => console.log('-', s.user?.firstName, s.user?.lastName, ':', s.baseSalary, 'TL, User ID:', s.user?._id, 'Type:', typeof s.user?._id));
    
    res.json(salaries);
  } catch (error) {
    console.error('Salaries error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Maaş ekle (Admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { user, month, year, baseSalary, bonus, deductions } = req.body;

    const salary = new Salary({
      user,
      month,
      year,
      baseSalary,
      bonus: bonus || 0,
      deductions: deductions || 0
    });

    await salary.save();

    res.status(201).json({
      message: 'Maaş başarıyla eklendi',
      salary
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu ay için maaş zaten tanımlanmış' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Maaş güncelle (Admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { baseSalary, bonus, deductions, isPaid, paymentDate } = req.body;
    
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { baseSalary, bonus, deductions, isPaid, paymentDate },
      { new: true, runValidators: true }
    );

    if (!salary) {
      return res.status(404).json({ message: 'Maaş bulunamadı' });
    }

    res.json({
      message: 'Maaş başarıyla güncellendi',
      salary
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Maaş sil (Admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Maaş bulunamadı' });
    }

    res.json({ message: 'Maaş başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Maaş özeti (Admin için genel, işçi için kişisel)
router.get('/summary', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Bu ay ve yıl için maaş
    const currentSalary = await Salary.findOne({
      ...query,
      year: currentYear,
      month: currentMonth
    }).populate('user', 'firstName lastName');

    // Toplam maaş
    const totalSalary = await Salary.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);

    // Yıllık maaş dağılımı
    const yearlyDistribution = await Salary.aggregate([
      { $match: query },
      { $group: { _id: '$year', total: { $sum: '$netSalary' } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      currentSalary,
      totalSalary: totalSalary[0]?.total || 0,
      yearlyDistribution
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router; 