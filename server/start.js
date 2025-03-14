// server/start.js
const { spawn } = require('child_process');
const { setupDatabase } = require('./src/utils/database-setup');
const { loggingClient } = require('./src/utils/logging-client');

/**
 * راه‌اندازی سرور
 */
async function start() {
    try {
        console.log('بررسی پیش‌نیازها...');
        
        // بررسی و راه‌اندازی MySQL
        const dbName = process.env.DB_NAME || 'picsend';
        const dbReady = await setupDatabase(dbName);
        
        if (!dbReady) {
            console.warn('هشدار: دیتابیس آماده نیست. سرور با محدودیت اجرا خواهد شد.');
            loggingClient.warn('راه‌اندازی سرور با دیتابیس ناقص');
        } else {
            console.log('دیتابیس آماده است.');
            loggingClient.info('دیتابیس با موفقیت راه‌اندازی شد');
        }
        
        // راه‌اندازی سرور
        console.log('در حال راه‌اندازی سرور...');
        
        const server = spawn('node', ['src/server.js'], {
            stdio: 'inherit',
            env: {
                ...process.env,
                DB_READY: dbReady ? 'true' : 'false'
            }
        });
        
        server.on('close', (code) => {
            if (code !== 0) {
                console.error(`سرور با کد ${code} خاتمه یافت`);
                loggingClient.error(`سرور با کد ${code} خاتمه یافت`);
                process.exit(code);
            }
        });
        
        process.on('SIGINT', () => {
            console.log('در حال خاتمه دادن به سرور...');
            loggingClient.info('سرور با درخواست کاربر خاتمه یافت');
            server.kill('SIGINT');
        });
    } catch (error) {
        console.error('خطا در راه‌اندازی سرور:', error.message);
        loggingClient.error('خطا در راه‌اندازی سرور', {
            error: error.message,
            stack: error.stack
        });
        
        process.exit(1);
    }
}

// شروع
start();