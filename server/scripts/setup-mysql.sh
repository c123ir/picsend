#!/bin/bash

# رنگ‌ها برای خروجی
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # بدون رنگ

# واکشی متغیرهای محیطی از .env یا استفاده از مقادیر پیش‌فرض
DB_NAME=${DB_NAME:-picsend}
DB_USER=${DB_USER:-picsend_user}
DB_PASSWORD=${DB_PASSWORD:-Picsend@123}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root}

echo -e "${YELLOW}در حال بررسی وضعیت MySQL...${NC}"

# بررسی اینکه آیا MySQL در حال اجراست
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL نصب نشده است. لطفاً آن را نصب کنید:${NC}"
    echo "برای macOS: brew install mysql"
    echo "برای Ubuntu: sudo apt-get install mysql-server"
    exit 1
fi

# بررسی اینکه آیا سرویس MySQL در حال اجراست
if ! mysql --host=$DB_HOST --port=$DB_PORT --user=root --password=$DB_ROOT_PASSWORD -e "SELECT 1" &> /dev/null; then
    echo -e "${RED}خطا در اتصال به MySQL. در حال تلاش برای راه‌اندازی...${NC}"
    
    # تشخیص نوع سیستم عامل و راه‌اندازی MySQL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mysql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mysql
    else
        echo -e "${RED}سیستم عامل پشتیبانی نمی‌شود. لطفاً MySQL را به صورت دستی راه‌اندازی کنید.${NC}"
        exit 1
    fi
    
    # منتظر راه‌اندازی MySQL
    echo -e "${YELLOW}منتظر راه‌اندازی MySQL...${NC}"
    sleep 5
    
    # بررسی مجدد
    if ! mysql --host=$DB_HOST --port=$DB_PORT --user=root --password=$DB_ROOT_PASSWORD -e "SELECT 1" &> /dev/null; then
        echo -e "${RED}خطا در راه‌اندازی MySQL. لطفا به صورت دستی بررسی کنید.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}MySQL با موفقیت راه‌اندازی شد.${NC}"
fi

echo -e "${GREEN}MySQL در حال اجراست.${NC}"
echo -e "${YELLOW}در حال ایجاد دیتابیس ${DB_NAME} و کاربر ${DB_USER}...${NC}"

# ایجاد دیتابیس و کاربر
mysql --host=$DB_HOST --port=$DB_PORT --user=root --password=$DB_ROOT_PASSWORD -e "
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}دیتابیس ${DB_NAME} و کاربر ${DB_USER} با موفقیت ایجاد شدند.${NC}"
else
    echo -e "${RED}خطا در ایجاد دیتابیس و کاربر.${NC}"
    exit 1
fi

# اجرای اسکریپت اولیه SQL
if [ -f "./scripts/setup-database.sql" ]; then
    echo -e "${YELLOW}در حال اجرای اسکریپت اولیه...${NC}"
    mysql --host=$DB_HOST --port=$DB_PORT --user=$DB_USER --password=$DB_PASSWORD $DB_NAME < ./scripts/setup-database.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}اسکریپت اولیه با موفقیت اجرا شد.${NC}"
    else
        echo -e "${RED}خطا در اجرای اسکریپت اولیه.${NC}"
        exit 1
    fi
else
    echo -e "${RED}فایل اسکریپت اولیه یافت نشد.${NC}"
    exit 1
fi

echo -e "${GREEN}راه‌اندازی MySQL و دیتابیس با موفقیت انجام شد!${NC}"
exit 0 