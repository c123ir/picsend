const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const LOGGING_SERVER = 'http://localhost:3015';
const LOG_FILE_PATH = path.join(__dirname, '../logs');

class Logger {
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.ensureLogDirectory();
    }

    async ensureLogDirectory() {
        try {
            await fs.access(LOG_FILE_PATH);
        } catch {
            await fs.mkdir(LOG_FILE_PATH, { recursive: true });
        }
    }

    async _writeToFile(logData) {
        const date = new Date().toISOString().split('T')[0];
        const filePath = path.join(LOG_FILE_PATH, `${this.serviceName}-${date}.log`);
        const logEntry = JSON.stringify({ ...logData, timestamp: new Date().toISOString() }) + '\n';
        
        try {
            await fs.appendFile(filePath, logEntry);
        } catch (error) {
            console.error('خطا در ذخیره لاگ در فایل:', error);
        }
    }

    async _sendLog(level, message, metadata = {}) {
        const logData = {
            level,
            message,
            source: this.serviceName,
            metadata,
            timestamp: new Date().toISOString()
        };

        // ذخیره در فایل
        await this._writeToFile(logData);

        // ارسال به سرور لاگینگ
        try {
            await axios.post(`${LOGGING_SERVER}/api/logs`, logData);
        } catch (error) {
            console.error(`خطا در ارسال لاگ به سرور: ${error.message}`);
            // ذخیره خطای ارسال
            await this._writeToFile({
                level: 'error',
                message: `خطا در ارسال لاگ به سرور: ${error.message}`,
                source: 'logger',
                metadata: { originalLog: logData }
            });
        }
    }

    error(message, metadata = {}) {
        if (metadata.error instanceof Error) {
            metadata.error = {
                message: metadata.error.message,
                stack: metadata.error.stack,
                code: metadata.error.code,
                name: metadata.error.name
            };
        }
        this._sendLog('error', message, metadata);
    }

    warn(message, metadata) {
        this._sendLog('warn', message, metadata);
    }

    info(message, metadata) {
        this._sendLog('info', message, metadata);
    }

    debug(message, metadata) {
        this._sendLog('debug', message, metadata);
    }

    // ثبت لاگ برای درخواست‌های HTTP
    logRequest(req, res, next) {
        const start = Date.now();
        const requestId = Math.random().toString(36).substring(7);
        
        // ثبت اطلاعات درخواست
        this.info(`درخواست جدید: ${req.method} ${req.url}`, {
            requestId,
            method: req.method,
            url: req.url,
            headers: req.headers,
            query: req.query,
            body: req.body,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });

        // ثبت پاسخ
        res.on('finish', () => {
            const duration = Date.now() - start;
            const level = res.statusCode >= 400 ? 'error' : 'info';
            
            this[level](`پاسخ به درخواست: ${req.method} ${req.url}`, {
                requestId,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                responseHeaders: res.getHeaders()
            });
        });

        next();
    }

    // ثبت خطاهای اپلیکیشن
    errorHandler(err, req, res, next) {
        const errorId = Math.random().toString(36).substring(7);
        
        this.error(`خطای سرور: ${err.message}`, {
            errorId,
            error: {
                message: err.message,
                stack: err.stack,
                code: err.code,
                name: err.name
            },
            request: {
                method: req.method,
                url: req.url,
                headers: req.headers,
                query: req.query,
                body: req.body,
                ip: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        // اگر خطای اتصال به سرویس‌های خارجی است
        if (err.code === 'ECONNREFUSED') {
            this.error('خطای اتصال به سرویس خارجی', {
                errorId,
                service: err.address,
                port: err.port
            });
        }

        next(err);
    }

    // ثبت خطاهای SMS
    logSMSError(phone, error) {
        this.error(`خطا در ارسال SMS به ${phone}`, {
            service: 'sms',
            phone,
            error: error.response?.data || error.message
        });
    }

    // ثبت خطاهای احراز هویت
    logAuthError(username, error) {
        this.error(`خطا در احراز هویت برای ${username}`, {
            service: 'auth',
            username,
            error: error.message,
            code: error.code
        });
    }
}

// ایجاد لاگرهای پیش‌فرض برای سرویس‌های مختلف
const loggers = {
    app: new Logger('app'),
    auth: new Logger('auth-service'),
    sms: new Logger('sms-service'),
    user: new Logger('user-service')
};

module.exports = {
    Logger,
    logger: loggers.app,
    loggers
}; 