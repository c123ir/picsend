#!/bin/bash

# اطمینان از وجود پوشه‌های لاگ
mkdir -p ../../logs/server-3010/{error,info,debug}
mkdir -p ../../logs/client-3005/{error,info,debug}

# تنظیم دسترسی‌ها
chmod -R 755 ../../logs

# بیلد پروژه
npm run build

# راه‌اندازی با PM2
npm run pm2:delete 2>/dev/null || true
npm run pm2:start

# نمایش وضعیت
echo "سرور لاگینگ با موفقیت راه‌اندازی شد."
echo "برای مشاهده لاگ‌ها: npm run pm2:logs"
echo "برای مشاهده مانیتورینگ: npm run pm2:monitor" 