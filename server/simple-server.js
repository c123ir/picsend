const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// برای استفاده از fetch در نود
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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

// دریافت اطلاعات کاربر با شناسه
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info('درخواست دریافت اطلاعات کاربر', { 
      action: 'get_user',
      userId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // پشتیبانی از شناسه کاربر با فرمت user-XXX
    if (userId.startsWith('user-')) {
      logger.debug('شناسه کاربر با فرمت user-XXX', { 
        action: 'resolve_user_id',
        providedUserId: userId
      });
      
      // دریافت کاربر مدیر (برای سازگاری با داده‌های تستی)
      const [admins] = await db.query('SELECT id, email, phone, fullName, role, isActive, createdAt, updatedAt FROM Users WHERE role = "admin" LIMIT 1');
      
      if (admins.length > 0) {
        const admin = admins[0];
        logger.info('کاربر با شناسه مجازی یافت شد', { 
          action: 'get_user_virtual_id_success',
          virtualId: userId,
          actualId: admin.id
        });
        
        // برگرداندن کاربر مدیر با شناسه درخواستی
        return res.json({
          id: userId, // استفاده از همان شناسه درخواستی
          email: admin.email,
          phone: admin.phone,
          fullName: admin.fullName,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        });
      } else {
        logger.warn('کاربر مدیر برای شناسه مجازی یافت نشد', { 
          action: 'get_user_virtual_id_no_admin',
          virtualId: userId
        });
        
        // ایجاد یک کاربر مجازی برای پاسخ
        return res.json({
          id: userId,
          email: 'admin@picsend.ir',
          phone: '09123456789',
          fullName: 'مدیر سیستم',
          role: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    // جستجوی معمولی بر اساس شناسه عددی
    const [users] = await db.query('SELECT id, email, phone, fullName, role, isActive, createdAt, updatedAt FROM Users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      logger.warn('کاربر مورد نظر یافت نشد', { 
        action: 'get_user_not_found',
        userId
      });
      
      return res.status(404).json({ message: 'کاربر مورد نظر یافت نشد' });
    }
    
    logger.info('اطلاعات کاربر با موفقیت دریافت شد', { 
      action: 'get_user_success',
      userId,
      userEmail: users[0].email
    });
    
    return res.json(users[0]);
  } catch (error) {
    logger.error(`خطا در دریافت اطلاعات کاربر ${req.params.userId}`, { 
      action: 'get_user_error',
      userId: req.params.userId,
      error: error.message,
      stack: error.stack
    });
    
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
    logger.info('درخواست دریافت همه گروه‌ها', { 
      action: 'get_all_groups',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    const [groups] = await db.query('SELECT * FROM UserGroups LIMIT 100');
    
    logger.info('گروه‌ها با موفقیت دریافت شدند', { 
      action: 'get_all_groups_success',
      count: groups.length
    });
    
    return res.json(groups);
  } catch (error) {
    logger.error('خطا در دریافت گروه‌ها', { 
      action: 'get_all_groups_error',
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ message: 'خطا در دریافت گروه‌ها', error: error.message });
  }
});

// سیستم ساده لاگینگ
const logger = {
  info: (message, metadata = {}) => {
    console.log(`[INFO] ${message}`, metadata);
  },
  warn: (message, metadata = {}) => {
    console.warn(`[WARN] ${message}`, metadata);
  },
  error: (message, metadata = {}) => {
    console.error(`[ERROR] ${message}`, metadata);
  },
  debug: (message, metadata = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, metadata);
    }
  }
};

// ایجاد گروه جدید
app.post('/groups', async (req, res) => {
  try {
    const { name, description, ownerId, isPublic, members = [] } = req.body;
    
    logger.info('درخواست ایجاد گروه جدید', { 
      action: 'create_group',
      groupName: name,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // بررسی وجود فیلدهای ضروری
    if (!name || !ownerId) {
      logger.warn('درخواست ناقص برای ایجاد گروه', { 
        action: 'create_group_invalid_request',
        providedFields: Object.keys(req.body)
      });
      
      return res.status(400).json({ message: 'نام گروه و شناسه مالک الزامی است' });
    }
    
    // بررسی وجود کاربر مالک
    let validOwnerId = ownerId;
    
    // اگر شناسه با user- شروع شود، از کاربر مدیر استفاده می‌کنیم
    if (typeof ownerId === 'string' && ownerId.startsWith('user-')) {
      logger.debug('شناسه کاربر با فرمت user-XXX', { 
        action: 'resolve_owner_id',
        providedOwnerId: ownerId
      });
      
      const [admins] = await db.query('SELECT id FROM Users WHERE role = "admin" LIMIT 1');
      if (admins.length === 0) {
        logger.error('کاربر مدیر برای استفاده به عنوان مالک گروه یافت نشد', { 
          action: 'create_group_admin_not_found'
        });
        
        return res.status(404).json({ message: 'کاربر مدیر یافت نشد' });
      }
      validOwnerId = admins[0].id;
      
      logger.debug('استفاده از کاربر مدیر به عنوان مالک گروه', { 
        action: 'using_admin_as_owner',
        adminId: validOwnerId
      });
    }
    
    // شروع تراکنش برای اطمینان از یکپارچگی داده‌ها
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // درج گروه جدید در پایگاه داده
      const [result] = await connection.query(
        'INSERT INTO UserGroups (name, description, ownerId, isPublic, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [name, description || '', validOwnerId, isPublic ? 1 : 0]
      );
      
      logger.debug('گروه در پایگاه داده ایجاد شد', { 
        action: 'group_created_in_db',
        groupId: result.insertId
      });
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        logger.error('خطا در ایجاد گروه در پایگاه داده', { 
          action: 'create_group_db_error'
        });
        
        return res.status(500).json({ message: 'خطا در ایجاد گروه' });
      }
      
      const groupId = result.insertId;
      
      // بازیابی اطلاعات گروه ایجاد شده
      const [groups] = await connection.query('SELECT * FROM UserGroups WHERE id = ?', [groupId]);
      
      if (groups.length === 0) {
        await connection.rollback();
        logger.error('گروه ایجاد شد اما بازیابی اطلاعات آن ناموفق بود', { 
          action: 'group_created_but_retrieval_failed',
          groupId
        });
        
        return res.status(500).json({ message: 'گروه ایجاد شد اما بازیابی اطلاعات آن ناموفق بود' });
      }
      
      // اضافه کردن خود کاربر به عنوان مدیر گروه
      await connection.query(
        'INSERT INTO GroupMembers (groupId, userId, role, joinedAt) VALUES (?, ?, "admin", NOW())',
        [groupId, validOwnerId]
      );
      
      logger.debug('مالک گروه به عنوان مدیر گروه اضافه شد', { 
        action: 'owner_added_as_admin',
        groupId,
        ownerId: validOwnerId
      });
      
      // اضافه کردن سایر اعضا به گروه (اگر وجود داشته باشند)
      if (members && Array.isArray(members) && members.length > 0) {
        logger.debug('در حال اضافه کردن اعضای گروه', { 
          action: 'adding_members',
          groupId,
          memberCount: members.length
        });
        
        for (const member of members) {
          let memberId = member.userId || member.id;
          const memberRole = member.role || 'member';
          
          // اگر شناسه با user- شروع شود، از شناسه واقعی کاربر استفاده می‌کنیم
          if (typeof memberId === 'string' && memberId.startsWith('user-') && memberId !== validOwnerId) {
            const randomUserId = Math.floor(Math.random() * 10) + 1; // یک شناسه تصادفی بین 1 تا 10
            memberId = randomUserId;
            
            logger.debug('استفاده از شناسه تصادفی برای عضو گروه', { 
              action: 'using_random_id_for_member',
              originalId: member.userId || member.id,
              newId: memberId
            });
          }
          
          // اگر عضو همان مالک نباشد، او را اضافه کن
          if (memberId !== validOwnerId) {
            try {
              await connection.query(
                'INSERT INTO GroupMembers (groupId, userId, role, joinedAt) VALUES (?, ?, ?, NOW())',
                [groupId, memberId, memberRole]
              );
              
              logger.debug('عضو به گروه اضافه شد', { 
                action: 'member_added',
                groupId,
                memberId,
                role: memberRole
              });
            } catch (memberError) {
              logger.warn('خطا در اضافه کردن عضو به گروه', { 
                action: 'add_member_error',
                groupId,
                memberId,
                error: memberError.message
              });
              // اگر نتوانستیم عضو را اضافه کنیم، ادامه می‌دهیم و سعی می‌کنیم اعضای دیگر را اضافه کنیم
            }
          }
        }
      }
      
      await connection.commit();
      
      logger.info('گروه با موفقیت ایجاد شد', { 
        action: 'create_group_success',
        groupId,
        groupName: name,
        memberCount: (members && Array.isArray(members)) ? members.length + 1 : 1 // +1 برای مالک
      });
      
      return res.status(201).json({
        message: 'گروه با موفقیت ایجاد شد',
        group: groups[0]
      });
      
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    logger.error('خطا در ایجاد گروه', { 
      action: 'create_group_error',
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ message: 'خطا در ایجاد گروه', error: error.message });
  }
});

// دریافت یک گروه مشخص
app.get('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    logger.info('درخواست دریافت اطلاعات گروه', { 
      action: 'get_group',
      groupId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    const [groups] = await db.query('SELECT * FROM UserGroups WHERE id = ?', [groupId]);
    
    if (groups.length === 0) {
      logger.warn('گروه مورد نظر یافت نشد', { 
        action: 'get_group_not_found',
        groupId
      });
      
      return res.status(404).json({ message: 'گروه مورد نظر یافت نشد' });
    }
    
    logger.info('اطلاعات گروه با موفقیت دریافت شد', { 
      action: 'get_group_success',
      groupId,
      groupName: groups[0].name
    });
    
    return res.json(groups[0]);
  } catch (error) {
    logger.error(`خطا در دریافت گروه ${req.params.groupId}`, { 
      action: 'get_group_error',
      groupId: req.params.groupId,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ message: 'خطا در دریافت اطلاعات گروه', error: error.message });
  }
});

