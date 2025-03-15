# راهنمای سرویس لاگینگ PicSend

<div dir="rtl">

## معرفی

سیستم لاگینگ PicSend یک سرویس مستقل و قدرتمند برای ثبت، ذخیره‌سازی و مدیریت لاگ‌ها است که امکان پایش و عیب‌یابی برنامه را فراهم می‌کند. این سیستم از یک معماری میکروسرویس مستقل تشکیل شده که از طریق API با سایر بخش‌های برنامه ارتباط برقرار می‌کند.

## مزایا

- **جداسازی کامل**: سرویس لاگینگ به صورت کاملاً مستقل از برنامه اصلی عمل می‌کند
- **قابلیت مقیاس‌پذیری**: امکان مقیاس‌پذیری مستقل از سایر بخش‌های برنامه
- **مشاهده زنده**: امکان مشاهده لاگ‌ها به صورت زنده از طریق داشبورد وب
- **ذخیره‌سازی دوگانه**: ذخیره لاگ‌ها در دیتابیس و فایل برای امنیت بیشتر
- **کارکرد آفلاین**: ثبت لاگ‌ها حتی در زمان قطع اتصال با سرویس لاگینگ
- **فیلترینگ پیشرفته**: امکان جستجو و فیلتر لاگ‌ها بر اساس معیارهای مختلف

## معماری سیستم لاگینگ

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│               │       │               │       │               │
│  کلاینت       │       │  سرور اصلی    │       │  دیتابیس      │
│  (React)      │       │  (Node.js)    │       │  (MySQL)      │
│               │       │               │       │               │
└───────┬───────┘       └───────┬───────┘       └───────────────┘
        │                       │
        v                       v
┌───────────────────────────────────────────────┐
│                                               │
│           کلاینت‌های لاگینگ                   │
│                                               │
└───────────────────┬───────────────────────────┘
                    │
                    v
            ┌───────────────┐       ┌───────────────┐
            │               │       │               │
            │  سرور لاگینگ  │───────▶│  دیتابیس لاگ  │
            │  (Node.js)    │       │  (MySQL)      │
            │               │       │               │
            └───────┬───────┘       └───────────────┘
                    │
                    v
            ┌───────────────┐
            │               │
            │  فایل‌های لاگ  │
            │               │
            └───────────────┘
```

## سطوح لاگینگ

سیستم لاگینگ PicSend از چهار سطح مختلف لاگینگ پشتیبانی می‌کند:

1. **Debug**: اطلاعات جزئی برای توسعه‌دهندگان (فقط در محیط توسعه)
2. **Info**: اطلاعات عمومی درباره عملکرد عادی برنامه
3. **Warning**: هشدارها و مشکلات بالقوه که نیاز به توجه دارند
4. **Error**: خطاها و مشکلات جدی که نیاز به بررسی فوری دارند

## نحوه استفاده از کلاینت لاگینگ

### در سمت فرانت‌اند (React)

کلاینت لاگینگ در فایل `src/utils/loggingClient.ts` قرار دارد و می‌توان به راحتی از آن در کامپوننت‌های React استفاده کرد:

```typescript
import { loggingClient } from '../utils/loggingClient';

// نمونه استفاده در یک کامپوننت
function LoginComponent() {
  const handleLogin = async (username, password) => {
    try {
      loggingClient.info('تلاش برای ورود کاربر', { username });
      
      const startTime = performance.now();
      const response = await loginApi(username, password);
      
      if (response.success) {
        loggingClient.info('ورود کاربر موفقیت‌آمیز', { 
          userId: response.user.id,
          username
        });
      } else {
        loggingClient.warn('ورود ناموفق', { 
          username,
          reason: response.error
        });
      }
      
      // ثبت زمان عملکرد
      loggingClient.logPerformance('login_attempt', performance.now() - startTime);
    } catch (error) {
      loggingClient.error('خطا در فرآیند ورود', {
        username,
        error: error.message,
        stack: error.stack
      });
    }
  };
  
  // بقیه کد...
}
```

#### عملکرد آفلاین

کلاینت فرانت‌اند به گونه‌ای طراحی شده که در زمان قطع اتصال با سرور لاگینگ، لاگ‌ها را در `localStorage` ذخیره می‌کند و پس از برقراری مجدد اتصال، آن‌ها را به سرور ارسال می‌کند.

### در سمت بک‌اند (Node.js)

در سمت سرور، از کلاینت لاگینگ موجود در `server/src/utils/logging-client.js` استفاده می‌شود:

```typescript
import { loggingClient } from '../utils/logging-client';

