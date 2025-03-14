# PicSend

پلتفرم مدیریت و به اشتراک‌گذاری تصاویر با قابلیت مدیریت گروه‌ها و درخواست‌ها

## ویژگی‌ها

- مدیریت و به اشتراک‌گذاری تصاویر
- مدیریت گروه‌ها و کاربران
- سیستم درخواست و تایید
- رابط کاربری ریسپانسیو و مدرن
- پشتیبانی از زبان فارسی
- تم روشن و تاریک
- احراز هویت و مدیریت دسترسی‌ها

## تکنولوژی‌ها

- React
- TypeScript
- Vite
- Material-UI (MUI)
- React Router
- RTL Support

## نیازمندی‌ها

- Node.js 18 یا بالاتر
- npm یا yarn

## نصب و راه‌اندازی

1. کلون کردن مخزن:
```bash
git clone https://github.com/yourusername/picsend.git
cd picsend
```

2. نصب وابستگی‌ها:
```bash
npm install
# یا
yarn
```

3. اجرای برنامه در حالت توسعه:
```bash
npm run dev
# یا
yarn dev
```

4. ساخت نسخه تولید:
```bash
npm run build
# یا
yarn build
```

## ساختار پروژه

```
src/
  ├── components/        # کامپوننت‌های قابل استفاده مجدد
  │   ├── layout/       # کامپوننت‌های لایه
  │   └── ui/          # کامپوننت‌های رابط کاربری
  ├── pages/            # صفحات برنامه
  ├── lib/              # توابع و تنظیمات مشترک
  ├── routes.tsx        # تنظیمات مسیریابی
  └── main.tsx         # نقطه ورود برنامه
```

## مستندات API

برای اطلاعات بیشتر در مورد API‌های مورد استفاده به فایل [API.md](./API.md) مراجعه کنید.

## مشارکت

1. Fork کردن مخزن
2. ایجاد برنچ برای ویژگی جدید (`git checkout -b feature/amazing-feature`)
3. Commit کردن تغییرات (`git commit -m 'Add some amazing feature'`)
4. Push کردن به برنچ (`git push origin feature/amazing-feature`)
5. ایجاد Pull Request

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. برای اطلاعات بیشتر به فایل [LICENSE](./LICENSE) مراجعه کنید.

POST /auth/send-code     // ارسال کد تایید
POST /auth/verify-code   // تایید کد و ورود/ثبت‌نام
POST /auth/login         // ورود با نام کاربری و رمز عبور