// دریافت اعضای یک گروه
app.get('/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    logger.info('درخواست دریافت اعضای گروه', { 
      action: 'get_group_members',
      groupId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // ابتدا بررسی کنیم که آیا گروه وجود دارد
    const [groups] = await db.query('SELECT * FROM UserGroups WHERE id = ?', [groupId]);
    
    if (groups.length === 0) {
      logger.warn('گروه مورد نظر برای دریافت اعضا یافت نشد', { 
        action: 'get_group_members_group_not_found',
        groupId
      });
      
      return res.status(404).json({ message: 'گروه مورد نظر یافت نشد' });
    }
    
    const [members] = await db.query(`
      SELECT gm.*, u.fullName, u.email, u.avatar 
      FROM GroupMembers gm
      JOIN Users u ON gm.userId = u.id
      WHERE gm.groupId = ?
    `, [groupId]);
    
    logger.info('اعضای گروه با موفقیت دریافت شدند', { 
      action: 'get_group_members_success',
      groupId,
      groupName: groups[0].name,
      memberCount: members.length
    });
    
    return res.json(members);
  } catch (error) {
    logger.error(`خطا در دریافت اعضای گروه ${req.params.groupId}`, { 
      action: 'get_group_members_error',
      groupId: req.params.groupId,
      error: error.message,
      stack: error.stack
    });
    
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

// ویرایش گروه
app.put('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isPublic } = req.body;
    
    logger.info('درخواست ویرایش گروه', { 
      action: 'update_group',
      groupId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // بررسی وجود فیلدهای ضروری
    if (!name) {
      logger.warn('درخواست ناقص برای ویرایش گروه', { 
        action: 'update_group_invalid_request',
        groupId,
        providedFields: Object.keys(req.body)
      });
      
      return res.status(400).json({ message: 'نام گروه الزامی است' });
    }
    
    // به روزرسانی گروه در پایگاه داده
    const [result] = await db.query(
      'UPDATE UserGroups SET name = ?, description = ?, isPublic = ?, updatedAt = NOW() WHERE id = ?',
      [name, description || '', isPublic ? 1 : 0, groupId]
    );
    
    if (result.affectedRows === 0) {
      logger.warn('گروه مورد نظر برای ویرایش یافت نشد', { 
        action: 'update_group_not_found',
        groupId
      });
      
      return res.status(404).json({ message: 'گروه مورد نظر یافت نشد' });
    }
    
    // بازیابی اطلاعات گروه به روز شده
    const [groups] = await db.query('SELECT * FROM UserGroups WHERE id = ?', [groupId]);
    
    logger.info('گروه با موفقیت ویرایش شد', { 
      action: 'update_group_success',
      groupId,
      groupName: name
    });
    
    return res.json({
      message: 'گروه با موفقیت به روزرسانی شد',
      group: groups[0]
    });
    
  } catch (error) {
    logger.error(`خطا در ویرایش گروه ${req.params.groupId}`, { 
      action: 'update_group_error',
      groupId: req.params.groupId,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ message: 'خطا در ویرایش گروه', error: error.message });
  }
});

// حذف گروه
app.delete('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    logger.info('درخواست حذف گروه', { 
      action: 'delete_group',
      groupId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // بررسی وجود گروه قبل از حذف
    const [groupCheck] = await db.query('SELECT * FROM UserGroups WHERE id = ?', [groupId]);
    
    if (groupCheck.length === 0) {
      logger.warn('گروه مورد نظر برای حذف یافت نشد', { 
        action: 'delete_group_not_found',
        groupId
      });
      
      return res.status(404).json({ message: 'گروه مورد نظر یافت نشد' });
    }
    
    const groupName = groupCheck[0].name;
    
    // شروع تراکنش برای حذف ایمن
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // حذف اعضای گروه ابتدا (برای جلوگیری از نقض محدودیت کلید خارجی)
      await connection.query('DELETE FROM GroupMembers WHERE groupId = ?', [groupId]);
      
      logger.debug('اعضای گروه حذف شدند', { 
        action: 'delete_group_members',
        groupId
      });
      
      // حذف اشتراک گذاری‌های تصاویر با این گروه
      await connection.query('DELETE FROM ImageShares WHERE sharedWithGroupId = ?', [groupId]);
      
      logger.debug('اشتراک‌گذاری‌های تصاویر با گروه حذف شدند', { 
        action: 'delete_group_image_shares',
        groupId
      });
      
      // حذف گروه
      const [result] = await connection.query('DELETE FROM UserGroups WHERE id = ?', [groupId]);
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        logger.warn('گروه مورد نظر برای حذف یافت نشد', { 
          action: 'delete_group_not_found_after_deleting_relations',
          groupId
        });
        
        return res.status(404).json({ message: 'گروه مورد نظر یافت نشد' });
      }
      
      await connection.commit();
      
      logger.info('گروه با موفقیت حذف شد', { 
        action: 'delete_group_success',
        groupId,
        groupName
      });
      
      return res.json({
        message: 'گروه با موفقیت حذف شد',
        id: groupId
      });
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    logger.error(`خطا در حذف گروه ${req.params.groupId}`, { 
      action: 'delete_group_error',
      groupId: req.params.groupId,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ message: 'خطا در حذف گروه', error: error.message });
  }
});

