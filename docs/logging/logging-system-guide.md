# راهنمای جامع سیستم لاگینگ

## معرفی
این سیستم لاگینگ یک راهکار جامع برای ثبت و مدیریت لاگ‌ها در برنامه‌های Full-stack است که از معماری کلاینت-سرور استفاده می‌کنند. این سیستم شامل سه بخش اصلی است:
1. سرور لاگینگ مرکزی (پورت 3015)
2. سیستم لاگینگ سمت سرور (پورت 3010)
3. سیستم لاگینگ سمت کلاینت (پورت 3005)

## ساختار پوشه‌ها

```
logs/
├── server-3010/
│   ├── error/            # خطاهای سیستمی و برنامه
│   ├── info/             # لاگ‌های عمومی و رویدادها
│   └── debug/            # لاگ‌های توسعه و دیباگ
└── client-3005/
    ├── error/            # خطاهای فرانت‌اند
    ├── info/             # اطلاعات عملکرد
    └── debug/            # اطلاعات تحلیلی کاربران
```

## بخش اول: سرور لاگینگ مرکزی

### معماری و قابلیت‌ها
- پورت: 3015
- داشبورد مدیریت با رابط کاربری مدرن
- پشتیبانی از Socket.IO برای لاگ‌های زنده
- API‌های RESTful برای دریافت و مدیریت لاگ‌ها
- سیستم فیلترینگ و جستجوی پیشرفته
- قابلیت خروجی گرفتن از لاگ‌ها

### داشبورد مدیریت
داشبورد در آدرس `http://localhost:3015/dashboard` در دسترس است و شامل:

1. **نمایش آمار و نمودارها**
   - نمودار دایره‌ای توزیع سطوح لاگ
   - نمودار خطی روند لاگ‌ها در طول زمان
   - آمار کلی به تفکیک سطح لاگ

2. **فیلترهای پیشرفته**
   - فیلتر بر اساس سرویس
   - فیلتر بر اساس سطح لاگ (Error, Warn, Info, Debug)
   - فیلتر بر اساس بازه زمانی (1h, 6h, 24h, 7d, 30d)

3. **قابلیت‌های ویژه**
   - نمایش زنده لاگ‌ها با Socket.IO
   - خروجی گرفتن از لاگ‌ها در فرمت JSON
   - مشاهده جزئیات کامل هر لاگ در مودال
   - بروزرسانی خودکار اطلاعات

### API‌های سرور لاگینگ

1. **ثبت لاگ جدید**
```http
POST /api/logs
Content-Type: application/json

{
  "level": "error",
  "message": "خطای اتصال به دیتابیس",
  "source": "server-3010",
  "metadata": {
    "error": "ECONNREFUSED",
    "details": "..."
  }
}
```

2. **دریافت لاگ‌ها**
```http
GET /api/logs/:source?timeRange=24h&level=error
```

3. **خروجی گرفتن**
```http
GET /api/logs/export/:source?timeRange=24h
```

4. **دریافت لیست سرویس‌ها**
```http
GET /api/logs/sources
```

## بخش دوم: لاگینگ سمت سرور

### تکنولوژی‌ها و ابزارها
- **Winston**: کتابخانه اصلی لاگینگ
- **Winston Daily Rotate File**: چرخش خودکار فایل‌های لاگ
- **Morgan**: لاگ کردن درخواست‌های HTTP

### پیکربندی Winston
```typescript
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const fileRotateConfig = {
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '30d',
  zippedArchive: true,
};
```

### نمونه ساختار لاگ سرور
```json
{
  "timestamp": "2024-03-12T10:30:00.000Z",
  "level": "error",
  "service": "auth-service",
  "message": "خطا در احراز هویت",
  "metadata": {
    "userId": "123",
    "requestId": "req-456",
    "path": "/api/auth",
    "method": "POST"
  },
  "stack": "..."
}
```

## بخش سوم: لاگینگ سمت کلاینت

### تکنولوژی‌ها و ابزارها
- **Sentry**: مانیتورینگ خطاها در محیط production
- **Debug**: لاگینگ در محیط توسعه
- **localStorage**: ذخیره موقت لاگ‌ها
- **Performance API**: ثبت متریک‌های عملکردی

