const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;
const { createLogger, format, transports } = require('winston');
const config = require('../../config');
const moment = require('moment-jalaali');

// تنظیمات اصلی
const MAX_LOGS = 1000; // حداکثر تعداد لاگ‌ها در حافظه
let logs = []; // آرایه برای نگهداری لاگ‌ها

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// تنظیمات winston
const logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ]
});

// اضافه کردن transport برای کنسول در محیط توسعه
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
}

// تنظیمات express
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// اضافه کردن CORS برای درخواست‌های HTTP
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const PORT = process.env.PORT || config.ports.logging;
const LOGS_DIR = path.join(__dirname, 'logs');

// اطمینان از وجود دایرکتوری لاگ‌ها
async function ensureLogsDirectory() {
    try {
        await fs.access(LOGS_DIR);
    } catch {
        await fs.mkdir(LOGS_DIR);
    }
}

// ذخیره لاگ در فایل
async function saveLog(fileName, log) {
    const filePath = path.join(LOGS_DIR, fileName);
    try {
        let logs = [];
        try {
            const content = await fs.readFile(filePath, 'utf8');
            logs = JSON.parse(content);
        } catch {
            // فایل وجود ندارد یا خالی است
        }
        
        logs.push(log);
        await fs.writeFile(filePath, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error saving log:', error);
    }
}

// خواندن لاگ‌ها از فایل
async function readLogs(startDate, endDate) {
    try {
        const files = await fs.readdir(LOGS_DIR);
        let allLogs = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(LOGS_DIR, file), 'utf8');
                const logs = JSON.parse(content);
                allLogs = allLogs.concat(logs);
            }
        }
        
        // فیلتر بر اساس تاریخ
        return allLogs.filter(log => {
            const logDate = moment(log.timestamp);
            return logDate.isBetween(startDate, endDate, 'day', '[]');
        });
    } catch (error) {
        console.error('Error reading logs:', error);
        return [];
    }
}

// تابع کمکی برای فیلتر کردن لاگ‌ها
function filterLogs(logs, filters) {
    return logs.filter(log => {
        // فیلتر بر اساس سطح لاگ
        if (filters.level && filters.level.length > 0 && !filters.level.includes(log.level)) {
            return false;
        }
        
        // فیلتر بر اساس سرویس
        if (filters.source && log.source !== filters.source) {
            return false;
        }
        
        // فیلتر بر اساس جستجو
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return log.message.toLowerCase().includes(searchLower) ||
                   (log.source && log.source.toLowerCase().includes(searchLower));
        }
        
        // فیلتر بر اساس بازه زمانی
        if (filters.timeRange) {
            const now = Date.now();
            const logTime = new Date(log.timestamp).getTime();
            const ranges = {
                '1h': 60 * 60 * 1000,
                '3h': 3 * 60 * 60 * 1000,
                '6h': 6 * 60 * 60 * 1000,
                '12h': 12 * 60 * 60 * 1000,
                '24h': 24 * 60 * 60 * 1000,
                '2d': 2 * 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000
            };
            
            return now - logTime <= ranges[filters.timeRange];
        }
        
        return true;
    });
}

// API Endpoints

// دریافت لاگ‌ها
app.get('/api/logs/:source?', (req, res) => {
    try {
        const filters = {
            source: req.params.source,
            level: req.query.level ? req.query.level.split(',') : [],
            search: req.query.search,
            timeRange: req.query.timeRange || '24h'
        };
        
        const filteredLogs = filterLogs(logs, filters);
        res.json({ success: true, data: filteredLogs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// دریافت لیست سرویس‌ها
app.get('/api/logs/sources', (req, res) => {
    try {
        const sources = [...new Set(logs.map(log => log.source).filter(Boolean))];
        res.json({ success: true, data: sources });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// خروجی گرفتن از لاگ‌ها
app.get('/api/logs/export/:source?', async (req, res) => {
    try {
        const filters = {
            source: req.params.source,
            level: req.query.level ? req.query.level.split(',') : [],
            search: req.query.search,
            timeRange: req.query.timeRange || '24h'
        };
        
        const filteredLogs = filterLogs(logs, filters);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=logs-${new Date().toISOString()}.json`);
        res.json(filteredLogs);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ثبت لاگ جدید
app.post('/api/logs', (req, res) => {
    try {
        const { level, message, source } = req.body;
        
        if (!level || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'سطح و پیام لاگ الزامی هستند' 
            });
        }
        
        const newLog = {
            level,
            message,
            source,
            timestamp: new Date().toISOString()
        };
        
        // ذخیره لاگ
        logs.unshift(newLog);
        
        // محدود کردن تعداد لاگ‌ها
        if (logs.length > MAX_LOGS) {
            logs = logs.slice(0, MAX_LOGS);
        }
        
        // ارسال به winston
        logger.log({
            level,
            message,
            source,
            timestamp: newLog.timestamp
        });
        
        // ارسال به کلاینت‌ها
        io.emit('log', newLog);
        
        // ارسال هشدار برای خطاها
        if (level === 'error') {
            io.emit('alert', {
                type: 'error',
                message: `خطای جدید از سرویس ${source || 'ناشناخته'}: ${message}`
            });
        }
        
        res.json({ success: true, data: newLog });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API برای ذخیره لاگ
app.post('/api/logs/save', async (req, res) => {
    const { fileName, log } = req.body;
    await saveLog(fileName, log);
    res.json({ success: true });
});

// API برای دریافت لاگ‌های آرشیو
app.get('/api/logs/archive', async (req, res) => {
    const { startDate, endDate, search } = req.query;
    let logs = await readLogs(startDate, endDate);
    
    if (search) {
        const searchLower = search.toLowerCase();
        logs = logs.filter(log =>
            log.message.toLowerCase().includes(searchLower) ||
            log.source.toLowerCase().includes(searchLower)
        );
    }
    
    res.json({ success: true, logs });
});

// مسیر اصلی
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// راه‌اندازی سرور
async function start() {
    await ensureLogsDirectory();
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start(); 