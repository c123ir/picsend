// server/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { loggingClient } = require('./utils/logging-client');
const { setupDatabase } = require('./utils/database-setup');
const { setupRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3010;
const DB_NAME = process.env.DB_NAME || 'picsend';

// میدلور‌ها
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// میدلور لاگینگ درخواست‌ها
app.use((req, res, next) => {
    const start = Date.now();
    
    // لاگ پس از پایان درخواست
    res.on('finish', () => {
        const duration = Date.now() - start;
        loggingClient.info(`${req.method} ${req.originalUrl}`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });
    
    next();
});

// راه‌اندازی سرور
async function startServer() {
    try {
        loggingClient.info('شروع راه‌اندازی سرور...');
        
        // راه‌اندازی دیتابیس
        const dbReady = await setupDatabase(DB_NAME);
        
        if (!dbReady) {
            loggingClient.error('راه‌اندازی دیتابیس ناموفق بود. سرور با محدودیت راه‌اندازی می‌شود.');
        }
        
        // تنظیم مسیرها
        setupRoutes(app, dbReady);
        
        // مدیریت خطاها
        app.use((err, req, res, next) => {
            loggingClient.error('خطای سرور', {
                error: err.message,
                stack: err.stack,
                url: req.originalUrl,
                method: req.method
            });
            
            res.status(500).json({
                success: false,
                message: 'خطای سرور رخ داده است'
            });
        });
        
        // اگر مسیر یافت نشد
        app.use((req, res) => {
            loggingClient.warn('مسیر یافت نشد', {
                url: req.originalUrl,
                method: req.method
            });
            
            res.status(404).json({
                success: false,
                message: 'مسیر یافت نشد'
            });
        });
        
        // راه‌اندازی سرور
        app.listen(PORT, () => {
            loggingClient.info(`سرور روی پورت ${PORT} راه‌اندازی شد`);
            console.log(`سرور روی پورت ${PORT} راه‌اندازی شد`);
        });
    } catch (error) {
        loggingClient.error('خطا در راه‌اندازی سرور', {
            error: error.message,
            stack: error.stack
        });
        
        console.error('خطا در راه‌اندازی سرور:', error.message);
        process.exit(1);
    }
}

startServer();