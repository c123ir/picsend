# سرویس لاگینگ PicSend

<div dir="rtl">

## معرفی

سرویس لاگینگ PicSend یک میکروسرویس مستقل است که برای ثبت، مدیریت و نمایش لاگ‌های سیستم طراحی شده است. این سرویس به عنوان یک ابزار کمکی برای تیم توسعه و مدیران سیستم عمل می‌کند تا فعالیت‌های برنامه را مانیتور کنند و مشکلات احتمالی را سریع‌تر شناسایی و رفع نمایند.

## ویژگی‌های اصلی

- **جمع‌آوری لاگ‌ها**: دریافت لاگ از سرویس‌های مختلف سیستم
- **ذخیره‌سازی لاگ‌ها**: ثبت لاگ‌ها در دیتابیس MySQL و فایل‌های چرخشی
- **رابط کاربری وب**: داشبورد وب برای مدیریت و بررسی لاگ‌ها
- **فیلترینگ و جستجو**: امکان فیلتر کردن لاگ‌ها بر اساس سطح، سرویس و زمان
- **پشتیبانی از API RESTful**: ارائه API برای ارسال و دریافت لاگ‌ها

## معماری

سرویس لاگینگ از معماری زیر تشکیل شده است:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│ سرویس‌های اصلی   │──────►│  سرویس لاگینگ   │──────►│   دیتابیس لاگ    │
│                 │       │                 │       │                 │
└─────────────────┘       └────────┬────────┘       └─────────────────┘
                                   │
                                   │
                                   ▼
                          ┌─────────────────┐
                          │                 │
                          │  فایل‌های لاگ    │
                          │                 │
                          └─────────────────┘
```

## تکنولوژی‌های استفاده شده

- **زبان برنامه‌نویسی**: TypeScript / Node.js
- **فریم‌ورک وب**: Express.js
- **کتابخانه لاگینگ**: Winston با پشتیبانی از DailyRotateFile
- **پایگاه داده**: MySQL با Sequelize ORM
- **رابط کاربری**: HTML/CSS/JS با پشتیبانی از RTL

## راه‌اندازی

### پیش‌نیازها

- Node.js نسخه 16 یا بالاتر
- MySQL نسخه 8.0 یا بالاتر
- npm یا yarn

### نصب و راه‌اندازی

```bash
# کلون کردن ریپوزیتوری
git clone https://github.com/c123ir/picsend.git
cd picsend/logger

# نصب وابستگی‌ها
npm install

# تنظیم فایل .env
cp .env.example .env
# ویرایش فایل .env با تنظیمات مناسب

# راه‌اندازی دیتابیس
mysql -u root -p
CREATE DATABASE picsend_logs;

# اجرای برنامه در محیط توسعه
npm run dev

