const mysql = require('mysql2/promise');
require('dotenv').config();

// تنظیمات اتصال به پایگاه داده
const dbConfig = {
  host: '127.0.0.1', // استفاده مستقیم از IP به جای localhost
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'picsend',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// تابع اصلی برای آزمایش پایگاه داده
async function testDatabaseConnection() {
  let connection;
  try {
    console.log('در حال اتصال به پایگاه داده...');
    console.log('تنظیمات اتصال:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    // ایجاد اتصال به پایگاه داده
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ اتصال به پایگاه داده با موفقیت برقرار شد!');
    
    // بررسی جدول‌های موجود
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nجدول‌های موجود در پایگاه داده:');
    tables.forEach(table => {
      const tableName = table[`Tables_in_${dbConfig.database}`];
      console.log(`- ${tableName}`);
    });
    
    // بررسی کاربران
    const [users] = await connection.query('SELECT id, email, phone, fullName, role FROM Users LIMIT 10');
    console.log('\nکاربران موجود:');
    if (users.length === 0) {
      console.log('هیچ کاربری یافت نشد.');
    } else {
      users.forEach(user => {
        console.log(`- ${user.id}: ${user.fullName} (${user.email}), نقش: ${user.role}`);
      });
    }
    
    // بررسی گروه‌ها
    const [groups] = await connection.query('SELECT id, name, ownerId FROM UserGroups LIMIT 10');
    console.log('\nگروه‌های موجود:');
    if (groups.length === 0) {
      console.log('هیچ گروهی یافت نشد.');
    } else {
      groups.forEach(group => {
        console.log(`- ${group.id}: ${group.name} (مالک: ${group.ownerId})`);
      });
    }
    
    // بررسی تصاویر
    const [images] = await connection.query('SELECT id, userId, filename, isPublic FROM Images LIMIT 10');
    console.log('\nتصاویر موجود:');
    if (images.length === 0) {
      console.log('هیچ تصویری یافت نشد.');
    } else {
      images.forEach(image => {
        console.log(`- ${image.id}: ${image.filename} (کاربر: ${image.userId}, عمومی: ${image.isPublic ? 'بله' : 'خیر'})`);
      });
    }
    
    console.log('\n✅ تست پایگاه داده با موفقیت انجام شد!');
    return true;
    
  } catch (error) {
    console.error('❌ خطا در اتصال به پایگاه داده:', error.message);
    console.error('جزئیات خطا:', error);
    return false;
  } finally {
    if (connection) {
      console.log('بستن اتصال به پایگاه داده...');
      await connection.end();
    }
  }
}

// اجرای تست
testDatabaseConnection()
  .then(result => {
    console.log(result ? 'تست با موفقیت انجام شد.' : 'تست با خطا مواجه شد.');
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('خطا در اجرای تست:', err);
    process.exit(1);
  }); 