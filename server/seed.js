const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Position = require('./models/Position');
require('dotenv').config({ path: './config.env' });

async function seedDatabase() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worker-management');
    console.log('MongoDB bağlantısı başarılı');

    // Mevcut verileri temizle
    await User.deleteMany({});
    await Department.deleteMany({});
    await Position.deleteMany({});
    console.log('Mevcut veriler temizlendi');

    // Genel Müdürlük departmanı oluştur
    const genelMudurluk = new Department({
      name: 'Genel Müdürlük',
      description: 'Şirket genel yönetimi ve strateji'
    });
    await genelMudurluk.save();
    console.log('Departman oluşturuldu:', genelMudurluk.name);

    // IT Departmanı oluştur
    const itDepartment = new Department({
      name: 'IT Departmanı',
      description: 'Bilgi Teknolojileri ve Yazılım Geliştirme'
    });
    await itDepartment.save();
    console.log('Departman oluşturuldu:', itDepartment.name);

    // IT Departmanı altında alt departmanlar (pozisyonlar) oluştur
    const itPositions = [
      {
        name: 'Yazılım Geliştirme Birimi',
        department: itDepartment._id,
        level: 5,
        description: 'Yazılım geliştirme ekibi yönetimi'
      },
      {
        name: 'Test Birimi',
        department: itDepartment._id,
        level: 4,
        description: 'Yazılım testleri ve kalite kontrol'
      },
      {
        name: 'DevOps Birimi',
        department: itDepartment._id,
        level: 4,
        description: 'Sistem operasyonları ve deployment'
      },
      {
        name: 'Veri Tabanı Birimi',
        department: itDepartment._id,
        level: 3,
        description: 'Veri tabanı yönetimi ve optimizasyon'
      },
      {
        name: 'Ağ Güvenliği Birimi',
        department: itDepartment._id,
        level: 3,
        description: 'Siber güvenlik ve ağ koruması'
      }
    ];

    for (const posData of itPositions) {
      const position = new Position(posData);
      await position.save();
      console.log('IT Alt Departman oluşturuldu:', position.name);
    }

    // Genel Müdürlük altında pozisyonlar oluştur
    const genelPositions = [
      {
        name: 'Genel Müdür',
        department: genelMudurluk._id,
        level: 10,
        description: 'Şirket genel müdürü'
      },
      {
        name: 'Genel Müdür Yardımcısı',
        department: genelMudurluk._id,
        level: 9,
        description: 'Genel müdür yardımcısı'
      },
      {
        name: 'Strateji Müdürü',
        department: genelMudurluk._id,
        level: 8,
        description: 'Şirket stratejisi ve planlama'
      },
      {
        name: 'İnsan Kaynakları Müdürü',
        department: genelMudurluk._id,
        level: 8,
        description: 'İnsan kaynakları yönetimi'
      },
      {
        name: 'Finans Müdürü',
        department: genelMudurluk._id,
        level: 8,
        description: 'Finansal yönetim ve muhasebe'
      }
    ];

    for (const posData of genelPositions) {
      const position = new Position(posData);
      await position.save();
      console.log('Genel Müdürlük Pozisyonu oluşturuldu:', position.name);
    }

    // Admin kullanıcısı oluştur
    const admin = new User({
      email: 'admin@karaholding.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      department: genelMudurluk._id
    });
    await admin.save();
    console.log('Admin kullanıcısı oluşturuldu:', admin.email);

    // Test işçisi oluştur
    const worker = new User({
      email: 'worker@karaholding.com',
      password: 'worker123',
      firstName: 'Test',
      lastName: 'İşçi',
      role: 'worker',
      department: itDepartment._id,
      position: itPositions[0]._id // Yazılım Geliştirme Birimi
    });
    await worker.save();
    console.log('Test işçisi oluşturuldu:', worker.email);

    console.log('Seed işlemi tamamlandı!');
    console.log('\nTest kullanıcıları:');
    console.log('Admin:', admin.email, 'Şifre: admin123');
    console.log('İşçi:', worker.email, 'Şifre: worker123');
    console.log('\nOluşturulan departmanlar:');
    console.log('- Genel Müdürlük');
    console.log('- IT Departmanı');
    console.log('\nIT Alt Departmanları:');
    itPositions.forEach(pos => console.log(`- ${pos.name} (Seviye: ${pos.level})`));
    console.log('\nGenel Müdürlük Pozisyonları:');
    genelPositions.forEach(pos => console.log(`- ${pos.name} (Seviye: ${pos.level})`));

  } catch (error) {
    console.error('Seed hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

seedDatabase(); 