# مستندات API پروژه PicSend

<div dir="rtl">

این سند API های پروژه PicSend را به تفصیل توضیح می‌دهد. هدف از این سند، ارائه یک راهنمای جامع برای استفاده از اندپوینت‌های API سیستم است.

## اطلاعات کلی API

- **URL پایه**: `http://localhost:3010` (در محیط توسعه)
- **فرمت مبادله داده**: JSON
- **احراز هویت**: JWT (JSON Web Token)
- **نسخه API**: v1

## احراز هویت

برای دسترسی به اکثر اندپوینت‌ها، نیاز به احراز هویت است. احراز هویت با استفاده از JWT انجام می‌شود که باید در هدر `Authorization` درخواست‌ها با فرمت `Bearer <token>` قرار گیرد.

### نمونه هدر احراز هویت

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## اندپوینت‌های API

### احراز هویت

#### ارسال کد تأیید 

ارسال کد تأیید به شماره موبایل کاربر.

- **URL**: `/auth/send-code`
- **روش**: `POST`
- **احراز هویت مورد نیاز**: خیر
- **پارامترها**:
  - **phone** (الزامی): شماره موبایل (مثال: `09123456789`)

**درخواست نمونه**:

```json
{
  "phone": "09123456789"
}
```

**پاسخ موفق (200)**:

```json
{
  "success": true,
  "message": "کد تأیید ارسال شد",
  "data": {
    "expiresIn": 120 // مدت اعتبار کد به ثانیه
  }
}
```

**پاسخ در محیط توسعه (200)**:

```json
{
  "success": true,
  "message": "کد تأیید ارسال شد",
  "data": {
    "expiresIn": 120,
    "code": "1234" // کد تأیید فقط در محیط توسعه نمایش داده می‌شود
  }
}
```

**پاسخ خطا (400)**:

```json
{
  "success": false,
  "message": "شماره موبایل نامعتبر است",
  "error": "INVALID_PHONE"
}
```

#### تأیید کد

تأیید کد ارسال شده به کاربر و دریافت توکن.

- **URL**: `/auth/verify-code`
- **روش**: `POST`
- **احراز هویت مورد نیاز**: خیر
- **پارامترها**:
  - **phone** (الزامی): شماره موبایل (مثال: `09123456789`)
  - **code** (الزامی): کد تأیید دریافت شده (مثال: `1234`)

**درخواست نمونه**:

```json
{
  "phone": "09123456789",
  "code": "1234"
}
```

**پاسخ موفق (200)**:

```json
{
  "success": true,
  "message": "ورود با موفقیت انجام شد",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "phone": "09123456789",
      "email": "user@example.com",
      "fullName": "کاربر نمونه",
      "role": "USER",
      "isActive": true,
      "lastLogin": "2023-06-15T10:30:00Z"
    }
  }
}
```

**پاسخ خطا (400)**:

```json
{
  "success": false,
  "message": "کد تأیید نامعتبر است",
  "error": "INVALID_CODE"
}
```

#### ورود با نام کاربری و رمز عبور

ورود با نام کاربری و رمز عبور و دریافت توکن.

- **URL**: `/auth/login`
- **روش**: `POST`
- **احراز هویت مورد نیاز**: خیر
- **پارامترها**:
  - **username** (الزامی): نام کاربری یا ایمیل
  - **password** (الزامی): رمز عبور

**درخواست نمونه**:

```json
{
  "username": "user@example.com",
  "password": "Password123"
}
```

**پاسخ موفق (200)**:

```json
{
  "success": true,
  "message": "ورود با موفقیت انجام شد",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "phone": "09123456789",
      "email": "user@example.com",
      "fullName": "کاربر نمونه",
      "role": "USER",
      "isActive": true,
      "lastLogin": "2023-06-15T10:30:00Z"
    }
  }
}
```

**پاسخ خطا (401)**:

```json
{
  "success": false,
  "message": "نام کاربری یا رمز عبور اشتباه است",
  "error": "INVALID_CREDENTIALS"
}
```

### مدیریت کاربران

#### دریافت اطلاعات کاربر فعلی

دریافت اطلاعات کاربر فعلی بر اساس توکن.

