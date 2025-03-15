import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { loggingClient } from '../utils/logging-client';
import User from './User';
import Group from './Group';

interface IGroupMember {
  id?: number;
  groupId: number;
  userId: number;
  role: 'member' | 'admin';
  joinedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class GroupMember extends Model<IGroupMember> implements IGroupMember {
  public id!: number;
  public groupId!: number;
  public userId!: number;
  public role!: 'member' | 'admin';
  public joinedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GroupMember.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Groups',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('member', 'admin'),
    defaultValue: 'member',
    allowNull: false,
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  modelName: 'GroupMember',
  tableName: 'GroupMembers',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['groupId', 'userId']
    }
  ],
  hooks: {
    beforeCreate: async (member: GroupMember) => {
      loggingClient.info('آماده‌سازی افزودن کاربر به گروه', {
        groupId: member.groupId,
        userId: member.userId,
        role: member.role,
        action: 'group_member_add_prepare'
      });
    },
    afterCreate: async (member: GroupMember) => {
      loggingClient.info('کاربر به گروه اضافه شد', {
        id: member.id,
        groupId: member.groupId,
        userId: member.userId,
        role: member.role,
        action: 'group_member_added'
      });
    },
    beforeUpdate: async (member: GroupMember) => {
      loggingClient.info('آماده‌سازی به‌روزرسانی عضو گروه', {
        id: member.id,
        groupId: member.groupId,
        userId: member.userId,
        changedFields: member.changed(),
        action: 'group_member_update_prepare'
      });
    },
    afterUpdate: async (member: GroupMember) => {
      loggingClient.info('عضو گروه به‌روزرسانی شد', {
        id: member.id,
        groupId: member.groupId,
        userId: member.userId,
        action: 'group_member_updated'
      });
    },
    beforeDestroy: async (member: GroupMember) => {
      loggingClient.warn('آماده‌سازی حذف کاربر از گروه', {
        id: member.id,
        groupId: member.groupId,
        userId: member.userId,
        action: 'group_member_remove_prepare'
      });
    },
    afterDestroy: async (member: GroupMember) => {
      loggingClient.warn('کاربر از گروه حذف شد', {
        id: member.id,
        groupId: member.groupId,
        userId: member.userId,
        action: 'group_member_removed'
      });
    }
  }
});

// ارتباط با کاربر و گروه
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

export default GroupMember; 