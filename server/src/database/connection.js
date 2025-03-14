// server/src/database/connection.js
const mysql = require('mysql2/promise');
const { loggingClient } = require('../utils/logging-client');

// تنظیمات اتصال
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123',
    database: process.env.DB_NAME || 'picsend',
    waitForConnections: true,
    // server/src/database/connection.js (ادامه)
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

/**
 * ایجاد و بازگرداندن استخر اتصال به دیتابیس
 * @returns {mysql.Pool}
 */
function getPool() {
    if (!pool) {
        try {
            // ایجاد استخر اتصال
            pool = mysql.createPool(dbConfig);
            
            loggingClient.info('استخر اتصال به دیتابیس ایجاد شد', {
                host: dbConfig.host,
                database: dbConfig.database
            });
            
            // بررسی اتصال
            checkConnection();
        } catch (error) {
            loggingClient.error('خطا در ایجاد استخر اتصال به دیتابیس', {
                error: error.message,
                stack: error.stack
            });
            
            throw error;
        }
    }
    
    return pool;
}

/**
 * بررسی اتصال به دیتابیس
 */
async function checkConnection() {
    try {
        const connection = await pool.getConnection();
        connection.release();
        
        loggingClient.info('اتصال به دیتابیس با موفقیت برقرار شد');
        return true;
    } catch (error) {
        loggingClient.error('اتصال به دیتابیس ناموفق بود', {
            error: error.message,
            stack: error.stack
        });
        
        return false;
    }
}

/**
 * اجرای کوئری با اندازه‌گیری زمان اجرا
 * @param {string} query کوئری
 * @param {Array} params پارامترها
 * @returns {Promise<Array>}
 */
async function query(query, params = []) {
    const startTime = Date.now();
    const pool = getPool();
    
    try {
        // اجرای کوئری با پارامترها
        const [rows] = await pool.execute(query, params);
        
        const duration = Date.now() - startTime;
        loggingClient.logDatabase('کوئری', query, duration);
        
        return rows;
    } catch (error) {
        const duration = Date.now() - startTime;
        
        loggingClient.error('خطا در اجرای کوئری', {
            error: error.message,
            query,
            params,
            duration: `${duration}ms`
        });
        
        throw error;
    }
}

/**
 * افزودن داده به جدول
 * @param {string} table نام جدول
 * @param {Object} data داده‌ها
 * @returns {Promise<Object>}
 */
async function insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const placeholders = keys.map(() => '?').join(', ');
    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    const result = await this.query(query, values);
    
    return {
        id: result.insertId,
        affectedRows: result.affectedRows,
        ...data
    };
}

/**
 * به‌روزرسانی داده در جدول
 * @param {string} table نام جدول
 * @param {Object} data داده‌ها
 * @param {Object} where شرط
 * @returns {Promise<number>}
 */
async function update(table, data, where) {
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    
    const query = `UPDATE ${table} SET ${updates} WHERE ${conditions}`;
    const params = [...Object.values(data), ...Object.values(where)];
    
    const result = await this.query(query, params);
    
    return result.affectedRows;
}

/**
 * حذف داده از جدول
 * @param {string} table نام جدول
 * @param {Object} where شرط
 * @returns {Promise<number>}
 */
async function remove(table, where) {
    const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const query = `DELETE FROM ${table} WHERE ${conditions}`;
    
    const result = await this.query(query, Object.values(where));
    
    return result.affectedRows;
}

/**
 * جستجو در جدول
 * @param {string} table نام جدول
 * @param {Object} where شرط
 * @param {string} orderBy ترتیب
 * @param {number} limit محدودیت
 * @param {number} offset شروع
 * @returns {Promise<Array>}
 */
async function find(table, where = {}, orderBy = '', limit = 0, offset = 0) {
    let query = `SELECT * FROM ${table}`;
    const params = [];
    
    // افزودن شرط
    if (Object.keys(where).length > 0) {
        const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        query += ` WHERE ${conditions}`;
        params.push(...Object.values(where));
    }
    
    // افزودن ترتیب
    if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
    }
    
    // افزودن محدودیت
    if (limit > 0) {
        query += ` LIMIT ${limit}`;
        
        if (offset > 0) {
            query += ` OFFSET ${offset}`;
        }
    }
    
    return await this.query(query, params);
}

/**
 * جستجوی تکی در جدول
 * @param {string} table نام جدول
 * @param {Object} where شرط
 * @returns {Promise<Object|null>}
 */
async function findOne(table, where = {}) {
    const results = await this.find(table, where, '', 1);
    return results.length > 0 ? results[0] : null;
}

module.exports = {
    getPool,
    checkConnection,
    query,
    insert,
    update,
    remove,
    find,
    findOne
};