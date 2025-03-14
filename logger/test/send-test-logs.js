const axios = require('axios');

// تنظیمات
const SERVER_URL = 'http://localhost:3015';
const SERVICES = ['auth-service', 'user-service', 'payment-service', 'notification-service'];
const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];
const MESSAGES = [
    'درخواست با موفقیت انجام شد',
    'خطا در اتصال به پایگاه داده',
    'کاربر وارد سیستم شد',
    'درخواست نامعتبر',
    'سرویس راه‌اندازی شد',
    'خطای داخلی سرور',
    'درخواست منقضی شد',
    'عملیات با موفقیت انجام شد',
    'خطا در پردازش درخواست',
    'درخواست ناموفق'
];

// تولید لاگ تصادفی
function generateRandomLog() {
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
    const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    
    return {
        level,
        message: `[${service}] ${message}`,
        source: service
    };
}

// ارسال لاگ به سرور
async function sendLog(log) {
    try {
        await axios.post(`${SERVER_URL}/api/logs`, log);
        console.log(`لاگ ارسال شد: [${log.level}] ${log.message}`);
    } catch (error) {
        console.error('خطا در ارسال لاگ:', error.message);
    }
}

// ارسال لاگ‌های تصادفی به صورت متناوب
async function startSendingLogs() {
    console.log('شروع ارسال لاگ‌های تصادفی...');
    
    // ارسال لاگ هر 2 ثانیه
    setInterval(async () => {
        const log = generateRandomLog();
        await sendLog(log);
    }, 2000);
    
    // ارسال خطای تصادفی هر 10 ثانیه
    setInterval(async () => {
        const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
        const log = {
            level: 'error',
            message: `[${service}] خطای مهم: ${MESSAGES[Math.floor(Math.random() * MESSAGES.length)]}`,
            source: service
        };
        await sendLog(log);
    }, 10000);
}

// شروع اجرا
startSendingLogs();