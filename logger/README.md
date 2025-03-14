# سرور مدیریت لاگ‌ها

این پروژه یک سرور مدیریت لاگ با داشبورد وب است که امکان مشاهده، فیلتر و مدیریت لاگ‌ها را فراهم می‌کند.

## ویژگی‌ها

- داشبورد وب زیبا و کاربرپسند
- نمایش لاگ‌ها به صورت زنده
- فیلتر بر اساس سطح لاگ، سرویس و بازه زمانی
- جستجو در لاگ‌ها
- نمودارهای آماری
- امکان خروجی گرفتن به فرمت JSON
- ذخیره لاگ‌ها با استفاده از Winston
- پشتیبانی از Socket.IO برای به‌روزرسانی زنده

## نیازمندی‌ها

- Node.js نسخه 14 یا بالاتر
- npm یا yarn

## نصب و راه‌اندازی

1. نصب وابستگی‌ها:
```bash
npm install
# یا
yarn install
```

2. راه‌اندازی سرور:
```bash
# حالت توسعه
npm run dev
# یا
yarn dev

# حالت تولید
npm start
# یا
yarn start
```

سرور به صورت پیش‌فرض روی پورت 3015 راه‌اندازی می‌شود. می‌توانید با تنظیم متغیر محیطی `PORT` پورت را تغییر دهید.

## API Endpoints

### دریافت لاگ‌ها
```
GET /api/logs/:source?
```
پارامترها:
- `source` (اختیاری): فیلتر بر اساس سرویس
- `level` (query): فیلتر بر اساس سطح لاگ (error, warn, info, debug)
- `search` (query): جستجو در پیام و سرویس
- `timeRange` (query): بازه زمانی (1h, 3h, 6h, 12h, 24h, 2d, 7d)

### دریافت لیست سرویس‌ها
```
GET /api/logs/sources
```

### خروجی گرفتن از لاگ‌ها
```
GET /api/logs/export/:source?
```
پارامترها مشابه endpoint دریافت لاگ‌ها است.

### ثبت لاگ جدید
```
POST /api/logs
```
بدنه درخواست:
```json
{
    "level": "error|warn|info|debug",
    "message": "پیام لاگ",
    "source": "نام سرویس (اختیاری)"
}
```

## Socket.IO Events

### دریافت لاگ جدید
```javascript
socket.on('log', (log) => {
    // log: { level, message, source, timestamp }
});
```

### دریافت هشدار
```javascript
socket.on('alert', (alert) => {
    // alert: { type, message }
});
```

## ساختار پروژه

```
logging-server/
├── src/
│   ├── public/
│   │   ├── dashboard.html
│   │   ├── dashboard.js
│   │   └── styles.css
│   └── server.js
├── logs/
│   ├── error.log
│   └── combined.log
├── package.json
└── README.md
```

## مجوز

MIT 