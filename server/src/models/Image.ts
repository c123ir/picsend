import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { loggingClient } from '../utils/logging-client';
import User from './User';

// تعریف اینترفیس برای ویژگی‌های تصویر
export interface IImage {
  id: number;
  userId: number;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  path: string;
  isPublic: boolean;
  description: string | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// تعریف ویژگی‌های اختیاری برای ایجاد تصویر
export type ImageCreationAttributes = Optional<IImage, 'id' | 'isPublic' | 'description' | 'uploadedAt' | 'createdAt' | 'updatedAt'>;

// تعریف کلاس مدل تصویر
class Image extends Model<IImage, ImageCreationAttributes> implements IImage {
  public id!: number;
  public userId!: number;
  public filename!: string;
  public originalFilename!: string;
  public fileSize!: number;
  public mimeType!: string;
  public path!: string;
  public isPublic!: boolean;
  public description!: string | null;
  public uploadedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// تعریف مدل تصویر
Image.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploadedAt: {
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
    tableName: 'Images',
    modelName: 'Image',
    timestamps: true,
    hooks: {
      // هوک قبل از ایجاد
      beforeCreate: (image) => {
        loggingClient.info('آپلود تصویر جدید', {
          userId: image.userId,
          filename: image.filename,
          fileSize: image.fileSize,
          mimeType: image.mimeType,
          action: 'image_before_create'
        });
      },
      // هوک بعد از ایجاد
      afterCreate: (image) => {
        loggingClient.info('تصویر جدید آپلود شد', {
          imageId: image.id,
          userId: image.userId,
          filename: image.filename,
          fileSize: image.fileSize,
          action: 'image_after_create'
        });
      },
      // هوک قبل از به‌روزرسانی
      beforeUpdate: (image) => {
        loggingClient.info('به‌روزرسانی تصویر', {
          imageId: image.id,
          userId: image.userId,
          action: 'image_before_update'
        });
      },
      // هوک بعد از به‌روزرسانی
      afterUpdate: (image) => {
        loggingClient.info('تصویر به‌روزرسانی شد', {
          imageId: image.id,
          userId: image.userId,
          action: 'image_after_update'
        });
      },
      // هوک قبل از حذف
      beforeDestroy: (image) => {
        loggingClient.info('حذف تصویر', {
          imageId: image.id,
          userId: image.userId,
          filename: image.filename,
          action: 'image_before_destroy'
        });
      },
      // هوک بعد از حذف
      afterDestroy: (image) => {
        loggingClient.info('تصویر حذف شد', {
          imageId: image.id,
          action: 'image_after_destroy'
        });
      },
    },
  }
);

// ارتباط با کاربر مالک تصویر
Image.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

export default Image; 