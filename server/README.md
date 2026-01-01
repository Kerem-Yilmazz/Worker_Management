# Worker Management - Backend

Bu proje, işçi yönetim sistemi için Node.js + Express + MongoDB tabanlı backend API'sidir.

## Kurulum

1. MongoDB'yi kurun ve çalıştırın
2. Gerekli paketleri yükleyin: `npm install`
3. `.env` dosyasını yapılandırın
4. Veritabanını seed edin: `node seed.js`
5. Sunucuyu başlatın: `npm run dev`

## API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Kullanıcı bilgileri

### İşçi Yönetimi (Admin only)
- `GET /api/workers` - Tüm işçileri listele
- `POST /api/workers` - Yeni işçi ekle
- `PUT /api/workers/:id` - İşçi güncelle
- `DELETE /api/workers/:id` - İşçi sil
- `GET /api/workers/:id` - İşçi detayı

### Departman Yönetimi
- `GET /api/departments` - Tüm departmanları listele
- `POST /api/departments` - Yeni departman ekle (Admin only)
- `PUT /api/departments/:id` - Departman güncelle (Admin only)
- `DELETE /api/departments/:id` - Departman sil (Admin only)

### Maaş Yönetimi
- `GET /api/salaries` - Maaşları listele
- `POST /api/salaries` - Yeni maaş ekle (Admin only)
- `PUT /api/salaries/:id` - Maaş güncelle (Admin only)
- `DELETE /api/salaries/:id` - Maaş sil (Admin only)
- `GET /api/salaries/summary` - Maaş özeti

## Test Kullanıcıları

Seed script çalıştırıldıktan sonra:

- **Admin**: admin@karaholding.com / admin123
- **İşçi**: worker@karaholding.com / worker123

## Çevre Değişkenleri

`config.env` dosyasında:

- `PORT`: Sunucu portu (varsayılan: 5000)
- `MONGODB_URI`: MongoDB bağlantı URI'si
- `JWT_SECRET`: JWT imzalama anahtarı
- `NODE_ENV`: Çevre (development/production) 