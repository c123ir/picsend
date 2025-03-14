const express = require('express');
const cors = require('cors');
const { loggers } = require('./utils/logger');

const logger = loggers.app;
const app = express();

// تنظیمات پایه
app.use(cors());
app.use(express.json());

// میدلور‌های لاگینگ
app.use((req, res, next) => {
    logger.logRequest(req, res, next);
});

// مسیرهای API
app.use('/auth', require('./auth/auth.routes'));
app.use('/users', require('./users/users.routes'));

// مدیریت خطاها
app.use((err, req, res, next) => {
    logger.errorHandler(err, req, res, next);
    res.status(500).json({
        success: false,
        message: err.message
    });
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
    logger.info(`سرور در پورت ${PORT} راه‌اندازی شد`);
}); 