import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { loggingClient } from '../utils/logging-client';
import User from './User';

interface IGroup {
  id?: number;
  name: string;
  description?: string;
  ownerId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class Group extends Model<IGroup> implements IGroup {
  public id!: number;
  public name!: string;
  public description!: string;
  public ownerId!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Group.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'Group',
  tableName: 'Groups',
  timestamps: true,
  hooks: {
    beforeCreate: async (group: Group) => {
      loggingClient.info('آماده‌سازی ایجاد گروه جدید', {
        groupName: group.name,
        ownerId: group.ownerId,
        action: 'group_create_prepare'
      });
    },
    afterCreate: async (group: Group) => {
      loggingClient.info('گروه جدید ایجاد شد', {
        groupId: group.id,
        groupName: group.name,
        ownerId: group.ownerId,
        action: 'group_created'
      });
    },
    beforeUpdate: async (group: Group) => {
      loggingClient.info('آماده‌سازی به‌روزرسانی گروه', {
        groupId: group.id,
        changedFields: group.changed(),
        action: 'group_update_prepare'
      });
    },
    afterUpdate: async (group: Group) => {
      loggingClient.info('اطلاعات گروه به‌روزرسانی شد', {
        groupId: group.id,
        action: 'group_updated'
      });
    },
    beforeDestroy: async (group: Group) => {
      loggingClient.warn('آماده‌سازی برای حذف گروه', {
        groupId: group.id,
        groupName: group.name,
        action: 'group_delete_prepare'
      });
    },
    afterDestroy: async (group: Group) => {
      loggingClient.warn('گروه حذف شد', {
        groupId: group.id,
        groupName: group.name,
        action: 'group_deleted'
      });
    }
  }
});

// ارتباط با کاربر مالک گروه
Group.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

export default Group; 