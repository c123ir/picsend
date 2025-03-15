import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../database/connection';
import { loggingClient } from '../utils/logging-client';
import User from './User';
import Image from './Image';
import Group from './Group';

// تعریف اینترفیس برای مدل اشتراک تصویر
interface IImageShare {
  id: number;
  imageId: number;
  sharedWithUserId?: number | null;
  sharedWithGroupId?: number | null;
  accessLevel: 'view' | 'edit' | 'admin';
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// تعریف اتریبیوت‌های اختیاری برای ایجاد اشتراک تصویر
type ImageShareCreationAttributes = Optional<IImageShare, 'id' | 'createdAt' | 'updatedAt'>;

class ImageShare extends Model<IImageShare, ImageShareCreationAttributes> implements IImageShare {
  public id!: number;
  public imageId!: number;
  public sharedWithUserId!: number | null;
  public sharedWithGroupId!: number | null;
  public accessLevel!: 'view' | 'edit' | 'admin';
  public expiresAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

ImageShare.init(
  {
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
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sharedWithUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sharedWithGroupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'UserGroups',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    accessLevel: {
      type: DataTypes.ENUM('view', 'edit', 'admin'),
      allowNull: false,
      defaultValue: 'view',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'ImageShares',
    hooks: {
      beforeCreate: async (share) => {
        loggingClient.info({
          message: 'در حال ایجاد اشتراک تصویر جدید',
          data: {
            imageId: share.imageId,
            sharedWithUserId: share.sharedWithUserId,
            sharedWithGroupId: share.sharedWithGroupId,
            accessLevel: share.accessLevel,
          },
          action: 'create_image_share',
        });
      },
      afterCreate: async (share) => {
        loggingClient.info({
          message: 'اشتراک تصویر با موفقیت ایجاد شد',
          data: {
            id: share.id,
            imageId: share.imageId,
            sharedWithUserId: share.sharedWithUserId,
            sharedWithGroupId: share.sharedWithGroupId,
          },
          action: 'image_share_created',
        });
      },
      beforeDestroy: async (share) => {
        loggingClient.info({
          message: 'در حال حذف اشتراک تصویر',
          data: {
            id: share.id,
            imageId: share.imageId,
          },
          action: 'delete_image_share',
        });
      },
      afterDestroy: async (share) => {
        loggingClient.info({
          message: 'اشتراک تصویر با موفقیت حذف شد',
          data: {
            id: share.id,
            imageId: share.imageId,
          },
          action: 'image_share_deleted',
        });
      },
    },
  }
);

// ارتباط با کاربر و تصویر و گروه
ImageShare.belongsTo(User, { foreignKey: 'sharedWithUserId', as: 'recipient' });
ImageShare.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });
ImageShare.belongsTo(Group, { foreignKey: 'sharedWithGroupId', as: 'group' });

export default ImageShare; 