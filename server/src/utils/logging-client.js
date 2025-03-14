// server/src/utils/logging-client.js
const axios = require('axios');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

class LoggingClient {
    constructor() {
        this.apiUrl = process.env.LOGGING_SERVER_URL || 'http://localhost:3015';
        this.source = `server-${process.env.PORT || '3010'}`;
        this.offlineQueue = [];
        this.isConnected = false;
        
        // ایجاد پوشه برای لاگ‌های محلی
        this.logsDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
        
        // راه‌اندازی winston برای لاگینگ محلی
        this.logger = createLogger({
            level: process.env.LOG_LEVEL || 'debug',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.File({ 
                    filename: path.join(this.logsDir, 'error.log'), 
                    level: 'error'
                }),
                new transports.File({ 
                    filename: path.join(this.logsDir, 'combined.log') 
                })
            ]
        });
        
        // افزودن transport کنسول در محیط توسعه
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple()
                )
            }));
        }
        
        // بررسی اتصال به سرور لاگینگ
        this.checkConnection();
        
        // ارسال لاگ‌های آفلاین در فواصل منظم
        setInterval(this.sendOfflineQueue.bind(this), 60000); // هر دقیقه
    }
    
    /**
     * بررسی اتصال به سرور لاگینگ
     */
    async checkConnection() {
        try {
            await axios.get(this.apiUrl, { timeout: 3000 });
            this.isConnected = true;
            console.log(`اتصال به سرور لاگینگ برقرار شد: ${this.apiUrl}`);
            this.sendOfflineQueue();
        } catch (error) {
            this.isConnected = false;
            console.warn(`اتصال به سرور لاگینگ برقرار نشد: ${this.apiUrl}`, error.message);
        }
    }
    
    /**
     * ذخیره لاگ در فایل محلی
     * @param {string} level سطح لاگ
     * @param {string} message پیام لاگ
     * @param {Object} metadata متادیتا
     */
    saveToLocalFile(level, message, metadata = {}) {
        this.logger.log(level, message, {
            source: this.source,
            ...metadata,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * ارسال لاگ‌های ذخیره شده در صف
     */
    async sendOfflineQueue() {
        if (!this.isConnected || this.offlineQueue.length === 0) return;
        
        console.log(`ارسال ${this.offlineQueue.length} لاگ از صف...`);
        
        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        
        for (const log of queue) {
            try {
                await axios.post(`${this.apiUrl}/logs`, log);
            } catch (error) {
                this.offlineQueue.push(log);
                console.error('خطا در ارسال لاگ از صف:', error.message);
                break;
            }
        }
    }
    
    /**
     * ارسال لاگ به سرور
     * @param {string} level سطح لاگ
     * @param {string} message پیام لاگ
     * @param {Object} metadata متادیتا
     */
    async log(level, message, metadata = {}) {
        // ذخیره در فایل محلی همیشه انجام می‌شود
        this.saveToLocalFile(level, message, metadata);
        
        const logData = {
            level,
            message,
            source: this.source,
            metadata: {
                ...metadata,
                hostname: os.hostname(),
                pid: process.pid
            },
            timestamp: new Date().toISOString()
        };
        
        // در محیط توسعه لاگ در کنسول
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${level.toUpperCase()}] ${message}`, metadata);
        }
        
        try {
            if (!this.isConnected) {
                this.offlineQueue.push(logData);
                return;
            }
            
            await axios.post(`${this.apiUrl}/logs`, logData);
        } catch (error) {
            this.offlineQueue.push(logData);
            this.isConnected = false;
            console.error('خطا در ارسال لاگ:', error.message);
            setTimeout(() => this.checkConnection(), 5000); // تلاش مجدد برای اتصال بعد از 5 ثانیه
        }
    }
    
    /**
     * لاگ سطح خطا
     * @param {string} message پیام
     * @param {Object} metadata متادیتا
     */
    error(message, metadata = {}) {
        return this.log('error', message, metadata);
    }
    
    /**
     * لاگ سطح هشدار
     * @param {string} message پیام
     * @param {Object} metadata متادیتا
     */
    warn(message, metadata = {}) {
        return this.log('warn', message, metadata);
    }
    
    /**
     * لاگ سطح اطلاعات
     * @param {string} message پیام
     * @param {Object} metadata متادیتا
     */
    info(message, metadata = {}) {
        return this.log('info', message, metadata);
    }
    
    /**
     * لاگ سطح دیباگ
     * @param {string} message پیام
     * @param {Object} metadata متادیتا
     */
    debug(message, metadata = {}) {
        return this.log('debug', message, metadata);
    }
    
    /**
     * لاگ عملکرد
     * @param {string} action عملیات
     * @param {number} duration مدت زمان
     * @param {Object} metadata متادیتا
     */
    logPerformance(action, duration, metadata = {}) {
        return this.info(`عملکرد: ${action}`, {
            ...metadata,
            duration: typeof duration === 'number' ? `${duration.toFixed(2)}ms` : duration,
            type: 'performance'
        });
    }
    
    /**
     * لاگ دیتابیس
     * @param {string} action عملیات
     * @param {string} query کوئری
     * @param {number} duration مدت زمان
     */
    logDatabase(action, query, duration) {
        return this.debug(`دیتابیس: ${action}`, {
            query,
            duration: `${duration.toFixed(2)}ms`,
            type: 'database'
        });
    }
}

// ایجاد نمونه واحد
const loggingClient = new LoggingClient();

module.exports = { loggingClient };