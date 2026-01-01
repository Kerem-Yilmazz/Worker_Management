const express = require('express');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Admin: duyuru oluştur
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, message, audience, workers: selectedWorkersFromBody } = req.body;

    // 1) Sadece seçilen işçilere gönderim (selectAll => o anki tüm işçiler snapshot alınır)
    let recipientIds = [];
    if (audience === 'all') {
      const allWorkers = await User.find({ role: 'worker', isActive: true }).select('_id');
      recipientIds = allWorkers.map(w => w._id);
    } else if (audience === 'specific' && Array.isArray(selectedWorkersFromBody)) {
      recipientIds = selectedWorkersFromBody;
    }

    if (!recipientIds.length) {
      return res.status(400).json({ message: 'Duyurunun gönderileceği işçi seçimi yapılmadı' });
    }

    const announcementData = {
      title,
      message,
      createdBy: req.user._id,
      audience: 'specific',
      workers: recipientIds,
    };

    const item = await Announcement.create(announcementData);
    
    // Populate referansları
    await item.populate('department', 'name');
    await item.populate('workers', 'firstName lastName');
    await item.populate('createdBy', 'firstName lastName');
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Duyuru oluşturulamadı', error: error.message });
  }
});

// İşçi: duyuruları listele (yalnızca kendisine gönderilenler)
router.get('/', auth, async (req, res) => {
  try {
    const isWorker = req.user.role === 'worker';
    const query = isWorker
      ? { workers: { $in: [req.user._id] } }
      : { createdBy: req.user._id };

    const items = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName')
      .populate('department', 'name')
      .populate('workers', 'firstName lastName');

    console.log('Announcements found for user', req.user._id?.toString(), 'count:', items.length);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Duyurular alınamadı', error: error.message });
  }
});

// Admin: tüm duyuruları listele
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const items = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName')
      .populate('department', 'name')
      .populate('workers', 'firstName lastName');

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Duyurular alınamadı', error: error.message });
  }
});

// Admin: duyuru güncelle (yalnızca başlık/mesaj)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, message } = req.body;
    const update = {};
    if (typeof title === 'string') update.title = title;
    if (typeof message === 'string') update.message = message;

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: 'Güncellenecek alan bulunamadı' });
    }

    // Yalnızca kendi oluşturduğu duyuruyu güncellesin
    const updated = await Announcement.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Duyuru bulunamadı' });
    }

    await updated.populate('createdBy', 'firstName lastName');
    await updated.populate('department', 'name');
    await updated.populate('workers', 'firstName lastName');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Duyuru güncellenemedi', error: error.message });
  }
});

// Admin: duyuru sil
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Duyuru bulunamadı' });
    }

    res.json({ message: 'Duyuru başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Duyuru silinemedi', error: error.message });
  }
});

module.exports = router;