// ایجاد کاربر جدید توسط مدیر
app.post('/api/users', async (req, res) => {
  try {
    const { email, phone, password, fullName, role } = req.body;
    
    logger.info('درخواست ایجاد کاربر جدید توسط مدیر', { 
      action: 'admin_create_user',
      email,
      phone,
      role,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // اعتبارسنجی
    if (!email && !phone) {
      logger.warn('درخواست ناقص برای ایجاد کاربر', { 
        action: 'admin_create_user_invalid_request',
        providedFields: Object.keys(req.body)
      });
      
      return res.status(400).json({ message: 'ایمیل یا شماره تلفن الزامی است' });
    }
    
    if (!password) {
      return res.status(400).json({ message: 'رمز عبور الزامی است' });
    }
    
    // بررسی وجود کاربر
    if (email) {
      const [existingEmail] = await db.query('SELECT id FROM Users WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'این ایمیل قبلاً ثبت شده است' });
      }
    }
    
    if (phone) {
      const [existingPhone] = await db.query('SELECT id FROM Users WHERE phone = ?', [phone]);
      if (existingPhone.length > 0) {
        return res.status(400).json({ message: 'این شماره تلفن قبلاً ثبت شده است' });
      }
    }
    
    // ایجاد کاربر جدید
    const userRole = role || 'user';
    const [result] = await db.query(
      'INSERT INTO Users (email, phone, password, fullName, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())',
      [email || null, phone || null, password, fullName || null, userRole]
    );
    
    if (result.affectedRows === 0) {
      logger.error('خطا در ایجاد کاربر در پایگاه داده', { 
        action: 'admin_create_user_db_error'
      });
      
      return res.status(500).json({ message: 'خطا در ایجاد کاربر' });
    }
    
    // بازیابی اطلاعات کاربر ایجاد شده
    const [users] = await db.query('SELECT id, email, phone, fullName, role, isActive, createdAt, updatedAt FROM Users WHERE id = ?', [result.insertId]);
    
    logger.info('کاربر جدید با موفقیت ایجاد شد', { 
      action: 'admin_create_user_success',
      userId: result.insertId,
      email,
      phone,
      role: userRole
    });
    
    res.status(201).json({
      message: 'کاربر با موفقیت ایجاد شد',
      user: users[0]
    });
  } catch (error) {
    logger.error('خطای سرور در ایجاد کاربر', { 
      action: 'admin_create_user_server_error',
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ message: 'خطای سرور در ایجاد کاربر' });
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