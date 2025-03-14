#!/bin/bash

# تنظیم رنگ‌ها برای خروجی
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔄 بررسی نصب MySQL..."

# بررسی نصب MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚙️ MySQL نصب نیست. در حال نصب..."
    
    # تشخیص سیستم عامل
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # نصب در macOS
        if ! command -v brew &> /dev/null; then
            echo "🍺 Homebrew نصب نیست. در حال نصب Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install mysql
        brew services start mysql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # نصب در Linux
        sudo apt-get update
        sudo apt-get install -y mysql-server
        sudo systemctl start mysql
    else
        echo -e "${RED}❌ سیستم عامل پشتیبانی نمی‌شود${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ MySQL با موفقیت نصب شد${NC}"

# تنظیم رمز عبور root
echo "🔐 در حال تنظیم رمز عبور پیش‌فرض..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '123';"
else
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123';"
    sudo mysql -e "FLUSH PRIVILEGES;"
fi

echo -e "${GREEN}✅ رمز عبور با موفقیت تنظیم شد${NC}"

# ایجاد دیتابیس‌ها
echo "🗄️ در حال ایجاد دیتابیس‌ها..."

mysql -u root -p123 <<EOF
CREATE DATABASE IF NOT EXISTS picsend;
CREATE DATABASE IF NOT EXISTS picsend_logs;
EOF

echo -e "${GREEN}✅ دیتابیس‌ها با موفقیت ایجاد شدند${NC}"

# اجرای مایگریشن‌ها
echo "🔄 در حال اجرای مایگریشن‌ها..."

cd "$(dirname "$0")/.." || exit
npm install
npm run migrate

echo -e "${GREEN}✅ مایگریشن‌ها با موفقیت اجرا شدند${NC}"

echo -e "${GREEN}✅ MySQL با موفقیت راه‌اندازی شد${NC}"
echo "🎉 می‌توانید از دیتابیس استفاده کنید"
echo "اطلاعات اتصال:"
echo "Host: localhost"
echo "User: root"
echo "Password: 123"
echo "Databases: picsend, picsend_logs" 