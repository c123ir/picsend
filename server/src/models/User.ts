import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import { loggingClient } from '../utils/logging-client';

interface IUser {
  id?: number;
  phone?: string;
  email?: string;
  password?: string;
  fullName?: string;
  avatar?: string;
  isActive: boolean;
  role?: string;
  lastLoginAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class User extends Model<IUser> implements IUser {
  public id!: number;
  public phone!: string;
  public email!: string;
  public password!: string;
  public fullName!: string;
  public avatar!: string;
  public isActive!: boolean;
  public role!: string;
  public lastLoginAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  modelName: 'User',
  timestamps: true,
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      loggingClient.info('آماده‌سازی ایجاد کاربر جدید', {
        userEmail: user.email,
        userPhone: user.phone,
        action: 'user_create_prepare'
      });
    },
    afterCreate: async (user: User) => {
      loggingClient.info('کاربر جدید ایجاد شد', {
        userId: user.id,
        userEmail: user.email,
        userPhone: user.phone,
        action: 'user_created'
      });
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
        loggingClient.info('رمز عبور کاربر به‌روزرسانی شد', {
          userId: user.id,
          action: 'password_update'
        });
      }
      
      loggingClient.info('آماده‌سازی به‌روزرسانی کاربر', {
        userId: user.id,
        changedFields: user.changed(),
        action: 'user_update_prepare'
      });
    },
    afterUpdate: async (user: User) => {
      loggingClient.info('اطلاعات کاربر به‌روزرسانی شد', {
        userId: user.id,
        action: 'user_updated'
      });
    },
    beforeDestroy: async (user: User) => {
      loggingClient.warn('آماده‌سازی برای حذف کاربر', {
        userId: user.id,
        userEmail: user.email,
        userPhone: user.phone,
        action: 'user_delete_prepare'
      });
    },
    afterDestroy: async (user: User) => {
      loggingClient.warn('کاربر حذف شد', {
        userId: user.id,
        userEmail: user.email,
        userPhone: user.phone,
        action: 'user_deleted'
      });
    }
  }
});

// متد کمکی برای بررسی صحت رمز عبور
User.prototype.isValidPassword = async function(password: string): Promise<boolean> {
  try {
    const start = Date.now();
    const isValid = await bcrypt.compare(password, this.password);
    const duration = Date.now() - start;
    
    loggingClient.debug('اعتبارسنجی رمز عبور', {
      userId: this.id,
      duration: `${duration}ms`,
      isValid,
      action: 'password_validation'
    });
    
    return isValid;
  } catch (error) {
    loggingClient.error('خطا در اعتبارسنجی رمز عبور', {
      userId: this.id,
      error: error instanceof Error ? error.message : String(error),
      action: 'password_validation_error'
    });
    return false;
  }
};

export default User; 

