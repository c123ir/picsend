import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import { loggingClient } from '../utils/logging-client';

// تعریف اینترفیس برای ویژگی‌های کاربر
export interface IUser {
  id: number;
  phone: string | null;
  email: string | null;
  password: string;
  fullName: string;
  avatar: string | null;
  isActive: boolean;
  role: 'user' | 'admin';
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// تعریف ویژگی‌های اختیاری برای ایجاد کاربر
export type UserCreationAttributes = Optional<IUser, 'id' | 'phone' | 'avatar' | 'isActive' | 'role' | 'lastLoginAt' | 'createdAt' | 'updatedAt'>;

// تعریف کلاس مدل کاربر
class User extends Model<IUser, UserCreationAttributes> implements IUser {
  public id!: number;
  public phone!: string | null;
  public email!: string | null;
  public password!: string;
  public fullName!: string;
  public avatar!: string | null;
  public isActive!: boolean;
  public role!: 'user' | 'admin';
  public lastLoginAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // متد بررسی صحت رمز عبور
  public async isValidPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

// تعریف مدل کاربر
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      unique: true,
      validate: {
        is: /^[0-9]{10,15}$/,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'Users',
    modelName: 'User',
    timestamps: true,
    hooks: {
      // هوک قبل از ایجاد
      beforeCreate: async (user) => {
        // رمزنگاری رمز عبور
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        
        loggingClient.info('ایجاد کاربر جدید', {
          email: user.email,
          phone: user.phone,
          role: user.role,
          action: 'user_before_create'
        });
      },
      // هوک بعد از ایجاد
      afterCreate: (user) => {
        loggingClient.info('کاربر جدید ایجاد شد', {
          userId: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          action: 'user_after_create'
        });
      },
      // هوک قبل از به‌روزرسانی
      beforeUpdate: async (user) => {
        // رمزنگاری رمز عبور در صورت تغییر
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        
        loggingClient.info('به‌روزرسانی کاربر', {
          userId: user.id,
          action: 'user_before_update'
        });
      },
      // هوک بعد از به‌روزرسانی
      afterUpdate: (user) => {
        loggingClient.info('کاربر به‌روزرسانی شد', {
          userId: user.id,
          action: 'user_after_update'
        });
      },
      // هوک قبل از حذف
      beforeDestroy: (user) => {
        loggingClient.warn('حذف کاربر', {
          userId: user.id,
          email: user.email,
          phone: user.phone,
          action: 'user_before_destroy'
        });
      },
      // هوک بعد از حذف
      afterDestroy: (user) => {
        loggingClient.warn('کاربر حذف شد', {
          userId: user.id,
          action: 'user_after_destroy'
        });
      },
    },
  }
);

export default User; 