- **URL**: `/users/me`
- **روش**: `GET`
- **احراز هویت مورد نیاز**: بله

**پاسخ موفق (200)**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone": "09123456789",
    "email": "user@example.com",
    "fullName": "کاربر نمونه",
    "role": "USER",
    "isActive": true,
    "lastLogin": "2023-06-15T10:30:00Z"
  }
}
```

**پاسخ خطا (401)**:

```json
{
  "success": false,
  "message": "توکن نامعتبر است",
  "error": "INVALID_TOKEN"
}
```

#### بروزرسانی اطلاعات کاربر

بروزرسانی اطلاعات کاربر فعلی.

- **URL**: `/users/me`
- **روش**: `PUT`
- **احراز هویت مورد نیاز**: بله
- **پارامترها**:
  - **fullName** (اختیاری): نام کامل جدید
  - **email** (اختیاری): ایمیل جدید
  - **password** (اختیاری): رمز عبور جدید

**درخواست نمونه**:

```json
{
  "fullName": "کاربر بروز شده",
  "email": "new-email@example.com"
}
```

**پاسخ موفق (200)**:

```json
{
  "success": true,
  "message": "اطلاعات کاربر با موفقیت بروزرسانی شد",
  "data": {
    "id": 1,
    "phone": "09123456789",
    "email": "new-email@example.com",
    "fullName": "کاربر بروز شده",
    "role": "USER",
    "isActive": true,
    "lastLogin": "2023-06-15T10:30:00Z"
  }
}
```

**پاسخ خطا (400)**:

```json
{
  "success": false,
  "message": "ایمیل نامعتبر است",
  "error": "INVALID_EMAIL"
}
```

#### دریافت کاربر با ایمیل

دریافت اطلاعات کاربر بر اساس ایمیل.

- **URL**: `/users/email/:email`
- **روش**: `GET`
- **احراز هویت مورد نیاز**: بله
- **پارامترهای مسیر**:
  - **email** (الزامی): ایمیل کاربر

**پاسخ موفق (200)**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user1",
    "email": "user@example.com",
    "fullName": "کاربر نمونه",
    "role": "USER",
    "isActive": true
  }
}
```

**پاسخ خطا (404)**:

```json
{
  "success": false,
  "message": "کاربر یافت نشد",
  "error": "USER_NOT_FOUND"
}
```

### مدیریت لاگ‌ها

#### دریافت لیست لاگ‌ها

دریافت لیست لاگ‌ها با قابلیت فیلتر کردن.

- **URL**: `/logs`
- **روش**: `GET`
- **احراز هویت مورد نیاز**: بله (با نقش `ADMIN`)
- **پارامترهای کوئری**:
  - **level** (اختیاری): سطح لاگ (INFO, WARN, ERROR, DEBUG)
  - **service** (اختیاری): نام سرویس (MAIN, LOGGER, CLIENT)
  - **startDate** (اختیاری): تاریخ شروع (ISO string)
  - **endDate** (اختیاری): تاریخ پایان (ISO string)
  - **page** (اختیاری): شماره صفحه (پیش‌فرض: 1)
  - **pageSize** (اختیاری): تعداد آیتم در هر صفحه (پیش‌فرض: 20)

