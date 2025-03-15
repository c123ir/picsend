import { Router } from 'express';
import ImageController from '../controllers/imageController';
import { authenticate } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { loggingClient } from '../utils/logging-client';

const router = Router();
const imageController = new ImageController();

// تنظیمات آپلود تصویر
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    
    // اطمینان از وجود دایرکتوری آپلود
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // ایجاد دایرکتوری برای کاربر
    const userId = (req as any).user?.id;
    const userDir = path.join(uploadDir, `user_${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // ایجاد نام فایل منحصر به فرد
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// فیلتر فایل‌های مجاز
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    loggingClient.warn('تلاش برای آپلود فایل غیرمجاز', {
      mimetype: file.mimetype,
      filename: file.originalname,
      userId: req.user?.id,
      action: 'upload_invalid_file'
    });
    cb(new Error('فرمت فایل پشتیبانی نمی‌شود'));
  }
};

// تنظیمات آپلود
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) // 5MB پیش‌فرض
  }
});

// مسیرهای عمومی
router.get('/public', imageController.getPublicImages);
router.get('/public/:id', imageController.getPublicImage);

// مسیرهای با احراز هویت
router.get('/my', authenticate, imageController.getMyImages);
router.post('/', authenticate, upload.single('image'), imageController.uploadImage);
router.get('/:id', authenticate, imageController.getImage);
router.put('/:id', authenticate, imageController.updateImage);
router.delete('/:id', authenticate, imageController.deleteImage);

// مسیرهای اشتراک‌گذاری
router.post('/:id/share', authenticate, imageController.shareImage);
router.get('/:id/shares', authenticate, imageController.getImageShares);
router.delete('/:id/shares/:shareId', authenticate, imageController.removeImageShare);

// مسیرهای مدیریتی (فقط برای ادمین)
router.get('/admin/all', authenticate, isAdmin, imageController.getAllImages);
router.delete('/admin/:id', authenticate, isAdmin, imageController.adminDeleteImage);

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