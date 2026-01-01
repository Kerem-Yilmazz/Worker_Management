const mongoose = require('mongoose');
const User = require('./models/User');
const Salary = require('./models/Salary');
const Position = require('./models/Position');
require('dotenv').config({ path: './config.env' });

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

async function addSalariesToExisting() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worker-management');
    console.log('MongoDB bağlantısı başarılı');

    // Pozisyonu olan işçileri bul
    const workers = await User.find({ 
      role: 'worker', 
      position: { $exists: true, $ne: null } 
    }).populate('position');

    console.log(`${workers.length} işçi bulundu`);

    for (const worker of workers) {
      // Bu işçi için maaş var mı kontrol et
      const existingSalary = await Salary.findOne({ 
        user: worker._id,
        month: 8, // Ağustos
        year: 2025
      });

      if (!existingSalary && worker.position) {
        const baseSalary = getSalaryByPosition(worker.position.level);
        
        const salary = new Salary({
          user: worker._id,
          month: 8, // Ağustos
          year: 2025,
          baseSalary: baseSalary,
          bonus: 0,
          deductions: 0,
          netSalary: baseSalary // Manuel olarak ekle
        });

        await salary.save();
        console.log(`${worker.firstName} ${worker.lastName} için maaş eklendi: ${baseSalary} TL`);
      } else if (existingSalary) {
        console.log(`${worker.firstName} ${worker.lastName} için maaş zaten mevcut`);
      }
    }

    console.log('Maaş ekleme işlemi tamamlandı!');
    process.exit(0);

  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

addSalariesToExisting();
