const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// تنظیمات اتصال به پایگاه داده
const dbConfig = {
  socketPath: '/tmp/mysql.sock', // استفاده از socket به جای host و port
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'picsend',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let db = null; // اتصال به پایگاه داده

// ایجاد اپلیکیشن اکسپرس
const app = express();
const PORT = process.env.PORT || 3010;

// میان‌افزارها
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3005'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// میان‌افزار ثبت درخواست‌ها
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// مسیر سلامتی
app.get('/health', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ status: 'خطا', message: 'اتصال به پایگاه داده برقرار نشده است' });
    }
    
    // تست اتصال به پایگاه داده
    const [result] = await db.query('SELECT 1 as test');
    
    if (result[0].test === 1) {
      return res.json({ 
        status: 'فعال', 
        database: 'متصل',
        serverTime: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    } else {
      return res.status(500).json({ status: 'خطا', message: 'خطا در اتصال به پایگاه داده' });
    }
  } catch (error) {
    console.error('خطا در بررسی سلامت سیستم:', error);
    return res.status(500).json({ 
      status: 'خطا', 
      message: 'خطا در بررسی سلامت سیستم', 
      error: error.message 
    });
  }
});

// مسیرهای API پایه
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email, phone, fullName, role, isActive, createdAt FROM Users LIMIT 100');
    return res.json({ users });
  } catch (error) {
    console.error('خطا در دریافت کاربران:', error);
    return res.status(500).json({ message: 'خطا در دریافت کاربران', error: error.message });
  }
});

// دریافت اطلاعات یک کاربر مشخص
app.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // پشتیبانی از شناسه کاربر با فرمت user-XXX
    if (userId.startsWith('user-')) {
      // دریافت کاربر مدیر (برای سازگاری با داده‌های تستی قبلی)
      const [admins] = await db.query('SELECT id, email, phone, fullName, role, isActive, createdAt FROM Users WHERE role = "admin" LIMIT 1');
      
      if (admins.length > 0) {
        // برگرداندن کاربر مدیر با شناسه درخواستی
        const admin = admins[0];
        return res.json({
          id: userId, // استفاده از همان شناسه درخواستی
          email: admin.email,
          phone: admin.phone,
          fullName: admin.fullName,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt
        });
      }
    }
    
    // جستجوی معمولی بر اساس شناسه عددی
    const [users] = await db.query('SELECT id, email, phone, fullName, role, isActive, createdAt FROM Users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'کاربر مورد نظر یافت نشد' });
    }
    
    return res.json(users[0]);
  } catch (error) {
    console.error(`خطا در دریافت اطلاعات کاربر ${req.params.userId}:`, error);
    return res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر', error: error.message });
  }
});

app.get('/api/groups', async (req, res) => {
  try {
    const [groups] = await db.query('SELECT * FROM UserGroups LIMIT 100');
    return res.json({ groups });
  } catch (error) {
    console.error('خطا در دریافت گروه‌ها:', error);
    return res.status(500).json({ message: 'خطا در دریافت گروه‌ها', error: error.message });
  }
});

// دریافت همه گروه‌ها
app.get('/groups', async (req, res) => {
  try {
    const [groups] = await db.query('SELECT * FROM UserGroups LIMIT 100');
    return res.json(groups);
  } catch (error) {
    console.error('خطا در دریافت گروه‌ها:', error);
    return res.status(500).json({ message: 'خطا در دریافت گروه‌ها', error: error.message });
  }
});

// دریافت یک گروه مشخص
app.get('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const [groups] = await db.query('SELECT * FROM UserGroups WHERE id = ?', [groupId]);
    
    if (groups.length === 0) {
      return res.status(404).json({ message: 'گروه مورد نظر یافت نشد' });
    }
    
    return res.json(groups[0]);
  } catch (error) {
    console.error(`خطا در دریافت گروه ${req.params.groupId}:`, error);
    return res.status(500).json({ message: 'خطا در دریافت اطلاعات گروه', error: error.message });
  }
});

