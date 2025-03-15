#!/bin/bash

# رنگ‌ها برای خروجی
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # بدون رنگ

# واکشی متغیرهای محیطی از .env یا استفاده از مقادیر پیش‌فرض
DB_NAME=${DB_NAME:-picsend}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-123}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}

echo -e "${YELLOW}بررسی وضعیت MySQL...${NC}"

# بررسی اینکه آیا MySQL در حال اجراست
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL نصب نشده است. لطفاً آن را نصب کنید:${NC}"
    echo "برای macOS: brew install mysql"
    echo "برای Ubuntu: sudo apt-get install mysql-server"
    exit 1
fi

# بررسی اینکه آیا سرویس MySQL در حال اجراست
if ! pgrep -x "mysqld" > /dev/null; then
    echo -e "${RED}سرویس MySQL در حال اجرا نیست. در حال راه‌اندازی...${NC}"
    
    # تشخیص نوع سیستم عامل و راه‌اندازی MySQL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mysql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo service mysql start || sudo systemctl start mysql
    else
        echo -e "${RED}سیستم عامل پشتیبانی نمی‌شود. لطفاً MySQL را به صورت دستی راه‌اندازی کنید.${NC}"
        exit 1
    fi
    
    # منتظر راه‌اندازی MySQL
    echo -e "${YELLOW}منتظر راه‌اندازی MySQL...${NC}"
    sleep 5
    
    # بررسی مجدد
    if ! pgrep -x "mysqld" > /dev/null; then
        echo -e "${RED}راه‌اندازی MySQL با شکست مواجه شد. لطفاً به صورت دستی راه‌اندازی کنید.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}MySQL با موفقیت راه‌اندازی شد.${NC}"
fi

echo -e "${GREEN}MySQL در حال اجراست.${NC}"
echo -e "${YELLOW}در حال بررسی دیتابیس ${DB_NAME}...${NC}"

# بررسی وجود دیتابیس
if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -e "USE ${DB_NAME}" 2>/dev/null; then
    echo -e "${YELLOW}دیتابیس ${DB_NAME} وجود ندارد. در حال ایجاد...${NC}"
    
    # اجرای اسکریپت راه‌اندازی دیتابیس
    if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} < "$(dirname "$0")/setup-database.sql"; then
        echo -e "${RED}خطا در اجرای اسکریپت SQL. لطفاً دیتابیس را به صورت دستی راه‌اندازی کنید.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}دیتابیس ${DB_NAME} با موفقیت ایجاد شد.${NC}"
else
    echo -e "${GREEN}دیتابیس ${DB_NAME} از قبل وجود دارد.${NC}"
fi

echo -e "${GREEN}راه‌اندازی MySQL و دیتابیس با موفقیت انجام شد!${NC}"
exit 0 