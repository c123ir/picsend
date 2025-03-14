// logger/src/server.js
const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const fs = require('fs').promises;
const winston = require('winston');
const cors = require('cors');
const moment = require('moment');

// تنظیمات اصلی
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3015;
const LOGS_DIR = path.join(__dirname, '../logs');

// اطمینان از وجود دایرکتوری لاگ‌ها
async function ensureLogsDirectory() {
    try {
        await fs.mkdir(LOGS_DIR, { recursive: true });
        console.log(`پوشه لاگ ایجاد شد: ${LOGS_DIR}`);
    } catch (error) {
        console.error('خطا در ایجاد پوشه لاگ:', error);
    }
}

// ساختار فرمت winston با حمایت از زبان فارسی
const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''}`;
});

// تنظیمات winston
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
        logFormat
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(LOGS_DIR, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({ 
            filename: path.join(LOGS_DIR, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
        })
    ]
});

// افزودن transport کنسول در محیط غیر تولید
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// تنظیمات middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// میدلور برای لاگ کردن درخواست‌ها
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl}`, {
            duration: `${duration}ms`,
            status: res.statusCode,
            ip: req.ip
        });
    });
    
    next();
});

// مسیر برای صفحه اصلی
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// لیست لاگ‌ها در حافظه
let logs = [];
const MAX_LOGS_IN_MEMORY = 1000;

// ذخیره لاگ در فایل
async function saveLogToFile(log) {
    try {
        const date = moment(log.timestamp).format('YYYY-MM-DD');
        const filename = `${date}.log`;
        const filePath = path.join(LOGS_DIR, filename);
        
        // تبدیل به رشته JSON با خط جدید
        const logString = JSON.stringify(log) + '\n';
        
        await fs.appendFile(filePath, logString).catch(async (error) => {
            if (error.code === 'ENOENT') {
                await fs.writeFile(filePath, logString);
            } else {
                throw error;
            }
        });
    } catch (error) {
        console.error('خطا در ذخیره لاگ در فایل:', error);
    }
}

// دریافت لاگ‌ها از فایل‌ها
async function getLogsFromFiles(timeRange = '24h') {
    try {
        const now = new Date();
        let daysToFetch = 1; // پیش‌فرض: 24 ساعت
        
        if (timeRange.endsWith('h')) {
            const hours = parseInt(timeRange);
            daysToFetch = Math.ceil(hours / 24);
        } else if (timeRange.endsWith('d')) {
            daysToFetch = parseInt(timeRange);
        }
        
        let allLogs = [];
        
        // محدود کردن به حداکثر 30 روز
        daysToFetch = Math.min(daysToFetch, 30);
        
        // دریافت فایل‌های مربوط به روزهای مورد نیاز
        for (let i = 0; i < daysToFetch; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const filename = moment(date).format('YYYY-MM-DD') + '.log';
            const filePath = path.join(LOGS_DIR, filename);
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const lines = content.trim().split('\n');
                
                for (const line of lines) {
                    try {
                        const log = JSON.parse(line);
                        allLogs.push(log);
                    } catch (e) {
                        console.error('خطا در پارس کردن لاگ:', e);
                    }
                }
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error(`خطا در خواندن فایل ${filename}:`, error);
                }
            }
        }
        
        // مرتب‌سازی بر اساس زمان (جدیدترین اول)
        allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return allLogs;
    } catch (error) {
        console.error('خطا در خواندن لاگ‌ها از فایل:', error);
        return [];
    }
}

// فیلتر کردن لاگ‌ها
function filterLogs(logs, filters = {}) {
    return logs.filter(log => {
        // فیلتر بر اساس سطح لاگ
        if (filters.levels && filters.levels.length > 0 && !filters.levels.includes(log.level)) {
            return false;
        }
        
        // فیلتر بر اساس سرویس
        if (filters.source && log.source !== filters.source) {
            return false;
        }
        
        // فیلتر بر اساس جستجو
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const message = log.message ? log.message.toLowerCase() : '';
            const source = log.source ? log.source.toLowerCase() : '';
            
            if (!message.includes(searchLower) && !source.includes(searchLower)) {
                return false;
            }
        }
        
        // فیلتر بر اساس زمان
        if (filters.timeRange) {
            const now = new Date();
            const logTime = new Date(log.timestamp);
            let timeRangeMs;
            
            if (filters.timeRange.endsWith('m')) {
                const minutes = parseInt(filters.timeRange);
                timeRangeMs = minutes * 60 * 1000;
            } else if (filters.timeRange.endsWith('h')) {
                const hours = parseInt(filters.timeRange);
                timeRangeMs = hours * 60 * 60 * 1000;
            } else if (filters.timeRange.endsWith('d')) {
                const days = parseInt(filters.timeRange);
                timeRangeMs = days * 24 * 60 * 60 * 1000;
            } else {
                timeRangeMs = 24 * 60 * 60 * 1000; // پیش‌فرض: 24 ساعت
            }
            
            if (now.getTime() - logTime.getTime() > timeRangeMs) {
                return false;
            }
        }
        
        return true;
    });
}

// API Endpoints

