import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../database/connection';
import { loggingClient } from '../utils/logging-client';
import User from './User';

// تعریف اینترفیس برای مدل گروه
interface IGroup {
  id: number;
  name: string;
  description: string | null;
  creatorId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// تعریف اتریبیوت‌های اختیاری برای ایجاد گروه
type GroupCreationAttributes = Optional<IGroup, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>;

class Group extends Model<IGroup, GroupCreationAttributes> implements IGroup {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public creatorId!: number;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Group.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'UserGroups',
    hooks: {
      beforeCreate: async (group) => {
        loggingClient.info({
          message: 'در حال ایجاد گروه جدید',
          data: {
            name: group.name,
            creatorId: group.creatorId,
          },
          action: 'create_group',
        });
      },
      afterCreate: async (group) => {
        loggingClient.info({
          message: 'گروه با موفقیت ایجاد شد',
          data: {
            id: group.id,
            name: group.name,
            creatorId: group.creatorId,
          },
          action: 'group_created',
        });
      },
      beforeUpdate: async (group) => {
        loggingClient.info({
          message: 'در حال به‌روزرسانی گروه',
          data: {
            id: group.id,
            name: group.name,
          },
          action: 'update_group',
        });
      },
      afterUpdate: async (group) => {
        loggingClient.info({
          message: 'گروه با موفقیت به‌روزرسانی شد',
          data: {
            id: group.id,
            name: group.name,
          },
          action: 'group_updated',
        });
      },
      beforeDestroy: async (group) => {
        loggingClient.info({
          message: 'در حال حذف گروه',
          data: {
            id: group.id,
            name: group.name,
          },
          action: 'delete_group',
        });
      },
      afterDestroy: async (group) => {
        loggingClient.info({
          message: 'گروه با موفقیت حذف شد',
          data: {
            id: group.id,
          },
          action: 'group_deleted',
        });
      },
    },
  }
);

// ارتباط با کاربر مالک گروه
Group.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

export default Group; 