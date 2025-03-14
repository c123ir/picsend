const express = require('express');
const { logger } = require('./server/utils/logger');

const app = express();

// میدلور‌های لاگینگ
app.use(logger.logRequest.bind(logger));
app.use(logger.errorHandler.bind(logger));

// ... existing code ...

// ثبت لاگ برای شروع سرور
app.listen(port, () => {
    logger.info(`سرور در پورت ${port} راه‌اندازی شد`);
}); 