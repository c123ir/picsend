#!/bin/bash

# تنظیم مسیرها
WORKSPACE_DIR="/Users/stivenjakson/my-app/picsend"
LOGGING_SERVER_DIR="$WORKSPACE_DIR/server/logging-server"
LAUNCHD_DIR="$WORKSPACE_DIR/logs/launchd"
PLIST_PATH="$HOME/Library/LaunchAgents/com.picsend.logging-server.plist"

# ایجاد پوشه‌های مورد نیاز
echo "ایجاد پوشه‌های لاگ..."
mkdir -p "$LAUNCHD_DIR"
chmod 755 "$LAUNCHD_DIR"

# نصب PM2 به صورت گلوبال اگر نصب نشده باشد
if ! command -v pm2 &> /dev/null; then
    echo "نصب PM2..."
    npm install -g pm2
fi

# بیلد پروژه
echo "بیلد پروژه..."
cd "$LOGGING_SERVER_DIR"
npm install
npm run build

# توقف و حذف سرویس قبلی اگر وجود داشته باشد
if launchctl list | grep -q com.picsend.logging-server; then
    echo "حذف سرویس قبلی..."
    launchctl unload "$PLIST_PATH" 2>/dev/null
fi

# نصب سرویس جدید
echo "نصب سرویس جدید..."
launchctl load "$PLIST_PATH"

# بررسی وضعیت سرویس
if launchctl list | grep -q com.picsend.logging-server; then
    echo "✅ سرویس لاگینگ با موفقیت نصب و راه‌اندازی شد."
    echo "برای مشاهده لاگ‌های سرویس:"
    echo "  - لاگ اصلی: $LAUNCHD_DIR/logging-server.log"
    echo "  - لاگ خطاها: $LAUNCHD_DIR/logging-server.error.log"
    echo "برای مدیریت سرویس:"
    echo "  - توقف: launchctl unload $PLIST_PATH"
    echo "  - شروع مجدد: launchctl load $PLIST_PATH"
else
    echo "❌ خطا در نصب سرویس"
    exit 1
fi 