// دریافت لاگ جدید
app.post('/logs', async (req, res) => {
    try {
        const { level, message, source, metadata } = req.body;
        
        if (!level || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'سطح و پیام لاگ الزامی هستند' 
            });
        }
        
        const newLog = {
            level,
            message,
            source: source || 'unknown',
            metadata: metadata || {},
            timestamp: new Date().toISOString()
        };
        
        // ذخیره لاگ در حافظه
        logs.unshift(newLog);
        
        // محدود کردن تعداد لاگ‌ها در حافظه
        if (logs.length > MAX_LOGS_IN_MEMORY) {
            logs = logs.slice(0, MAX_LOGS_IN_MEMORY);
        }
        
        // ذخیره در فایل
        await saveLogToFile(newLog);
        
        // ارسال به winston
        logger.log(level, message, {
            source: source || 'unknown',
            ...metadata
        });
        
        // ارسال به کلاینت‌ها
        io.emit('log', newLog);
        
        // لاگ کردن در کنسول برای دیباگ
        console.log(`لاگ جدید: [${level}] ${message}`);
        
        res.status(200).json({ success: true, data: newLog });
    } catch (error) {
        console.error('خطا در ثبت لاگ:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطای سرور در ثبت لاگ' 
        });
    }
});

// دریافت لاگ‌ها
app.get('/api/logs', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const levels = req.query.levels ? req.query.levels.split(',') : [];
        const source = req.query.source || '';
        const search = req.query.search || '';
        
        // دریافت لاگ‌ها از فایل‌ها
        let allLogs = await getLogsFromFiles(timeRange);
        
        // اعمال فیلترها
        const filters = {
            levels,
            source,
            search,
            timeRange
        };
        
        const filteredLogs = filterLogs(allLogs, filters);
        
        res.json({ 
            success: true, 
            data: filteredLogs,
            totalCount: allLogs.length,
            filteredCount: filteredLogs.length 
        });
    } catch (error) {
        console.error('خطا در دریافت لاگ‌ها:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطای سرور در دریافت لاگ‌ها' 
        });
    }
});

// دریافت لیست سرویس‌ها
app.get('/api/logs/sources', async (req, res) => {
    try {
        const allLogs = await getLogsFromFiles('30d'); // آخرین 30 روز
        const sources = new Set();
        
        allLogs.forEach(log => {
            if (log.source) {
                sources.add(log.source);
            }
        });
        
        res.json({ 
            success: true, 
            data: Array.from(sources)
        });
    } catch (error) {
        console.error('خطا در دریافت لیست سرویس‌ها:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطای سرور در دریافت لیست سرویس‌ها' 
        });
    }
});

// دریافت آمار لاگ‌ها
app.get('/api/logs/stats', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const allLogs = await getLogsFromFiles(timeRange);
        
        const stats = {
            total: allLogs.length,
            byLevel: {
                error: allLogs.filter(log => log.level === 'error').length,
                warn: allLogs.filter(log => log.level === 'warn').length,
                info: allLogs.filter(log => log.level === 'info').length,
                debug: allLogs.filter(log => log.level === 'debug').length
            },
            bySources: {}
        };
        
        // محاسبه تعداد لاگ‌ها بر اساس منبع
        allLogs.forEach(log => {
            const source = log.source || 'unknown';
            if (!stats.bySources[source]) {
                stats.bySources[source] = 0;
            }
            stats.bySources[source]++;
        });
        
        res.json({ 
            success: true, 
            data: stats 
        });
    } catch (error) {
        console.error('خطا در دریافت آمار لاگ‌ها:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطای سرور در دریافت آمار لاگ‌ها' 
        });
    }
});

// خروجی JSON
app.get('/api/logs/export', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const levels = req.query.levels ? req.query.levels.split(',') : [];
        const source = req.query.source || '';
        const search = req.query.search || '';
        
        let allLogs = await getLogsFromFiles(timeRange);
        
        const filters = {
            levels,
            source,
            search,
            timeRange
        };
        
        const filteredLogs = filterLogs(allLogs, filters);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=logs-${new Date().toISOString()}.json`);
        res.json(filteredLogs);
    } catch (error) {
        console.error('خطا در صدور لاگ‌ها:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطای سرور در صدور لاگ‌ها' 
        });
    }
});

// مسیر برای مدیریت خطاهای 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مدیریت خطاها
app.use((err, req, res, next) => {
    console.error('خطای سرور:', err);
    logger.error('خطای سرور', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: 'خطای داخلی سرور' });
});

// راه‌اندازی سرور
async function startServer() {
    await ensureLogsDirectory();
    
    server.listen(PORT, () => {
        console.log(`سرور لاگینگ روی پورت ${PORT} راه‌اندازی شد`);
        logger.info(`سرور لاگینگ روی پورت ${PORT} راه‌اندازی شد`);
    });
    
    // اتصال Socket.IO
    io.on('connection', (socket) => {
        console.log('کلاینت جدید متصل شد');
        logger.debug('کلاینت جدید متصل شد', { socketId: socket.id });
        
        socket.on('disconnect', () => {
            console.log('کلاینت قطع شد');
            logger.debug('کلاینت قطع شد', { socketId: socket.id });
        });
    });
}

// شروع سرور
startServer().catch(error => {
    console.error('خطا در راه‌اندازی سرور:', error);
});