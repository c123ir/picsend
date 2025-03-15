-- ایجاد دیتابیس اگر وجود نداشته باشد
CREATE DATABASE IF NOT EXISTS picsend DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE picsend;

-- جدول کاربران
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  fullName VARCHAR(255),
  avatar VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  role ENUM('user', 'admin') DEFAULT 'user',
  lastLoginAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول گروه‌ها
CREATE TABLE IF NOT EXISTS Groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ownerId INT NOT NULL,
  isPublic BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول عضویت‌های گروه
CREATE TABLE IF NOT EXISTS GroupMembers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  groupId INT NOT NULL,
  userId INT NOT NULL,
  role ENUM('member', 'admin') DEFAULT 'member',
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (groupId) REFERENCES Groups(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_group_member (groupId, userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول تصاویر
CREATE TABLE IF NOT EXISTS Images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  originalFilename VARCHAR(255) NOT NULL,
  fileSize INT NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  path VARCHAR(255) NOT NULL,
  isPublic BOOLEAN DEFAULT FALSE,
  description TEXT,
  uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول اشتراک‌گذاری تصاویر
CREATE TABLE IF NOT EXISTS ImageShares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  imageId INT NOT NULL,
  sharedWithUserId INT,
  sharedWithGroupId INT,
  sharedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME,
  FOREIGN KEY (imageId) REFERENCES Images(id) ON DELETE CASCADE,
  FOREIGN KEY (sharedWithUserId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (sharedWithGroupId) REFERENCES Groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ایجاد کاربر مدیر پیش‌فرض (اگر هیچ کاربری وجود نداشته باشد)
INSERT INTO Users (email, phone, password, fullName, role, isActive) 
SELECT 'admin@picsend.com', '09123456789', '$2a$10$5J5FsZ1QU5hVG7g3fzRQ8.YHy4xJ7zLJMB7A1U1yWj/o0IBwPJXNi', 'مدیر سیستم', 'admin', TRUE
FROM dual 
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE role = 'admin' LIMIT 1);

-- رمز عبور برای کاربر مدیر: Admin@123 