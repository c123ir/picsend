import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { loggingClient } from '../utils/logging-client';
import User from './User';

interface IImage {
  id?: number;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  ownerId: number;
  isPublic: boolean;
  viewCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Image extends Model<IImage> implements IImage {
  public id!: number;
  public title!: string;
  public description!: string;
  public fileName!: string;
  public filePath!: string;
  public fileSize!: number;
  public mimeType!: string;
  public ownerId!: number;
  public isPublic!: boolean;
  public viewCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Image.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  sequelize,
  modelName: 'Image',
  tableName: 'Images',
  timestamps: true,
  hooks: {
    beforeCreate: async (image: Image) => {
      loggingClient.info('آماده‌سازی آپلود تصویر جدید', {
        title: image.title,
        fileName: image.fileName,
        fileSize: image.fileSize,
        ownerId: image.ownerId,
        action: 'image_upload_prepare'
      });
    },
    afterCreate: async (image: Image) => {
      loggingClient.info('تصویر جدید آپلود شد', {
        imageId: image.id,
        title: image.title,
        fileName: image.fileName,
        fileSize: image.fileSize,
        ownerId: image.ownerId,
        action: 'image_uploaded'
      });
    },
    beforeUpdate: async (image: Image) => {
      loggingClient.info('آماده‌سازی به‌روزرسانی اطلاعات تصویر', {
        imageId: image.id,
        changedFields: image.changed(),
        action: 'image_update_prepare'
      });
    },
    afterUpdate: async (image: Image) => {
      loggingClient.info('اطلاعات تصویر به‌روزرسانی شد', {
        imageId: image.id,
        action: 'image_updated'
      });
    },
    beforeDestroy: async (image: Image) => {
      loggingClient.warn('آماده‌سازی برای حذف تصویر', {
        imageId: image.id,
        title: image.title,
        ownerId: image.ownerId,
        action: 'image_delete_prepare'
      });
    },
    afterDestroy: async (image: Image) => {
      loggingClient.warn('تصویر حذف شد', {
        imageId: image.id,
        title: image.title,
        ownerId: image.ownerId,
        action: 'image_deleted'
      });
    }
  }
});

// ارتباط با کاربر مالک تصویر
Image.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

export default Image; 