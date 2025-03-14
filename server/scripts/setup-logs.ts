import fs from 'fs';
import path from 'path';

const createLogDirectories = () => {
  const baseDir = path.join(__dirname, '../../logs');
  
  // ساختار پوشه‌های لاگ
  const directories = [
    'server/error',
    'server/access',
    'server/debug',
    'server/audit',
    'client/error',
    'client/performance',
    'client/analytics'
  ];

  try {
    // ایجاد پوشه اصلی logs اگر وجود ندارد
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }

    // ایجاد زیرپوشه‌ها
    directories.forEach(dir => {
      const fullPath = path.join(baseDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      
      // تنظیم دسترسی‌ها (777 برای اطمینان از دسترسی کامل در محیط توسعه)
      fs.chmodSync(fullPath, '777');
    });

    console.log('✅ پوشه‌های لاگ با موفقیت ایجاد شدند.');
  } catch (error) {
    console.error('❌ خطا در ایجاد پوشه‌های لاگ:', error);
    process.exit(1);
  }
};

createLogDirectories(); 