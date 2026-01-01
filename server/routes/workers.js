const express = require('express');
const User = require('../models/User');
const Salary = require('../models/Salary');
const Position = require('../models/Position');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Pozisyon bazlı maaş şablonları
const getSalaryByPosition = (positionLevel) => {
  const baseSalaries = {
    1: 8000,   // Stajyer
    2: 12000,  // Junior
    3: 18000,  // Mid-level
    4: 25000,  // Senior
    5: 35000,  // Lead
    6: 45000,  // Manager
    7: 55000,  // Senior Manager
    8: 70000,  // Director
    9: 90000,  // VP
    10: 120000 // C-Level
  };
  
  return baseSalaries[positionLevel] || 15000;
};

// Tüm işçileri getir (Admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' })
      .select('-password')
      .populate('department', 'name')
      .populate('position', 'name level');
    
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// İşçi ekle (Admin only)
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, password, department, position, baseSalary, bonus, deductions } = req.body;
    
    // Email'i otomatik olarak tamamla
    const fullEmail = email.includes('@') ? email : `${email}@karaholding.com`;
    
    // Email zaten kullanımda mı kontrol et
    const existingUser = await User.findOne({ email: fullEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
    }

    // Yeni işçi oluştur
    const worker = new User({
      firstName,
      lastName,
      email: fullEmail,
      password,
      role: 'worker',
      department,
      position
    });

    await worker.save();
    
    // Maaş ekle - pozisyon seçilmişse otomatik maaş ata
    if (position) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Pozisyon bilgisini al
      const positionDoc = await Position.findById(position);
      
      // Frontend'den gelen maaş bilgilerini kullan, yoksa pozisyon bazlı varsayılan
      const finalBaseSalary = baseSalary || getSalaryByPosition(positionDoc?.level);
      
      // Aynı ay/yıl için maaş var mı kontrol et
      let existingSalary = await Salary.findOne({ 
        user: worker._id, 
        month: currentMonth, 
        year: currentYear 
      });
      
      if (existingSalary) {
        // Mevcut maaşı güncelle
        existingSalary.baseSalary = finalBaseSalary;
        existingSalary.bonus = bonus || 0;
        existingSalary.deductions = deductions || 0;
        existingSalary.netSalary = finalBaseSalary + (bonus || 0) - (deductions || 0);
        await existingSalary.save();
      } else {
        // Yeni maaş ekle
        const salary = new Salary({
          user: worker._id,
          month: currentMonth,
          year: currentYear,
          baseSalary: finalBaseSalary,
          bonus: bonus || 0,
          deductions: deductions || 0,
          netSalary: finalBaseSalary + (bonus || 0) - (deductions || 0)
        });
        
        await salary.save();
      }
    }
    
    // Department ve position bilgilerini populate et
    await worker.populate('department');
    await worker.populate('position');
    
    res.status(201).json({
      message: 'İşçi ve maaş başarıyla eklendi',
      worker,
      salaryAdded: !!position
    });
  } catch (error) {
    console.error('İşçi ekleme hatası:', error);
    res.status(500).json({ message: 'İşçi eklenirken hata oluştu' });
  }
});

// İşçi güncelle (Admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, department, position, isActive, baseSalary, bonus, deductions } = req.body;
    
    const worker = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, department, position, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!worker) {
      return res.status(404).json({ message: 'İşçi bulunamadı' });
    }

    // Maaş bilgilerini güncelle veya oluştur
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Aynı ay/yıl için maaş var mı kontrol et
    let existingSalary = await Salary.findOne({ 
      user: worker._id, 
      month: currentMonth, 
      year: currentYear 
    });
    
    if (existingSalary) {
      // Mevcut maaşı güncelle
      if (baseSalary !== undefined) existingSalary.baseSalary = baseSalary;
      if (bonus !== undefined) existingSalary.bonus = bonus;
      if (deductions !== undefined) existingSalary.deductions = deductions;
      
      // Net maaşı hesapla
      existingSalary.netSalary = existingSalary.baseSalary + (existingSalary.bonus || 0) - (existingSalary.deductions || 0);
      await existingSalary.save();
    } else if (baseSalary || position) {
      // Yeni maaş oluştur
      let finalBaseSalary = baseSalary;
      
      // Eğer baseSalary verilmemişse ve pozisyon varsa, pozisyon bazlı hesapla
      if (!finalBaseSalary && position) {
        const positionDoc = await Position.findById(position);
        finalBaseSalary = getSalaryByPosition(positionDoc?.level);
      }
      
      if (finalBaseSalary) {
        const salary = new Salary({
          user: worker._id,
          month: currentMonth,
          year: currentYear,
          baseSalary: finalBaseSalary,
          bonus: bonus || 0,
          deductions: deductions || 0,
          netSalary: finalBaseSalary + (bonus || 0) - (deductions || 0)
        });
        
        await salary.save();
      }
    }

    // Department ve position bilgilerini populate et
    await worker.populate('department');
    await worker.populate('position');

    res.json({
      message: 'İşçi başarıyla güncellendi',
      worker
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// İşçi sil (Admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const worker = await User.findByIdAndDelete(req.params.id);
    
    if (!worker) {
      return res.status(404).json({ message: 'İşçi bulunamadı' });
    }

    // İşçiye ait tüm maaş kayıtlarını sil
    await Salary.deleteMany({ user: req.params.id });

    res.json({ message: 'İşçi ve maaş kayıtları başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// İşçi detayı (Admin veya kendisi)
router.get('/:id', auth, async (req, res) => {
  try {
    // Admin tüm işçileri görebilir, işçi sadece kendini
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Bu işlemi yapamazsınız' });
    }

    const worker = await User.findById(req.params.id)
      .select('-password')
      .populate('department', 'name');
    
    if (!worker) {
      return res.status(404).json({ message: 'İşçi bulunamadı' });
    }

    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router; 