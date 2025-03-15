# مدل داده PicSend

<div dir="rtl">

این سند مدل داده پروژه PicSend را به تفصیل توضیح می‌دهد. هدف از این سند، ارائه یک دید کلی از ساختار داده، روابط بین جداول و نقش‌های هر موجودیت است.

## نمای کلی مدل داده

سیستم PicSend از یک مدل داده رابطه‌ای استفاده می‌کند که با استفاده از Sequelize ORM پیاده‌سازی شده است. این مدل شامل چندین جدول اصلی است که برای مدیریت کاربران، احراز هویت و سایر عملکردهای سیستم استفاده می‌شوند.

### نمودار ارتباط موجودیت‌ها (ERD)

```
+---------------+     +-------------------+     +----------------+
|               |     |                   |     |                |
|     User      +---->+ VerificationCode  |     |     Role      |
|               |     |                   |     |                |
+-------+-------+     +-------------------+     +-------+--------+
        ^                                                |
        |                                                |
        +------------------------------------------------+
                        
+---------------+     +------------------+ 
|               |     |                  |
|     Log       |     |    Setting       |
|               |     |                  |
+---------------+     +------------------+
```

## مدل‌های داده

### User (کاربر)

جدول `users` اطلاعات کاربران سیستم را نگهداری می‌کند.

| فیلد            | نوع داده       | توضیحات                                  |
|-----------------|---------------|------------------------------------------|
| id              | INTEGER       | شناسه منحصر به فرد (کلید اصلی)           |
| username        | STRING        | نام کاربری (منحصر به فرد)                |
| email           | STRING        | آدرس ایمیل (منحصر به فرد، می‌تواند خالی باشد) |
| phone           | STRING        | شماره تلفن (منحصر به فرد، می‌تواند خالی باشد) |
| password        | STRING        | رمز عبور هش شده با bcrypt                 |
| fullName        | STRING        | نام کامل                                  |
| role            | ENUM          | نقش کاربر (ADMIN, USER)                  |
| isActive        | BOOLEAN       | وضعیت فعال بودن حساب                     |
| lastLogin       | DATE          | آخرین زمان ورود                          |
| createdAt       | DATE          | تاریخ ایجاد                              |
| updatedAt       | DATE          | تاریخ آخرین بروزرسانی                    |