### کلاس ClientLogger
```typescript
interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

class ClientLogger {
  static log(level: LogEntry['level'], message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    };
    
    // ارسال به سرور در صورت نیاز
    if (level === 'error' || level === 'warn') {
      this.sendToServer(entry);
    }
    
    // ذخیره در localStorage برای دیباگ
    this.storeLocally(entry);
  }
}
```

## مدیریت خطاها و بهترین شیوه‌ها

### مدیریت قطعی ارتباط
1. **ذخیره موقت**
   - استفاده از localStorage برای ذخیره لاگ‌ها
   - محدودیت حجم: حداکثر 5MB
   - ارسال خودکار پس از برقراری ارتباط

2. **مدیریت حافظه**
   - حذف خودکار لاگ‌های قدیمی
   - فشرده‌سازی داده‌ها
   - اولویت‌بندی لاگ‌های مهم

### بهترین شیوه‌های لاگینگ
1. **ساختار پیام‌ها**
   - استفاده از پیام‌های توصیفی و مختصر
   - افزودن متادیتای مفید
   - رعایت سطح‌بندی مناسب

2. **امنیت**
   - عدم لاگ کردن اطلاعات حساس
   - رمزنگاری داده‌های شخصی
   - کنترل دسترسی به داشبورد

3. **عملکرد**
   - استفاده از Socket.IO برای لاگ‌های زنده
   - چرخش خودکار فایل‌ها
   - نمونه‌برداری از لاگ‌های پرتکرار

## راه‌اندازی و نگهداری

### راه‌اندازی سیستم

#### نصب و راه‌اندازی اولیه
1. **نصب وابستگی‌ها**:
```bash
cd server/logging-server && npm install
```

2. **راه‌اندازی خودکار با PM2**:
```bash
# دادن دسترسی اجرا به اسکریپت
chmod +x scripts/startup.sh

# اجرای اسکریپت راه‌اندازی
./scripts/startup.sh
```

3. **دستورات مدیریتی**:
- مشاهده لاگ‌ها: `npm run pm2:logs`
- مانیتورینگ: `npm run pm2:monitor`
- راه‌اندازی مجدد: `npm run pm2:restart`
- توقف سرور: `npm run pm2:stop`

#### تنظیم راه‌اندازی خودکار در سیستم‌عامل
برای لینوکس (systemd):
```bash
# ایجاد سرویس سیستمی
sudo nano /etc/systemd/system/logging-server.service

# محتوای فایل سرویس
[Unit]
Description=PicSend Logging Server
After=network.target

[Service]
Type=forking
User=<your-user>
WorkingDirectory=/path/to/server/logging-server
ExecStart=/usr/local/bin/pm2 start ecosystem.config.js
ExecReload=/usr/local/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/local/bin/pm2 stop ecosystem.config.js

[Install]
WantedBy=multi-user.target

# فعال‌سازی سرویس
sudo systemctl enable logging-server
sudo systemctl start logging-server
```

برای macOS (launchd):
```bash
# ایجاد فایل plist
nano ~/Library/LaunchAgents/com.picsend.logging-server.plist

# محتوای فایل plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.picsend.logging-server</string>
    <key>WorkingDirectory</key>
    <string>/path/to/server/logging-server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/pm2</string>
        <string>start</string>
        <string>ecosystem.config.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>

# بارگذاری سرویس
launchctl load ~/Library/LaunchAgents/com.picsend.logging-server.plist
```

### نگهداری
1. **مدیریت فایل‌ها**
   - پاکسازی خودکار لاگ‌های قدیمی (> 30 روز)
   - فشرده‌سازی فایل‌های آرشیوی
   - بررسی دوره‌ای حجم دیسک

2. **پشتیبان‌گیری**
   - پشتیبان‌گیری روزانه از لاگ‌های مهم
   - آرشیو ماهانه
   - حفظ لاگ‌های امنیتی تا 1 سال

### مانیتورینگ
1. **هشدارها**
   - ایمیل برای خطاهای بحرانی
   - نوتیفیکیشن Slack برای هشدارها
   - پیامک برای مشکلات حیاتی

2. **متریک‌ها**
   - نرخ خطا
   - حجم لاگ‌ها
   - زمان پاسخ‌گویی API 