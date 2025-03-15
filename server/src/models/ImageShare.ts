import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { loggingClient } from '../utils/logging-client';
import User from './User';
import Image from './Image';
import Group from './Group';

interface IImageShare {
  id?: number;
  imageId: number;
  sharedBy: number;
  sharedWith?: number;
  sharedWithGroup?: number;
  accessLevel: 'view' | 'edit' | 'admin';
  shareLink?: string;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class ImageShare extends Model<IImageShare> implements IImageShare {
  public id!: number;
  public imageId!: number;
  public sharedBy!: number;
  public sharedWith!: number;
  public sharedWithGroup!: number;
  public accessLevel!: 'view' | 'edit' | 'admin';
  public shareLink!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ImageShare.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  imageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Images',
      key: 'id'
    }
  },
  sharedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sharedWith: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sharedWithGroup: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Groups',
      key: 'id'
    }
  },
  accessLevel: {
    type: DataTypes.ENUM('view', 'edit', 'admin'),
    defaultValue: 'view',
    allowNull: false,
  },
  shareLink: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'ImageShare',
  tableName: 'ImageShares',
  timestamps: true,
  hooks: {
    beforeCreate: async (share: ImageShare) => {
      loggingClient.info('آماده‌سازی اشتراک‌گذاری تصویر', {
        imageId: share.imageId,
        sharedBy: share.sharedBy,
        sharedWith: share.sharedWith,
        sharedWithGroup: share.sharedWithGroup,
        accessLevel: share.accessLevel,
        action: 'image_share_prepare'
      });
    },
    afterCreate: async (share: ImageShare) => {
      loggingClient.info('تصویر به اشتراک گذاشته شد', {
        shareId: share.id,
        imageId: share.imageId,
        sharedBy: share.sharedBy,
        sharedWith: share.sharedWith,
        sharedWithGroup: share.sharedWithGroup,
        accessLevel: share.accessLevel,
        action: 'image_shared'
      });
    },
    beforeUpdate: async (share: ImageShare) => {
      loggingClient.info('آماده‌سازی به‌روزرسانی اشتراک تصویر', {
        shareId: share.id,
        changedFields: share.changed(),
        action: 'image_share_update_prepare'
      });
    },
    afterUpdate: async (share: ImageShare) => {
      loggingClient.info('اشتراک تصویر به‌روزرسانی شد', {
        shareId: share.id,
        action: 'image_share_updated'
      });
    },
    beforeDestroy: async (share: ImageShare) => {
      loggingClient.warn('آماده‌سازی برای لغو اشتراک تصویر', {
        shareId: share.id,
        imageId: share.imageId,
        sharedBy: share.sharedBy,
        sharedWith: share.sharedWith,
        sharedWithGroup: share.sharedWithGroup,
        action: 'image_share_remove_prepare'
      });
    },
    afterDestroy: async (share: ImageShare) => {
      loggingClient.warn('اشتراک تصویر لغو شد', {
        shareId: share.id,
        imageId: share.imageId,
        action: 'image_share_removed'
      });
    }
  }
});

// ارتباط با کاربر و تصویر و گروه
ImageShare.belongsTo(User, { foreignKey: 'sharedBy', as: 'owner' });
ImageShare.belongsTo(User, { foreignKey: 'sharedWith', as: 'recipient' });
ImageShare.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });
ImageShare.belongsTo(Group, { foreignKey: 'sharedWithGroup', as: 'group' });

export default ImageShare; 