```typescript
interface IUser {
  id?: number;
  username: string;
  email: string | null;
  phone: string | null;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  lastLogin: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### VerificationCode (کد تأیید)

جدول `verification_codes` برای نگهداری کدهای تأیید ارسال شده به کاربران (مثلاً برای احراز هویت دو مرحله‌ای) استفاده می‌شود.

| فیلد            | نوع داده       | توضیحات                                 |
|-----------------|---------------|------------------------------------------|
| id              | INTEGER       | شناسه منحصر به فرد (کلید اصلی)           |
| phone           | STRING        | شماره تلفن کاربر                         |
| code            | STRING        | کد تأیید ارسال شده                       |
| expiresAt       | DATE          | زمان انقضای کد                           |
| attempts        | INTEGER       | تعداد تلاش‌های ناموفق                    |
| createdAt       | DATE          | تاریخ ایجاد                              |
| updatedAt       | DATE          | تاریخ آخرین بروزرسانی                    |

```typescript
interface IVerificationCode {
  id?: number;
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Log (لاگ)

جدول `logs` برای ذخیره‌سازی لاگ‌های سیستم استفاده می‌شود.

| فیلد            | نوع داده       | توضیحات                                  |
|-----------------|---------------|------------------------------------------|
| id              | INTEGER       | شناسه منحصر به فرد (کلید اصلی)           |
| level           | ENUM          | سطح لاگ (INFO, WARN, ERROR, DEBUG)      |
| message         | TEXT          | پیام لاگ                                 |
| meta            | JSON          | اطلاعات اضافی در قالب JSON               |
| service         | STRING        | سرویس مربوطه (MAIN, LOGGER, CLIENT)     |
| timestamp       | DATE          | زمان ثبت لاگ                             |
| userId          | INTEGER       | شناسه کاربر مرتبط (اختیاری)              |

```typescript
interface ILog {
  id?: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  meta?: Record<string, any>;
  service: 'MAIN' | 'LOGGER' | 'CLIENT';
  timestamp: Date;
  userId?: number;
}
```

### Setting (تنظیمات)

جدول `settings` برای ذخیره‌سازی تنظیمات سیستم استفاده می‌شود.

| فیلد            | نوع داده       | توضیحات                                  |
|-----------------|---------------|------------------------------------------|
| id              | INTEGER       | شناسه منحصر به فرد (کلید اصلی)           |
| key             | STRING        | کلید تنظیم (منحصر به فرد)                |
| value           | TEXT          | مقدار تنظیم                              |
| description     | TEXT          | توضیحات                                  |
| createdAt       | DATE          | تاریخ ایجاد                              |
| updatedAt       | DATE          | تاریخ آخرین بروزرسانی                    |

```typescript
interface ISetting {
  id?: number;
  key: string;
  value: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## روابط بین جداول

1. **کاربر و کد تأیید**:
   - رابطه یک به چند بین `User` و `VerificationCode`
   - یک کاربر می‌تواند چندین کد تأیید داشته باشد (در زمان‌های مختلف)

2. **کاربر و لاگ**:
   - رابطه یک به چند بین `User` و `Log`
   - هر لاگ می‌تواند با یک کاربر مرتبط باشد (اختیاری)

## قواعد کسب و کار (Business Rules)

1. **کاربران**:
   - شماره تلفن یا ایمیل برای هر کاربر ضروری است (حداقل یکی از آن‌ها باید وارد شود)
   - رمز عبور باید حداقل 8 کاراکتر باشد و شامل حروف بزرگ، کوچک و اعداد باشد
   - کاربران با نقش `ADMIN` دسترسی به عملیات مدیریتی دارند

2. **کدهای تأیید**:
   - کدهای تأیید پس از 2 دقیقه منقضی می‌شوند
   - حداکثر تعداد تلاش برای وارد کردن کد تأیید 3 بار است
   - بعد از 3 تلاش ناموفق، کاربر باید کد جدیدی درخواست کند

3. **لاگ‌ها**:
   - لاگ‌ها به صورت خودکار پس از 30 روز آرشیو می‌شوند
   - لاگ‌های سطح `ERROR` به صورت خودکار به مدیران سیستم اطلاع‌رسانی می‌شوند

## مهاجرت‌ها و مدیریت نسخه‌های مدل داده

مدیریت نسخه‌های مدل داده با استفاده از اسکریپت‌های مهاجرت Sequelize انجام می‌شود. این مهاجرت‌ها در پوشه `server/src/scripts/migrations` قرار دارند و با اجرای اسکریپت `npm run migrate` اعمال می‌شوند.

### نمونه مهاجرت

```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      // ... سایر فیلدها
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('users');
  },
};
```

## استراتژی‌های پایگاه داده

1. **ایندکس‌گذاری**:
   - ایندکس روی فیلدهای پر جستجو مانند `username`، `email` و `phone`
   - ایندکس ترکیبی برای جدول لاگ روی فیلدهای `level` و `timestamp`

2. **بهینه‌سازی پرس و جوها**:
   - استفاده از کوئری‌های پارامتریک برای جلوگیری از حملات SQL Injection
   - محدود کردن نتایج با `limit` و `offset` برای پرس و جوهای بزرگ

3. **پشتیبان‌گیری**:
   - پشتیبان‌گیری روزانه از پایگاه داده
   - نگهداری پشتیبان‌ها برای 30 روز

## نمونه کوئری‌های رایج

### دریافت کاربر با نام کاربری یا ایمیل

```typescript
const user = await User.findOne({
  where: {
    [Op.or]: [
      { username },
      { email }
    ]
  }
});
```

### بروزرسانی آخرین زمان ورود کاربر

```typescript
await User.update(
  { lastLogin: new Date() },
  { where: { id: userId } }
);
```

### ذخیره کد تأیید جدید

```typescript
await VerificationCode.create({
  phone,
  code,
  expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 دقیقه از الان
  attempts: 0
});
```

### دریافت لاگ‌ها با فیلتر

```typescript
const logs = await Log.findAll({
  where: {
    level: 'ERROR',
    timestamp: {
      [Op.gte]: startDate,
      [Op.lte]: endDate
    }
  },
  order: [['timestamp', 'DESC']],
  limit: 100
});
```

## منابع تکمیلی

- [راهنمای Sequelize](https://sequelize.org/master/)
- [مستندات API](../api/api-docs.md)
- [اسکریپت راه‌اندازی دیتابیس](../deployment/database-setup.md)

</div> 