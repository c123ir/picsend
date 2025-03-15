// server/scripts/setup-database.js
require('dotenv').config({ path: `${__dirname}/../.env` });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { loggingClient } = require('../src/utils/logging-client');

async function setupDatabase() {
  const startTime = Date.now();
  loggingClient.info('شروع راه‌اندازی دیتابیس', {
    action: 'setup_database_start',
    database: process.env.DB_NAME || 'picsend'
  });

  // خواندن اسکریپت SQL
  const sqlScript = fs.readFileSync(
    path.join(__dirname, 'setup-database.sql'),
    'utf8'
  );

  // تقسیم اسکریپت به دستورات مجزا
  const statements = sqlScript
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);

  // تنظیمات اتصال به MySQL بدون انتخاب دیتابیس
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123',
    multipleStatements: true
  };

  let connection;
  try {
    // اتصال به MySQL
    loggingClient.info('اتصال به MySQL', {
      action: 'mysql_connect',
      host: connectionConfig.host
    });
    
    connection = await mysql.createConnection(connectionConfig);
    
    // اجرای دستورات SQL
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        loggingClient.debug('اجرای دستور SQL', {
          action: 'execute_sql',
          statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
        });
        
        await connection.query(statement);
      } catch (error) {
        loggingClient.error('خطا در اجرای دستور SQL', {
          action: 'sql_error',
          statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : ''),
          error: error.message
        });
        
        throw error;
      }
    }

    // بررسی دیتابیس پس از راه‌اندازی
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [process.env.DB_NAME || 'picsend']);

    loggingClient.info('راه‌اندازی دیتابیس با موفقیت انجام شد', {
      action: 'setup_database_success',
      database: process.env.DB_NAME || 'picsend',
      tables: tables.map(t => t.TABLE_NAME),
      duration: `${Date.now() - startTime}ms`
    });

    console.log('✅ راه‌اندازی دیتابیس با موفقیت انجام شد.');
    console.log('جداول ایجاد شده:');
    tables.forEach(table => {
      console.log(`- ${table.TABLE_NAME}`);
    });

  } catch (error) {
    loggingClient.error('خطا در راه‌اندازی دیتابیس', {
      action: 'setup_database_error',
      error: error.message,
      stack: error.stack
    });
    
    console.error('❌ خطا در راه‌اندازی دیتابیس:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      loggingClient.debug('اتصال به MySQL بسته شد', {
        action: 'mysql_disconnect'
      });
    }
    
    // قطع اتصال از سرویس لاگینگ
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(0);
  }
}

setupDatabase(); 