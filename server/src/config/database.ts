import { Sequelize } from 'sequelize';
import { loggingClient } from '../utils/logging-client';

const DB_NAME = process.env.DB_NAME || 'picsend';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '123';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? customLogger : false,
  benchmark: true, // فعال کردن اندازه‌گیری زمان اجرای کوئری‌ها
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: false
  }
});

// اضافه کردن هوک‌های لاگینگ به Sequelize
const originalQuery = sequelize.query.bind(sequelize);
sequelize.query = function (...args: any[]) {
  const startTime = Date.now();
  let sql = '';
  
  if (typeof args[0] === 'string') {
    sql = args[0];
  } else if (args[0] && args[0].query) {
    sql = args[0].query;
  }
  
  // حذف اطلاعات حساس از کوئری‌ها در لاگ
  const sanitizedSql = sql
    .replace(/password\s*=\s*['"].*?['"]/gi, 'password=\'***\'')
    .replace(/token\s*=\s*['"].*?['"]/gi, 'token=\'***\'');
  
  return originalQuery(...args)
    .then((result) => {
      const duration = Date.now() - startTime;
      
      // لاگ کوئری‌های طولانی
      if (duration > 1000) {
        loggingClient.warn('کوئری کند', {
          sql: sanitizedSql.substring(0, 200) + (sanitizedSql.length > 200 ? '...' : ''),
          duration: `${duration}ms`,
          type: 'slow_query'
        });
      }
      
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      
      loggingClient.error('خطا در اجرای کوئری', {
        sql: sanitizedSql.substring(0, 200) + (sanitizedSql.length > 200 ? '...' : ''),
        error: error.message,
        code: error.parent?.code,
        duration: `${duration}ms`,
        type: 'database_error'
      });
      
      throw error;
    });
};

export default sequelize;

export const dbConfig = {
  database: process.env.DB_NAME || 'picsend',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? customLogger : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false
  }
}; 