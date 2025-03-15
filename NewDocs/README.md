# مستندات پروژه PicSend

<div dir="rtl">

به مستندات رسمی پروژه PicSend خوش آمدید. این مستندات برای راهنمایی توسعه‌دهندگان، مدیران و کاربران پروژه تهیه شده است و اطلاعات جامعی در مورد معماری، نحوه راه‌اندازی، API ها و خط مشی توسعه پروژه ارائه می‌دهد.

## ساختار مستندات

مستندات به بخش‌های زیر تقسیم شده است:

### [معماری](./architecture/system-architecture.md)
- [معماری سیستم](./architecture/system-architecture.md)
- [معماری امنیت](./security/security-architecture.md)

### [تنظیم و راه‌اندازی](./deployment/local-setup.md)
- [راه‌اندازی محلی](./deployment/local-setup.md)
- [راه‌اندازی در محیط تولید](./deployment/production-setup.md)
- [راه‌اندازی دیتابیس](./deployment/database-setup.md)

### [مستندات API](./api/api-docs.md)
- [مستندات API](./api/api-docs.md)
- [احراز هویت API](./api/authentication.md)

### [مدل داده](./database/data-model.md)
- [مدل داده](./database/data-model.md)
- [روابط بین جداول](./database/relationships.md)

### [راهنمای توسعه](./development/code-structure.md)
- [ساختار کد](./development/code-structure.md)
- [کانونشن‌های کدنویسی](./development/coding-conventions.md)
- [گردش کار توسعه](./development/workflow.md)

### [سرویس‌ها](./services/logging-service.md)
- [سرویس لاگینگ](./services/logging-service.md)
- [سرویس پیامک](./services/sms-service.md)

### [نقشه راه](./roadmap/development-roadmap.md)
- [نقشه راه توسعه](./roadmap/development-roadmap.md)
- [برنامه انتشار](./roadmap/release-plan.md)

## هدف پروژه

PicSend یک پلتفرم مدیریت و اشتراک‌گذاری تصاویر است که به کاربران امکان می‌دهد تصاویر خود را در فضای ابری ذخیره کنند، آن‌ها را مدیریت نمایند و با دیگران به اشتراک بگذارند. این پروژه با هدف ایجاد یک راه‌حل بومی، امن و کاربرپسند برای مدیریت تصاویر طراحی شده است.

## ویژگی‌های اصلی

- **احراز هویت چندگانه**: پشتیبانی از ورود با نام کاربری/ایمیل و رمز عبور یا کد تأیید پیامکی (OTP)
- **مدیریت کاربران**: ثبت نام، ویرایش پروفایل، مدیریت دسترسی‌ها
- **آپلود و مدیریت تصاویر**: امکان آپلود، دسته‌بندی و مدیریت تصاویر
- **اشتراک‌گذاری تصاویر**: اشتراک‌گذاری تصاویر با سطوح دسترسی مختلف
- **گروه‌بندی کاربران**: امکان ایجاد گروه‌های کاربری و مدیریت دسترسی‌های گروهی
- **سیستم لاگینگ پیشرفته**: ثبت و مدیریت لاگ‌های سیستم با سرویس مستقل

## تکنولوژی‌های استفاده شده

- **فرانت‌اند**: React، TypeScript، Vite
- **بک‌اند**: Node.js، Express، TypeScript
- **پایگاه داده**: MySQL
- **ORM**: Sequelize
- **احراز هویت**: JWT، SMS OTP
- **API**: RESTful API
- **مدیریت حالت**: Context API
- **استایل**: CSS Modules، Tailwind CSS

## همکاری در توسعه

اگر مایل به همکاری در توسعه PicSend هستید، لطفاً [راهنمای مشارکت‌کنندگان](./development/contributing.md) را مطالعه کنید. ما از همکاری شما استقبال می‌کنیم!

## گزارش مشکلات

اگر با مشکلی در استفاده از پروژه مواجه شدید یا پیشنهادی برای بهبود آن دارید، لطفاً یک Issue در مخزن گیت‌هاب ایجاد کنید.

## مجوز

پروژه PicSend تحت مجوز [MIT](../LICENSE) منتشر شده است.

</div> 