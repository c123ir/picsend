const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const fs = require('fs');
const winston = require('winston');
const cors = require('cors');

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

// مطمئن شویم پوشه لاگ‌ها وجود دارد
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    console.log(`پوشه لاگ ایجاد شد: ${LOGS_DIR}`);
}

// تنظیمات winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(LOGS_DIR, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(LOGS_DIR, 'combined.log') })
    ]
});

// افزودن transport کنسول در محیط غیر تولید
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// تنظیمات middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// مسیر برای صفحه اصلی
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// لیست لاگ‌ها در حافظه
let logs = [];

// دریافت لاگ جدید
app.post('/logs', (req, res) => {
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
            metadata,
            timestamp: new Date().toISOString()
        };
        
        // ذخیره لاگ
        logs.unshift(newLog);
        
        // حداکثر 1000 لاگ در حافظه نگهداری می‌شود
        if (logs.length > 1000) {
            logs = logs.slice(0, 1000);
        }
        
        // ارسال به winston
        logger.log({
            level,
            message,
            source: source || 'unknown',
            metadata,
            timestamp: newLog.timestamp
        });
        
        // ارسال به کلاینت‌ها
        io.emit('log', newLog);
        
        console.log(`لاگ جدید دریافت شد: ${level} | ${message}`);
        
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
app.get('/api/logs', (req, res) => {
    res.json({ success: true, data: logs });
});

// لیست سرویس‌ها
app.get('/api/logs/sources', (req, res) => {
    const sources = new Set();
    logs.forEach(log => {
        if (log.source) {
            sources.add(log.source);
        }
    });
    res.json({ success: true, data: Array.from(sources) });
});

// خروجی JSON
app.get('/api/logs/export', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=logs-${new Date().toISOString()}.json`);
    res.json(logs);
});

// راه‌اندازی سرور
server.listen(PORT, () => {
    console.log(`سرور لاگینگ روی پورت ${PORT} راه‌اندازی شد`);
});

// اتصال Socket.IO
io.on('connection', (socket) => {
    console.log('کلاینت جدید متصل شد');
    
    socket.on('disconnect', () => {
        console.log('کلاینت قطع شد');
    });
});