**پاسخ موفق (200)**:

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "level": "INFO",
        "message": "کاربر وارد سیستم شد",
        "meta": {
          "userId": 1,
          "ip": "192.168.1.1"
        },
        "service": "MAIN",
        "timestamp": "2023-06-15T10:30:00Z"
      },
      {
        "id": 2,
        "level": "ERROR",
        "message": "خطا در ارسال پیامک",
        "meta": {
          "phone": "09123456789",
          "error": "Connection timeout"
        },
        "service": "MAIN",
        "timestamp": "2023-06-15T10:35:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5
    }
  }
}
```

**پاسخ خطا (403)**:

```json
{
  "success": false,
  "message": "دسترسی ممنوع است",
  "error": "ACCESS_DENIED"
}
```

#### ثبت لاگ جدید

ثبت یک لاگ جدید در سیستم.

- **URL**: `/logs`
- **روش**: `POST`
- **احراز هویت مورد نیاز**: بله
- **پارامترها**:
  - **level** (الزامی): سطح لاگ (INFO, WARN, ERROR, DEBUG)
  - **message** (الزامی): پیام لاگ
  - **meta** (اختیاری): اطلاعات اضافی
  - **service** (الزامی): نام سرویس (MAIN, LOGGER, CLIENT)

**درخواست نمونه**:

```json
{
  "level": "INFO",
  "message": "درخواست ارسال پیامک",
  "meta": {
    "phone": "09123456789",
    "template": "verification"
  },
  "service": "CLIENT"
}
```

**پاسخ موفق (201)**:

```json
{
  "success": true,
  "message": "لاگ با موفقیت ثبت شد",
  "data": {
    "id": 3,
    "level": "INFO",
    "message": "درخواست ارسال پیامک",
    "meta": {
      "phone": "09123456789",
      "template": "verification"
    },
    "service": "CLIENT",
    "timestamp": "2023-06-15T11:00:00Z"
  }
}
```

**پاسخ خطا (400)**:

```json
{
  "success": false,
  "message": "سطح لاگ نامعتبر است",
  "error": "INVALID_LOG_LEVEL"
}
```

## کدهای خطا

| کد خطا                | توضیحات                                    |
|-----------------------|---------------------------------------------|
| INVALID_PHONE         | شماره موبایل نامعتبر است                    |
| INVALID_CODE          | کد تأیید نامعتبر است                        |
| CODE_EXPIRED          | کد تأیید منقضی شده است                      |
| MAX_ATTEMPTS_EXCEEDED | تعداد تلاش‌های ناموفق بیش از حد مجاز است     |
| INVALID_CREDENTIALS   | نام کاربری یا رمز عبور اشتباه است           |
| INVALID_TOKEN         | توکن نامعتبر است                            |
| TOKEN_EXPIRED         | توکن منقضی شده است                          |
| USER_NOT_FOUND        | کاربر یافت نشد                              |
| INVALID_EMAIL         | ایمیل نامعتبر است                           |
| ACCESS_DENIED         | دسترسی ممنوع است                            |
| INVALID_LOG_LEVEL     | سطح لاگ نامعتبر است                         |

## نحوه استفاده از API در کلاینت

برای استفاده از API در کلاینت، می‌توانید از کتابخانه‌هایی مانند `axios` یا `fetch` استفاده کنید.

### نمونه استفاده با Axios

```typescript
import axios from 'axios';

// تنظیم URL پایه
const api = axios.create({
  baseURL: 'http://localhost:3010',
  headers: {
    'Content-Type': 'application/json',
  },
});

// تنظیم توکن احراز هویت
const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ارسال کد تأیید
const sendVerificationCode = async (phone: string) => {
  try {
    const response = await api.post('/auth/send-code', { phone });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// تأیید کد
const verifyCode = async (phone: string, code: string) => {
  try {
    const response = await api.post('/auth/verify-code', { phone, code });
    // ذخیره توکن در localStorage
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      setAuthToken(response.data.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// دریافت اطلاعات کاربر فعلی
const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// بررسی وجود توکن در localStorage و تنظیم آن برای درخواست‌های بعدی
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

export { sendVerificationCode, verifyCode, getCurrentUser };
```

## نکات مهم

1. **امنیت**:
   - از HTTPS برای انتقال داده‌ها در محیط تولید استفاده کنید
   - توکن‌ها را در localStorage ذخیره نکنید (به دلیل آسیب‌پذیری به حملات XSS)
   - از HttpOnly Cookie برای ذخیره توکن استفاده کنید

2. **خطاها**:
   - همیشه خطاها را در کلاینت مدیریت کنید
   - اطلاعات حساس را در پیام‌های خطا نمایش ندهید

3. **محدودیت نرخ درخواست**:
   - سیستم دارای محدودیت نرخ درخواست است (حداکثر 100 درخواست در دقیقه)
   - در صورت فراتر رفتن از محدودیت، خطای 429 (Too Many Requests) دریافت خواهید کرد

## منابع تکمیلی

- [راهنمای نصب و راه‌اندازی](../deployment/local-setup.md)
- [مستندات معماری](../architecture/system-architecture.md)
- [نقشه راه توسعه](../roadmap/development-roadmap.md)

</div> 