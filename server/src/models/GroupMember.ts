import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { loggingClient } from '../utils/logging-client';
import User from './User';
import Group from './Group';

// تعریف اینترفیس برای ویژگی‌های عضو گروه
export interface IGroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: 'member' | 'admin';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// تعریف ویژگی‌های اختیاری برای ایجاد عضو گروه
export type GroupMemberCreationAttributes = Optional<IGroupMember, 'id' | 'role' | 'joinedAt' | 'createdAt' | 'updatedAt'>;

// تعریف کلاس مدل عضو گروه
class GroupMember extends Model<IGroupMember, GroupMemberCreationAttributes> implements IGroupMember {
  public id!: number;
  public groupId!: number;
  public userId!: number;
  public role!: 'member' | 'admin';
  public joinedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// تعریف مدل عضو گروه
GroupMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'UserGroups',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('member', 'admin'),
      allowNull: false,
      defaultValue: 'member',
    },
    joinedAt: {
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
    tableName: 'GroupMembers',
    modelName: 'GroupMember',
    timestamps: true,
    hooks: {
      // هوک قبل از ایجاد
      beforeCreate: (member) => {
        loggingClient.info('افزودن عضو جدید به گروه', {
          groupId: member.groupId,
          userId: member.userId,
          role: member.role,
          action: 'group_member_before_create'
        });
      },
      // هوک بعد از ایجاد
      afterCreate: (member) => {
        loggingClient.info('عضو جدید به گروه اضافه شد', {
          memberId: member.id,
          groupId: member.groupId,
          userId: member.userId,
          role: member.role,
          action: 'group_member_after_create'
        });
      },
      // هوک قبل از به‌روزرسانی
      beforeUpdate: (member) => {
        loggingClient.info('به‌روزرسانی عضو گروه', {
          memberId: member.id,
          groupId: member.groupId,
          userId: member.userId,
          action: 'group_member_before_update'
        });
      },
      // هوک بعد از به‌روزرسانی
      afterUpdate: (member) => {
        loggingClient.info('عضو گروه به‌روزرسانی شد', {
          memberId: member.id,
          groupId: member.groupId,
          userId: member.userId,
          role: member.role,
          action: 'group_member_after_update'
        });
      },
      // هوک قبل از حذف
      beforeDestroy: (member) => {
        loggingClient.info('حذف عضو از گروه', {
          memberId: member.id,
          groupId: member.groupId,
          userId: member.userId,
          action: 'group_member_before_destroy'
        });
      },
      // هوک بعد از حذف
      afterDestroy: (member) => {
        loggingClient.info('عضو از گروه حذف شد', {
          memberId: member.id,
          action: 'group_member_after_destroy'
        });
      },
    },
  }
);

// ارتباط با کاربر و گروه
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

export default GroupMember; 