// مثال استفاده در یک کنترلر
export const getUserData = async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.params.id;
    
    loggingClient.info('درخواست دریافت اطلاعات کاربر', { 
      userId,
      ip: req.ip,
      action: 'get_user_data'
    });
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      loggingClient.warn('کاربر یافت نشد', { 
        userId,
        ip: req.ip,
        action: 'user_not_found'
      });
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    loggingClient.info('اطلاعات کاربر با موفقیت دریافت شد', { 
      userId,
      ip: req.ip,
      action: 'get_user_success'
    });
    
    loggingClient.logPerformance('get_user_data', Date.now() - startTime);
    return res.json(user);
  } catch (error) {
    loggingClient.error('خطا در دریافت اطلاعات کاربر', {
      userId: req.params.id,
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      action: 'get_user_error'
    });
    
    loggingClient.logPerformance('get_user_error', Date.now() - startTime);
    return res.status(500).json({ message: 'خطای سرور' });
  }
};
```

#### عملکرد آفلاین در سرور

در سمت سرور، کلاینت لاگینگ لاگ‌ها را در فایل‌های محلی ذخیره می‌کند و به صورت دوره‌ای سعی می‌کند آن‌ها را به سرور لاگینگ ارسال کند.

## موارد استفاده پیشنهادی

### لاگینگ عملیات‌های کاربران

```typescript
// ثبت فعالیت‌های کاربر
loggingClient.info('کاربر فایل آپلود کرد', {
  userId: user.id,
  fileId: file.id,
  fileSize: file.size,
  fileType: file.type,
  action: 'user_upload_file'
});
```

### لاگینگ خطاها

```typescript
try {
  // کد با احتمال خطا
} catch (error) {
  loggingClient.error('خطا در پردازش درخواست', {
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
    data: req.body,
    action: 'process_request_error'
  });
}
```

### لاگینگ عملکرد

```typescript
const startTime = Date.now(); // یا performance.now() در سمت کلاینت

// کد مورد اندازه‌گیری

const duration = Date.now() - startTime;
loggingClient.logPerformance('database_query', duration, {
  queryType: 'select',
  tableName: 'users',
  recordCount: results.length
});
```

### لاگینگ عملیات‌های دیتابیس

```typescript
// استفاده در هوک‌های Sequelize
Model.afterCreate(async (instance, options) => {
  loggingClient.info('رکورد جدید ایجاد شد', {
    model: Model.name,
    id: instance.id,
    action: 'db_record_created'
  });
});
```

## میدل‌ور لاگینگ در اکسپرس

برای لاگ کردن خودکار تمام درخواست‌ها و پاسخ‌ها، از میدل‌ور لاگینگ استفاده کنید:

```typescript
// server/src/index.ts
import loggerMiddleware from './middleware/logger';

