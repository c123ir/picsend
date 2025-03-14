# مستندات API

این مستندات شامل توضیحات تمام API‌های مورد استفاده در پروژه PicSend است.

## احراز هویت

### ثبت‌نام
```http
POST /api/auth/register
```

| پارامتر | نوع | توضیحات |
| :--- | :--- | :--- |
| `name` | `string` | **اجباری**. نام کامل کاربر |
| `email` | `string` | **اجباری**. آدرس ایمیل |
| `password` | `string` | **اجباری**. رمز عبور |

### ورود
```http
POST /api/auth/login
```

| پارامتر | نوع | توضیحات |
| :--- | :--- | :--- |
| `email` | `string` | **اجباری**. آدرس ایمیل |
| `password` | `string` | **اجباری**. رمز عبور |

## گروه‌ها

### دریافت لیست گروه‌ها
```http
GET /api/groups
```

### ایجاد گروه جدید
```http
POST /api/groups
```

| پارامتر | نوع | توضیحات |
| :--- | :--- | :--- |
| `name` | `string` | **اجباری**. نام گروه |
| `description` | `string` | توضیحات گروه |
| `members` | `array` | **اجباری**. لیست اعضای گروه |

### دریافت اطلاعات گروه
```http
GET /api/groups/{id}
```

### به‌روزرسانی گروه
```http
PUT /api/groups/{id}
```

### حذف گروه
```http
DELETE /api/groups/{id}
```

## درخواست‌ها

### دریافت لیست درخواست‌ها
```http
GET /api/requests
```

### ایجاد درخواست جدید
```http
POST /api/requests
```

| پارامتر | نوع | توضیحات |
| :--- | :--- | :--- |
| `title` | `string` | **اجباری**. عنوان درخواست |
| `description` | `string` | توضیحات درخواست |
| `files` | `array` | **اجباری**. لیست فایل‌ها |
| `groupId` | `number` | **اجباری**. شناسه گروه |

### دریافت اطلاعات درخواست
```http
GET /api/requests/{id}
```

### به‌روزرسانی وضعیت درخواست
```http
PUT /api/requests/{id}/status
```

| پارامتر | نوع | توضیحات |
| :--- | :--- | :--- |
| `status` | `string` | **اجباری**. وضعیت جدید |
| `comment` | `string` | توضیحات تغییر وضعیت |

## فایل‌ها

### آپلود فایل
```http
POST /api/files/upload
```

| پارامتر | نوع | توضیحات |
| :--- | :--- | :--- |
| `file` | `file` | **اجباری**. فایل مورد نظر |
| `type` | `string` | نوع فایل |
| `description` | `string` | توضیحات فایل |

### دانلود فایل
```http
GET /api/files/{id}/download
```

### حذف فایل
```http
DELETE /api/files/{id}
```

## کدهای وضعیت

| کد | توضیحات |
| :--- | :--- |
| 200 | عملیات با موفقیت انجام شد |
| 201 | منبع با موفقیت ایجاد شد |
| 400 | درخواست نامعتبر |
| 401 | عدم احراز هویت |
| 403 | دسترسی غیرمجاز |
| 404 | منبع یافت نشد |
| 500 | خطای سرور |

## مدل‌های داده

### کاربر
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}
```

### گروه
```typescript
interface Group {
  id: number;
  name: string;
  description?: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
}

interface Member {
  id: number;
  userId: number;
  groupId: number;
  role: string;
  user: User;
}
```

### درخواست
```typescript
interface Request {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reviewing';
  files: File[];
  groupId: number;
  group: Group;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}
```

### فایل
```typescript
interface File {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
  description?: string;
  uploadedBy: User;
  createdAt: string;
  updatedAt: string;
}
``` 