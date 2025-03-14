import axios from 'axios';

// تولید یک پیام تصادفی
function generateRandomMessage() {
    const messages = [
        'کاربر وارد سیستم شد',
        'درخواست API با موفقیت انجام شد',
        'خطا در اتصال به دیتابیس',
        'فایل مورد نظر یافت نشد',
        'عملیات با موفقیت انجام شد',
        'درخواست نامعتبر',
        'خطای داخلی سرور',
        'سرویس در دسترس نیست'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// تولید یک سطح لاگ تصادفی
function generateRandomLevel() {
    const levels = ['error', 'warn', 'info', 'debug'] as const;
    return levels[Math.floor(Math.random() * levels.length)];
}

// تولید یک سرویس تصادفی
function generateRandomSource() {
    const sources = ['auth-service', 'api-gateway', 'user-service', 'file-service'];
    return sources[Math.floor(Math.random() * sources.length)];
}

// ارسال لاگ‌های تصادفی
async function sendRandomLog() {
    const log = {
        level: generateRandomLevel(),
        message: generateRandomMessage(),
        source: generateRandomSource(),
        timestamp: new Date().toISOString(),
        metadata: {
            requestId: Math.random().toString(36).substring(7),
            userId: Math.floor(Math.random() * 1000),
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`
        }
    };

    try {
        await axios.post('http://localhost:3015/api/logs', log);
        console.log('لاگ ارسال شد:', log);
    } catch (error) {
        console.error('خطا در ارسال لاگ:', error);
    }
}

// ارسال 20 لاگ با فاصله 1 ثانیه
async function sendTestLogs() {
    console.log('شروع ارسال لاگ‌های تست...');
    
    for (let i = 0; i < 20; i++) {
        await sendRandomLog();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('ارسال لاگ‌های تست به پایان رسید');
}

// اجرای اسکریپت
sendTestLogs().catch(console.error); 