# اجرای برنامه در محیط تولید
npm run build
npm start
```

## ساختار پروژه

```
logger/
├── dist/                  # کدهای کامپایل شده TypeScript
├── logs/                  # فایل‌های لاگ
├── node_modules/          # وابستگی‌ها
├── scripts/               # اسکریپت‌های کمکی
│   ├── setup-macos.sh     # اسکریپت راه‌اندازی در macOS
│   └── startup.sh         # اسکریپت راه‌اندازی
├── src/                   # کد منبع
│   ├── config/            # تنظیمات
│   ├── models/            # مدل‌های دیتابیس
│   ├── public/            # فایل‌های استاتیک
│   │   ├── dashboard.html # صفحه داشبورد
│   │   ├── dashboard.js   # اسکریپت داشبورد
│   │   └── index.html     # صفحه اصلی
│   ├── routes/            # مسیرهای API
│   │   ├── dashboard.ts   # مسیرهای داشبورد
│   │   └── logs.ts        # مسیرهای لاگ
│   ├── index.ts           # نقطه ورود برنامه
│   ├── logging.ts         # کلاس لاگینگ
│   ├── server.ts          # پیکربندی سرور
│   └── socket.ts          # پیکربندی WebSocket
├── test/                  # تست‌ها
├── .env                   # متغیرهای محیطی
├── .gitignore             # فایل‌های نادیده گرفته شده توسط git
├── ecosystem.config.js    # تنظیمات PM2
├── package.json           # وابستگی‌ها و اسکریپت‌ها
├── README.md              # مستندات
└── tsconfig.json          # تنظیمات TypeScript
```

## API‌های لاگینگ

### افزودن لاگ جدید

```
POST /logs
```

**بدنه درخواست:**

```json
{
  "level": "info",
  "message": "این یک پیام لاگ است",
  "service": "main-server",
  "metadata": {
    "userId": 1,
    "path": "/users/1",
    "method": "GET"
  }
}
```

**پاسخ:**

```json
{
  "id": 1,
  "level": "info",
  "message": "این یک پیام لاگ است",
  "timestamp": "2023-06-07T10:00:00.000Z",
  "service": "main-server",
  "metadata": {
    "userId": 1,
    "path": "/users/1",
    "method": "GET"
  }
}
```

### دریافت لاگ‌ها

```
GET /logs?level=info&service=main-server&startDate=2023-06-01&endDate=2023-06-07&page=1&limit=20
```

**پارامترهای Query String:**

- `level`: سطح لاگ (info, warn, error)
- `service`: نام سرویس (main-server, log-server)
- `startDate`: تاریخ شروع (ISO format)
- `endDate`: تاریخ پایان (ISO format)
- `page`: شماره صفحه (پیش‌فرض: 1)
- `limit`: تعداد آیتم‌ها در هر صفحه (پیش‌فرض: 20)

**پاسخ:**

```json
{
  "logs": [
    {
      "id": 1,
      "level": "info",
      "message": "این یک پیام لاگ است",
      "timestamp": "2023-06-07T10:00:00.000Z",
      "service": "main-server",
      "metadata": {
        "userId": 1,
        "path": "/users/1",
        "method": "GET"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

## رابط گرافیکی کاربر

سرویس لاگینگ دارای یک رابط کاربری وب است که از طریق آدرس `http://localhost:3015` قابل دسترسی است. این رابط کاربری امکانات زیر را فراهم می‌کند:

- **مشاهده لاگ‌ها**: نمایش لاگ‌ها با رنگ‌بندی مناسب بر اساس سطح لاگ
- **فیلترینگ**: فیلتر کردن لاگ‌ها بر اساس سطح، سرویس و بازه زمانی
- **جستجو**: جستجو در متن لاگ‌ها
- **مرتب‌سازی**: مرتب‌سازی لاگ‌ها بر اساس زمان (جدیدترین اول)
- **به‌روزرسانی خودکار**: نمایش لاگ‌های جدید به صورت خودکار

## کلاینت لاگینگ

برای استفاده از سرویس لاگینگ در سایر سرویس‌ها، یک کلاینت لاگینگ ارائه شده است. این کلاینت را می‌توان به سادگی در هر سرویس Node.js استفاده کرد.

نمونه استفاده:

```typescript
import Logger from './utils/logger';

// ثبت لاگ سطح info
Logger.info('عملیات با موفقیت انجام شد', { userId: 1, operation: 'login' });

// ثبت لاگ سطح warning
Logger.warn('هشدار: ورود ناموفق', { userId: 1, attempts: 3 });

// ثبت لاگ سطح error
Logger.error('خطا در اتصال به دیتابیس', { error: err });
```

## سطوح لاگینگ

سیستم لاگینگ از سه سطح اصلی پشتیبانی می‌کند:

1. **Info**: اطلاعات عادی و موفقیت‌آمیز
2. **Warn**: هشدارها و موارد غیرعادی
3. **Error**: خطاها و مشکلات جدی

## مدیریت فایل‌های لاگ

لاگ‌ها علاوه بر دیتابیس، در فایل‌های روزانه نیز ذخیره می‌شوند. این فایل‌ها در پوشه `logs` قرار دارند و به صورت زیر نام‌گذاری می‌شوند:

- `logs/combined-%DATE%.log`: تمام لاگ‌ها
- `logs/error-%DATE%.log`: فقط لاگ‌های خطا

فایل‌های لاگ به صورت خودکار پس از رسیدن به اندازه مشخص یا گذشت زمان معین آرشیو می‌شوند.

## بست پرکتیس‌های لاگینگ

- **ساختار یکسان**: از ساختار یکسان برای ثبت لاگ‌ها استفاده کنید
- **اطلاعات کافی**: اطلاعات کافی (نه بیش از حد) در لاگ‌ها قرار دهید
- **عدم ثبت اطلاعات حساس**: از ثبت اطلاعات حساس مانند رمز عبور در لاگ‌ها خودداری کنید
- **سطح مناسب**: از سطح لاگینگ مناسب برای هر رویداد استفاده کنید
- **لاگینگ خطاها**: تمام خطاها را با جزئیات کافی ثبت کنید

## مشارکت در توسعه

برای مشارکت در توسعه سرویس لاگینگ، می‌توانید روند زیر را دنبال کنید:

1. ریپوزیتوری را fork کنید
2. یک branch جدید ایجاد کنید
3. تغییرات خود را اعمال کنید
4. یک pull request ارسال کنید

## مسئول توسعه

تیم توسعه PicSend

</div> 