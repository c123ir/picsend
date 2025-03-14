import express from 'express';
import cors from 'cors';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { Sequelize, DataTypes, Op } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3015;

// تنظیمات CORS
app.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:3006', 'http://localhost:3010'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// اتصال به دیتابیس
const sequelize = new Sequelize('picsend_logs', 'root', '123', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// تعریف مدل Log
const Log = sequelize.define('Log', {
  level: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  service: {
    type: DataTypes.STRING,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

// تنظیمات Winston Logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.DailyRotateFile({
      filename: path.join(__dirname, '../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '14d'
    }),
    new transports.DailyRotateFile({
      filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d'
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// ایجاد پوشه public اگر وجود نداشته باشد
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// ایجاد فایل index.html
const indexHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>سیستم مدیریت لاگ‌ها</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        input, select {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #0056b3;
        }
        .logs {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            max-height: 600px;
            overflow-y: auto;
        }
        .log-entry {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .log-entry:last-child {
            border-bottom: none;
        }
        .info { color: #0066cc; }
        .warn { color: #ff9900; }
        .error { color: #cc0000; }
    </style>
</head>
<body>
    <div class="container">
        <h1>سیستم مدیریت لاگ‌ها</h1>
        <div class="filters">
            <select id="level">
                <option value="">همه سطوح</option>
                <option value="info">اطلاعات</option>
                <option value="warn">هشدار</option>
                <option value="error">خطا</option>
            </select>
            <select id="service">
                <option value="">همه سرویس‌ها</option>
                <option value="main-server">سرور اصلی</option>
                <option value="logger">سرور لاگ</option>
            </select>
            <input type="date" id="startDate" placeholder="از تاریخ">
            <input type="date" id="endDate" placeholder="تا تاریخ">
            <button onclick="fetchLogs()">جستجو</button>
        </div>
        <div id="logs" class="logs"></div>
    </div>
    <script>
        async function fetchLogs() {
            const level = document.getElementById('level').value;
            const service = document.getElementById('service').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            let url = '/logs?limit=100';
            if (level) url += '&level=' + level;
            if (service) url += '&service=' + service;
            if (startDate && endDate) {
                url += '&startDate=' + startDate + '&endDate=' + endDate;
            }

            try {
                const response = await fetch(url);
                const logs = await response.json();
                displayLogs(logs);
            } catch (error) {
                console.error('خطا در دریافت لاگ‌ها:', error);
            }
        }

        function displayLogs(logs) {
            const logsContainer = document.getElementById('logs');
            logsContainer.innerHTML = logs.map(log => {
                const metadata = log.metadata ? '<pre>' + JSON.stringify(log.metadata, null, 2) + '</pre>' : '';
                return '<div class="log-entry ' + log.level + '">' +
                    '<strong>[' + new Date(log.timestamp).toLocaleString('fa-IR') + ']</strong> ' +
                    '<span>[' + log.level + ']</span> ' +
                    '<span>[' + log.service + ']:</span> ' +
                    '<span>' + log.message + '</span>' +
                    metadata +
                    '</div>';
            }).join('');
        }

        // دریافت لاگ‌ها در بارگذاری اولیه
        fetchLogs();
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);

// مسیر اصلی - نمایش صفحه لاگ‌ها
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ذخیره لاگ در دیتابیس و فایل
app.post('/logs', async (req, res) => {
  try {
    const { level, message, service, metadata } = req.body;

    if (!level || !message || !service) {
      return res.status(400).json({ 
        message: 'فیلدهای level، message و service الزامی هستند' 
      });
    }

    const logData = {
      level,
      message,
      service,
      metadata,
      timestamp: new Date()
    };

    // ذخیره در دیتابیس
    await Log.create(logData);

    // ذخیره در فایل
    logger.log(logData);

    res.status(200).json({ message: 'لاگ با موفقیت ثبت شد' });
  } catch (error) {
    logger.error('خطا در ثبت لاگ:', error);
    res.status(500).json({ message: 'خطا در ثبت لاگ' });
  }
});

// مسیر برای دریافت لاگ‌ها
app.get('/logs', async (req, res) => {
  try {
    const { level, service, startDate, endDate, limit = 100 } = req.query;
    
    const where: any = {};
    
    if (level) where.level = level;
    if (service) where.service = service;
    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    const logs = await Log.findAll({
      where,
      limit: Math.min(Number(limit), 1000),
      order: [['timestamp', 'DESC']]
    });

    res.json(logs);
  } catch (error) {
    logger.error('خطا در دریافت لاگ‌ها:', error);
    res.status(500).json({ message: 'خطا در دریافت لاگ‌ها' });
  }
});

// راه‌اندازی سرور
const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    
    logger.info('اتصال به دیتابیس لاگ برقرار شد');

    app.listen(port, () => {
      logger.info(`سرور لاگ در پورت ${port} در حال اجراست`);
    });
  } catch (error) {
    logger.error('خطا در راه‌اندازی سرور لاگ:', error);
    process.exit(1);
  }
};

start(); 