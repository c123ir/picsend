const { loggers } = require('../utils/logger');
const logger = loggers.auth;
const axios = require('axios');

// برای لاگ‌های عمومی
logger.info('پیام اطلاع‌رسانی');
logger.error('پیام خطا');
logger.warn('پیام هشدار');
logger.debug('پیام دیباگ');

// برای سرویس‌های خاص
const { Logger } = require('./server/utils/logger');
const authLogger = new Logger('auth-service');
authLogger.info('پیام مربوط به سرویس احراز هویت');

async function login(username, password) {
    try {
        logger.info(`تلاش برای ورود کاربر: ${username}`);
        
        // کد لاگین
        const response = await axios.post('/auth/login', { username, password });
        
        if (response.data.success) {
            logger.info(`ورود موفق کاربر: ${username}`);
            return response.data;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        logger.logAuthError(username, error);
        throw error;
    }
}

async function register(userData) {
    try {
        logger.info('تلاش برای ثبت‌نام کاربر جدید', { email: userData.email });
        
        // کد ثبت‌نام
        const response = await axios.post('/auth/register', userData);
        
        if (response.data.success) {
            logger.info('ثبت‌نام موفق کاربر جدید', { email: userData.email });
            return response.data;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        logger.error('خطا در ثبت‌نام کاربر', { 
            error,
            userData: { ...userData, password: '***' }
        });
        throw error;
    }
}

async function sendVerificationSMS(phone) {
    try {
        logger.info(`ارسال کد تایید به شماره ${phone}`);
        
        // کد ارسال پیامک
        const response = await axios.post('/sms/send', { phone });
        
        if (response.data.success) {
            logger.info(`کد تایید با موفقیت به ${phone} ارسال شد`);
            return response.data;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        loggers.sms.logSMSError(phone, error);
        throw error;
    }
}

module.exports = {
    login,
    register,
    sendVerificationSMS
}; 