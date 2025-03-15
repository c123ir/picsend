# راه‌اندازی محلی پروژه PicSend

<div dir="rtl">

این راهنما شما را در مراحل راه‌اندازی محلی پروژه PicSend برای توسعه و تست هدایت می‌کند.

## پیش‌نیازها

قبل از شروع، اطمینان حاصل کنید که ابزارهای زیر را نصب کرده‌اید:

1. **Node.js**: نسخه 16 یا بالاتر
2. **npm** یا **yarn**: برای مدیریت وابستگی‌ها
3. **MySQL**: نسخه 8.0 یا بالاتر
4. **Git**: برای کلون کردن مخزن

## مراحل راه‌اندازی

### 1. دریافت کد منبع

ابتدا مخزن را از گیت‌هاب کلون کنید:

```bash
git clone https://github.com/username/picsend.git
cd picsend
```

### 2. نصب وابستگی‌ها

برای نصب وابستگی‌ها در هر سه بخش پروژه (کلاینت، سرور اصلی و سرویس لاگینگ)، دستورات زیر را اجرا کنید:

```bash
# نصب وابستگی‌های کلاینت
npm install

# نصب وابستگی‌های سرور اصلی
cd server
npm install
cd ..

# نصب وابستگی‌های سرویس لاگینگ
cd logger
npm install
cd ..
```

### 3. تنظیم فایل‌های محیطی (.env)

سه فایل محیطی باید ایجاد شود: یکی برای کلاینت، یکی برای سرور اصلی و یکی برای سرویس لاگینگ.

#### فایل محیطی کلاینت (`.env.local`)

این فایل را در پوشه ریشه پروژه ایجاد کنید:

```
VITE_API_URL=http://localhost:3010
VITE_LOGGER_URL=http://localhost:3015
VITE_SMS_API_KEY=your-sms-api-key
```

#### فایل محیطی سرور اصلی (`server/.env`)

این فایل را در پوشه `server` ایجاد کنید:

```
# تنظیمات سرور
PORT=3010
NODE_ENV=development

# تنظیمات دیتابیس
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-db-password
DB_NAME=picsend

# تنظیمات JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=24h

# تنظیمات سرویس لاگینگ
LOGGER_URL=http://localhost:3015

# تنظیمات سرویس پیامک
SMS_API_KEY=your-sms-api-key
SMS_TEMPLATE_ID=verification-template-id
```

#### فایل محیطی سرویس لاگینگ (`logger/.env`)

این فایل را در پوشه `logger` ایجاد کنید:

```
# تنظیمات سرور
PORT=3015
NODE_ENV=development

# تنظیمات دیتابیس
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-db-password
DB_NAME=picsend_logs

# تنظیمات فایل‌های لاگ
LOG_DIR=./logs
```

### 4. راه‌اندازی پایگاه داده

برای راه‌اندازی پایگاه داده، می‌توانید از اسکریپت آماده استفاده کنید یا به صورت دستی دیتابیس‌های مورد نیاز را ایجاد کنید.

#### روش خودکار (توصیه شده)

اجرای اسکریپت راه‌اندازی MySQL:

```bash
cd server/scripts
chmod +x setup-mysql.sh
./setup-mysql.sh
cd ../..
```

#### روش دستی

وارد کنسول MySQL شوید و دستورات زیر را اجرا کنید:

```sql
CREATE DATABASE IF NOT EXISTS picsend CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS picsend_logs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ایجاد کاربر برای توسعه (اختیاری)
CREATE USER IF NOT EXISTS 'picsend_user'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON picsend.* TO 'picsend_user'@'localhost';
GRANT ALL PRIVILEGES ON picsend_logs.* TO 'picsend_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. اجرای مهاجرت‌های پایگاه داده

برای ایجاد جداول در پایگاه داده، اسکریپت مهاجرت را اجرا کنید:

```bash
cd server
npm run migrate
cd ..

cd logger
npm run migrate
cd ..
```

### 6. راه‌اندازی سرویس لاگینگ

ابتدا سرویس لاگینگ را راه‌اندازی کنید:

```bash
cd logger
npm run dev
```

سرویس لاگینگ روی پورت 3015 در دسترس خواهد بود.

### 7. راه‌اندازی سرور اصلی

در یک ترمینال جدید، سرور اصلی را راه‌اندازی کنید:

```bash
cd server
npm run dev
```

سرور اصلی روی پورت 3010 در دسترس خواهد بود.

### 8. راه‌اندازی کلاینت

در یک ترمینال جدید، کلاینت را راه‌اندازی کنید:

```bash
npm run dev
```

کلاینت روی پورت 3005 در دسترس خواهد بود. با مراجعه به آدرس `http://localhost:3005` می‌توانید به برنامه دسترسی داشته باشید.

## عیب‌یابی مشکلات رایج

### مشکل در اتصال به پایگاه داده

اگر با خطای اتصال به پایگاه داده مواجه شدید:

1. مطمئن شوید سرویس MySQL در حال اجراست:
   ```bash
   # در macOS
   brew services list
   # یا در Linux
   sudo systemctl status mysql
   ```

2. تنظیمات دیتابیس در فایل‌های `.env` را بررسی کنید.

3. دسترسی‌های کاربر دیتابیس را بررسی کنید:
   ```bash
   mysql -u root -p
   mysql> SHOW GRANTS FOR 'root'@'localhost';
   ```

### مشکل در پورت‌های در حال استفاده

اگر یکی از پورت‌ها قبلاً در حال استفاده است:

1. پورت‌های در حال استفاده را بررسی کنید:
   ```bash
   # در macOS/Linux
   lsof -i :3010
   lsof -i :3015
   lsof -i :3005
   ```

2. فرآیند مربوطه را متوقف کنید یا پورت را در فایل‌های `.env` تغییر دهید.

### مشکل در نصب وابستگی‌ها

اگر با خطا در نصب وابستگی‌ها مواجه شدید:

1. کش npm را پاک کنید:
   ```bash
   npm cache clean --force
   ```

2. با استفاده از `--legacy-peer-deps` دوباره تلاش کنید:
   ```bash
   npm install --legacy-peer-deps
   ```

## کاربر پیش‌فرض

پس از اجرای موفقیت‌آمیز مهاجرت‌ها، یک کاربر ادمین پیش‌فرض با مشخصات زیر ایجاد می‌شود:

- **ایمیل**: `admin@example.com`
- **رمز عبور**: `Admin123!`

می‌توانید از این کاربر برای ورود اولیه به سیستم استفاده کنید.

## فلوچارت راه‌اندازی

```
┌────────────────┐     ┌───────────────────┐     ┌────────────────┐
│                │     │                   │     │                │
│  Clone Repo    │────▶│  Install Deps     │────▶│  Setup .env    │
│                │     │                   │     │                │
└────────────────┘     └───────────────────┘     └───────┬────────┘
                                                         │
                                                         ▼
┌────────────────┐     ┌───────────────────┐     ┌────────────────┐
│                │     │                   │     │                │
│  Start Client  │◀────│  Start Main Server│◀────│  Setup Database│
│                │     │                   │     │                │
└────────────────┘     └───────────────────┘     └───────┬────────┘
        ▲                       ▲                        │
        │                       │                        │
        │                       │                        ▼
        │                       │               ┌────────────────┐
        │                       │               │                │
        └───────────────────────┴───────────────│ Start Logger   │
                                                │                │
                                                └────────────────┘
```

## منابع تکمیلی

- [مستندات API](../api/api-docs.md)
- [ساختار پروژه](../development/code-structure.md)
- [مستندات مدل داده](../database/data-model.md)

</div> 