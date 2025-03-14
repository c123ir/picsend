// server/src/utils/database-setup.js
const { exec } = require('child_process');
const mysql = require('mysql2/promise');
const util = require('util');
const os = require('os');
const { loggingClient } = require('./logging-client');

// تبدیل exec به promise
const execAsync = util.promisify(exec);

/**
 * بررسی نصب بودن MySQL
 * @returns {Promise<boolean>} 
 */
async function isMySQLInstalled() {
    try {
        loggingClient.info('بررسی نصب بودن MySQL...');
        
        if (os.platform() === 'win32') {
            // برای ویندوز
            await execAsync('sc query MySQL || sc query MySQL80');
        } else {
            // برای لینوکس
            await execAsync('systemctl status mysql || systemctl status mysqld');
        }
        
        loggingClient.info('MySQL روی سیستم نصب شده است.');
        return true;
    } catch (error) {
        loggingClient.warn('MySQL روی سیستم نصب نشده است.', { error: error.message });
        return false;
    }
}

/**
 * بررسی فعال بودن سرویس MySQL
 * @returns {Promise<boolean>}
 */
async function isMySQLRunning() {
    try {
        loggingClient.info('بررسی وضعیت اجرای MySQL...');
        
        // تلاش برای اتصال به MySQL
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '123',
            connectTimeout: 5000
        });
        
        await connection.end();
        loggingClient.info('سرویس MySQL فعال است.');
        return true;
    } catch (error) {
        loggingClient.warn('سرویس MySQL در حال اجرا نیست یا اتصال به آن ممکن نیست.', { error: error.message });
        return false;
    }
}

/**
 * نصب MySQL
 * @returns {Promise<boolean>}
 */
async function installMySQL() {
    try {
        loggingClient.info('شروع نصب MySQL...');
        
        if (os.platform() === 'win32') {
            // در ویندوز باید به صورت دستی نصب شود
            loggingClient.error('نصب خودکار MySQL در ویندوز پشتیبانی نمی‌شود. لطفاً به صورت دستی نصب کنید.');
            return false;
        } else if (os.platform() === 'darwin') {
            // MacOS
            await execAsync('brew install mysql');
            await execAsync('brew services start mysql');
        } else {
            // Linux (Ubuntu/Debian)
            await execAsync('export DEBIAN_FRONTEND=noninteractive && sudo apt-get update && sudo apt-get install -y mysql-server');
            await execAsync('sudo systemctl start mysql');
        }
        
        // تنظیم پسورد root
        try {
            await setRootPassword();
        } catch (error) {
            loggingClient.error('خطا در تنظیم پسورد root', { error: error.message });
        }
        
        loggingClient.info('MySQL با موفقیت نصب شد.');
        return true;
    } catch (error) {
        loggingClient.error('خطا در نصب MySQL', { error: error.message, stack: error.stack });
        return false;
    }
}

/**
 * تنظیم پسورد root برای MySQL
 */
async function setRootPassword() {
    loggingClient.info('تنظیم پسورد root برای MySQL...');
    
    if (os.platform() === 'darwin') {
        // MacOS
        await execAsync(`mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '123'; FLUSH PRIVILEGES;"`);
    } else if (os.platform() === 'linux') {
        // Linux
        await execAsync(`sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123'; FLUSH PRIVILEGES;"`);
    } else {
        // Windows - نیاز به روش دیگری دارد
        loggingClient.warn('تنظیم خودکار پسورد root در ویندوز پشتیبانی نمی‌شود. لطفاً به صورت دستی انجام دهید.');
    }
    
    loggingClient.info('پسورد root با موفقیت تنظیم شد.');
}

/**
 * بررسی وجود دیتابیس
 * @param {string} dbName نام دیتابیس
 * @returns {Promise<boolean>}
 */
async function doesDatabaseExist(dbName) {
    try {
        loggingClient.info(`بررسی وجود دیتابیس ${dbName}...`);
        
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '123'
        });
        
        const [rows] = await connection.execute(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
            [dbName]
        );
        
        await connection.end();
        
        const exists = rows.length > 0;
        
        if (exists) {
            loggingClient.info(`دیتابیس ${dbName} وجود دارد.`);
        } else {
            loggingClient.info(`دیتابیس ${dbName} وجود ندارد.`);
        }
        
        return exists;
    } catch (error) {
        loggingClient.error('خطا در بررسی وجود دیتابیس', { error: error.message });
        return false;
    }
}

/**
 * ایجاد دیتابیس
 * @param {string} dbName نام دیتابیس
 * @returns {Promise<boolean>}
 */
async function createDatabase(dbName) {
    try {
        loggingClient.info(`ایجاد دیتابیس ${dbName}...`);
        
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '123'
        });
        
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        
        await connection.end();
        
        loggingClient.info(`دیتابیس ${dbName} با موفقیت ایجاد شد.`);
        return true;
    } catch (error) {
        loggingClient.error('خطا در ایجاد دیتابیس', { error: error.message });
        return false;
    }
}

/**
 * راه‌اندازی کامل دیتابیس
 * @param {string} dbName نام دیتابیس
 * @returns {Promise<boolean>}
 */
async function setupDatabase(dbName) {
    loggingClient.info('شروع راه‌اندازی دیتابیس...');
    
    // بررسی نصب بودن MySQL
    const isInstalled = await isMySQLInstalled();
    
    // اگر نصب نشده بود، نصب کن
    if (!isInstalled) {
        const installSuccess = await installMySQL();
        if (!installSuccess) {
            loggingClient.error('نصب MySQL ناموفق بود. لطفاً به صورت دستی نصب کنید.');
            return false;
        }
    }
    
    // بررسی فعال بودن سرویس
    const isRunning = await isMySQLRunning();
    
    if (!isRunning) {
        loggingClient.error('سرویس MySQL فعال نیست. لطفاً سرویس را راه‌اندازی کنید.');
        return false;
    }
    
    // بررسی وجود دیتابیس
    const dbExists = await doesDatabaseExist(dbName);
    
    // اگر دیتابیس وجود نداشت، ایجاد کن
    if (!dbExists) {
        const createSuccess = await createDatabase(dbName);
        if (!createSuccess) {
            loggingClient.error('ایجاد دیتابیس ناموفق بود.');
            return false;
        }
    }
    
    loggingClient.info('راه‌اندازی دیتابیس با موفقیت انجام شد.');
    return true;
}

module.exports = {
    setupDatabase,
    doesDatabaseExist,
    createDatabase,
    isMySQLInstalled,
    isMySQLRunning
};