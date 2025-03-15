import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import ImageController from '../controllers/imageController';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { loggingClient } from '../utils/logging-client';

const router = express.Router();
const imageController = new ImageController();

// تنظیمات آپلود فایل
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

// فیلتر فایل‌های مجاز
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    loggingClient.warn('تلاش برای آپلود فایل غیرمجاز', {
      mimetype: file.mimetype,
      filename: file.originalname,
      userId: req.user?.id,
      action: 'upload_invalid_file'
    });
    cb(new Error('نوع فایل پشتیبانی نمی‌شود. فقط تصاویر مجاز هستند.'));
  }
};

// تنظیمات آپلود
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5000000'), // 5MB پیش‌فرض
  }
});

// مسیرهای عمومی
router.get('/public', imageController.getPublicImages);
router.get('/public/:id', imageController.getPublicImage);

// مسیرهای با احراز هویت
router.use(authMiddleware);

// عملیات‌های تصویر
router.get('/', imageController.getMyImages);
router.post('/', upload.single('image'), imageController.uploadImage);
router.get('/:id', imageController.getImage);
router.put('/:id', imageController.updateImage);
router.delete('/:id', imageController.deleteImage);

// اشتراک‌گذاری تصاویر
router.post('/:id/share', imageController.shareImage);
router.get('/:id/shares', imageController.getImageShares);
router.delete('/:id/shares/:shareId', imageController.removeImageShare);

// مسیرهای مدیریتی
router.get('/admin/all', adminMiddleware, imageController.getAllImages);
router.delete('/admin/:id', adminMiddleware, imageController.adminDeleteImage);

// میدل‌ور لاگ کردن درخواست‌های تصویر
router.use((req, res, next) => {
  loggingClient.debug('درخواست به مسیر تصاویر', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    action: 'image_route_request'
  });
  next();
});

export default router; 