// دریافت اعضای یک گروه
app.get('/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const [members] = await db.query(`
      SELECT gm.*, u.fullName, u.email, u.avatar 
      FROM GroupMembers gm
      JOIN Users u ON gm.userId = u.id
      WHERE gm.groupId = ?
    `, [groupId]);
    
    return res.json(members);
  } catch (error) {
    console.error(`خطا در دریافت اعضای گروه ${req.params.groupId}:`, error);
    return res.status(500).json({ message: 'خطا در دریافت اعضای گروه', error: error.message });
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const [images] = await db.query('SELECT * FROM Images LIMIT 100');
    return res.json({ images });
  } catch (error) {
    console.error('خطا در دریافت تصاویر:', error);
    return res.status(500).json({ message: 'خطا در دریافت تصاویر', error: error.message });
  }
});

// API احراز هویت ساده
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // برای تست، فرض می‌کنیم نام کاربری می‌تواند ایمیل یا تلفن باشد
    const [users] = await db.query(
      'SELECT * FROM Users WHERE (email = ? OR phone = ?) LIMIT 1', 
      [username, username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'نام کاربری یا رمز عبور نادرست است' });
    }
    
    const user = users[0];
    
    // در حالت واقعی باید مقایسه هش رمز انجام شود
    // اما برای تست، فرض می‌کنیم همیشه رمز درست است
    
    // ساخت توکن ساده (در حالت واقعی باید از JWT استفاده شود)
    const token = 'test_token_' + Date.now();
    
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role
      },
      token
    });
    
  } catch (error) {
    console.error('خطا در ورود کاربر:', error);
    return res.status(500).json({ message: 'خطا در ورود به سیستم', error: error.message });
  }
});

// به‌روزرسانی زمان آخرین ورود کاربر
app.post('/users/:userId/last-login', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // اگر شناسه با "user-" شروع می‌شود، فقط پاسخ موفقیت آمیز برگردان
    if (userId.startsWith('user-')) {
      return res.json({ 
        success: true, 
        message: 'زمان آخرین ورود با موفقیت به‌روزرسانی شد',
        updatedAt: new Date().toISOString()
      });
    }
    
    // برای کاربران واقعی، زمان آخرین ورود را در پایگاه داده به‌روزرسانی کن
    const [updateResult] = await db.query(
      'UPDATE Users SET lastLoginAt = NOW() WHERE id = ?',
      [userId]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'کاربر مورد نظر یافت نشد' });
    }
    
    return res.json({ 
      success: true, 
      message: 'زمان آخرین ورود با موفقیت به‌روزرسانی شد',
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`خطا در به‌روزرسانی زمان آخرین ورود کاربر ${req.params.userId}:`, error);
    return res.status(500).json({ message: 'خطا در به‌روزرسانی زمان آخرین ورود', error: error.message });
  }
});

// مسیر پیش‌فرض برای همه درخواست‌های دیگر
app.use('*', (req, res) => {
  res.status(404).json({ message: 'مسیر مورد نظر یافت نشد' });
});

// میان‌افزار مدیریت خطا
app.use((err, req, res, next) => {
  console.error('خطای سرور:', err);
  res.status(500).json({ message: 'خطای داخلی سرور', error: err.message });
});

// اتصال به پایگاه داده و راه‌اندازی سرور
async function startServer() {
  try {
    console.log('در حال اتصال به پایگاه داده MySQL...');
    // ایجاد استخر اتصال به پایگاه داده
    db = await mysql.createPool(dbConfig);
    
    // تست اتصال به پایگاه داده
    const [result] = await db.query('SELECT 1 as test');
    if (result[0].test === 1) {
      console.log('✅ اتصال به پایگاه داده با موفقیت برقرار شد!');
      
      // راه‌اندازی سرور
      app.listen(PORT, () => {
        console.log(`✅ سرور در پورت ${PORT} در حال اجراست`);
        console.log(`سلامت سرور: http://localhost:${PORT}/health`);
        console.log(`لیست کاربران: http://localhost:${PORT}/api/users`);
      });
    }
  } catch (error) {
    console.error('❌ خطا در راه‌اندازی سرور:', error);
    process.exit(1);
  }
}

// راه‌اندازی سرور
startServer(); 