// اضافه کردن میدل‌ور قبل از مسیرها
app.use(loggerMiddleware);
```

## مشاهده لاگ‌ها

لاگ‌ها را می‌توان از طریق داشبورد وب در آدرس زیر مشاهده کرد:

```
http://localhost:3015
```

در این داشبورد می‌توانید:
- لاگ‌ها را بر اساس سطح فیلتر کنید
- جستجو در متن لاگ‌ها انجام دهید
- لاگ‌ها را بر اساس سرویس فیلتر کنید
- نتایج را بر اساس بازه زمانی محدود کنید

## نکات و بهترین روش‌ها

1. **استفاده از Action**: همیشه یک فیلد `action` به متادیتا اضافه کنید تا بتوانید به راحتی لاگ‌های مرتبط را فیلتر کنید.

2. **ساختار متادیتا**: از ساختار یکسان برای متادیتا استفاده کنید.

3. **اجتناب از داده‌های حساس**: هرگز اطلاعات حساس مانند رمز عبور یا توکن‌ها را در لاگ‌ها ذخیره نکنید.

4. **لاگینگ خطاها**: همیشه پیام خطا (`error.message`) و استک تریس (`error.stack`) را در لاگ‌های خطا ذخیره کنید.

5. **اندازه‌گیری عملکرد**: از `logPerformance` برای اندازه‌گیری زمان اجرای عملیات‌های مهم استفاده کنید.

6. **استفاده از سطح مناسب**: از سطح لاگینگ مناسب استفاده کنید:
   - `debug`: برای اطلاعات جزئی توسعه
   - `info`: برای رویدادهای عادی
   - `warn`: برای مشکلات بالقوه
   - `error`: برای خطاهای واقعی

## نمونه‌های کد بیشتر

### لاگینگ در میدل‌ور احراز هویت

```typescript
export const auth = async (req, res, next) => {
  const startTime = Date.now();
  try {
    // ...کد احراز هویت...
    
    loggingClient.info('احراز هویت موفق', {
      userId: user.id,
      ip: req.ip,
      path: req.originalUrl,
      action: 'auth_success'
    });
    
    loggingClient.logPerformance('auth_middleware', Date.now() - startTime);
    next();
  } catch (error) {
    loggingClient.error('خطا در احراز هویت', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.originalUrl,
      action: 'auth_error'
    });
    
    loggingClient.logPerformance('auth_error', Date.now() - startTime);
    res.status(401).json({ message: 'خطا در احراز هویت' });
  }
};
```

### لاگینگ در مدل‌های Sequelize

```typescript
User.init({
  // ...تعریف فیلدها...
}, {
  sequelize,
  modelName: 'User',
  hooks: {
    beforeCreate: async (user) => {
      loggingClient.info('در حال ایجاد کاربر جدید', {
        email: user.email,
        action: 'user_before_create'
      });
    },
    afterCreate: async (user) => {
      loggingClient.info('کاربر جدید ایجاد شد', {
        userId: user.id,
        email: user.email,
        action: 'user_created'
      });
    },
    // ...سایر هوک‌ها...
  }
});
```

## پیکربندی سیستم لاگینگ

### متغیرهای محیطی کلاینت

```
# آدرس سرور لاگینگ
LOGGING_SERVER_URL=http://localhost:3015

# سطح لاگینگ (debug, info, warn, error)
LOG_LEVEL=info

# فعال کردن لاگ‌های دیباگ
ENABLE_DEBUG_LOGS=true
```

### متغیرهای محیطی سرور لاگینگ

```
# پورت سرور لاگینگ
PORT=3015

# تنظیمات دیتابیس
DB_HOST=localhost
DB_PORT=3306
DB_NAME=logger_db
DB_USER=root
DB_PASSWORD=

# مسیر ذخیره فایل‌های لاگ
LOG_FILES_PATH=./logs
```

## نتیجه‌گیری

سیستم لاگینگ PicSend یک راه‌حل جامع برای ثبت، مدیریت و تحلیل لاگ‌ها در تمام بخش‌های پروژه فراهم می‌کند. با استفاده از این سیستم، می‌توانید به سرعت مشکلات را شناسایی و عیب‌یابی کنید، عملکرد برنامه را پایش نمایید و الگوهای استفاده را تحلیل کنید.

برای اطلاعات بیشتر به مستندات کد کلاینت‌های لاگینگ در فایل‌های زیر مراجعه کنید:
- فرانت‌اند: `src/utils/loggingClient.ts`
- بک‌اند: `server/src/utils/logging-client.js`

</div> 