const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const departmentRoutes = require('./routes/departments');
const salaryRoutes = require('./routes/salaries');
const positionRoutes = require('./routes/positions');
const announcementRoutes = require('./routes/announcements');
const requestRoutes = require('./routes/requests');
const leaveRoutes = require('./routes/leaves');
const overtimeRoutes = require('./routes/overtime');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worker-management')
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/overtime', overtimeRoutes);

// Ana route
app.get('/', (req, res) => {
  res.json({ message: 'Worker Management API çalışıyor!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 