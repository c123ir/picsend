// server/src/routes/index.js
const { loggingClient } = require('../utils/logging-client');

/**
 * تنظیم تمام مسیرهای API
 * @param {Express} app نمونه اکسپرس
 * @param {boolean} dbReady وضعیت دیتابیس
 */
function setupRoutes(app, dbReady) {
    loggingClient.info('تنظیم مسیرهای API...');
    
    // مسیر بررسی وضعیت
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbReady ? 'connected' : 'disconnected',
            version: process.env.npm_package_version || '1.0.0'
        });
    });
    
    // اگر دیتابیس آماده نیست، مسیرهای وابسته به دیتابیس را مسدود کنیم
    if (!dbReady) {
        app.use('/api/auth', (req, res) => {
            loggingClient.warn('دسترسی به API احراز هویت در حالی که دیتابیس آماده نیست', {
                url: req.originalUrl,
                method: req.method
            });
            
            res.status(503).json({
                success: false,
                message: 'سیستم موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.'
            });
        });
        
        // سایر مسیرهای وابسته به دیتابیس...
    } else {
        // تنظیم مسیرهای اصلی وقتی دیتابیس آماده است
        app.use('/api/auth', require('./auth'));
        
        // نمونه‌ای از مسیرهای دیگر
        // app.use('/api/users', require('./users'));
        // app.use('/api/groups', require('./groups'));
        // app.use('/api/requests', require('./requests'));
    }
    
    loggingClient.info('تنظیم مسیرهای API به پایان رسید.');
}

module.exports = { setupRoutes };