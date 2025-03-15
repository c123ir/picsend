import User from './User';
import Group from './Group';
import GroupMember from './GroupMember';
import Image from './Image';
import ImageShare from './ImageShare';
import { loggingClient } from '../utils/logging-client';

// ارتباط‌های بین مدل‌ها

// ارتباطات کاربر
User.hasMany(Group, { foreignKey: 'ownerId', as: 'ownedGroups' });
User.hasMany(GroupMember, { foreignKey: 'userId', as: 'groupMemberships' });
User.hasMany(Image, { foreignKey: 'userId', as: 'images' });
User.hasMany(ImageShare, { foreignKey: 'sharedWithUserId', as: 'receivedShares' });

// ارتباطات گروه
Group.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members' });
Group.hasMany(ImageShare, { foreignKey: 'sharedWithGroupId', as: 'shares' });

// ارتباطات عضو گروه
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

// ارتباطات تصویر
Image.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Image.hasMany(ImageShare, { foreignKey: 'imageId', as: 'shares' });

// ارتباطات اشتراک تصویر
ImageShare.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });
ImageShare.belongsTo(User, { foreignKey: 'sharedWithUserId', as: 'recipient' });
ImageShare.belongsTo(Group, { foreignKey: 'sharedWithGroupId', as: 'group' });

// تابع همگام‌سازی مدل‌ها با دیتابیس
export async function syncModels() {
  try {
    loggingClient.info('شروع همگام‌سازی مدل‌ها با دیتابیس', {
      action: 'model_sync_start'
    });

    // همگام‌سازی مدل‌ها به ترتیب صحیح برای رعایت وابستگی‌های foreign key
    await User.sync();
    await Group.sync();
    await GroupMember.sync();
    await Image.sync();
    await ImageShare.sync();

    loggingClient.info('همگام‌سازی مدل‌ها با موفقیت انجام شد', {
      action: 'model_sync_success'
    });
  } catch (error) {
    loggingClient.error('خطا در همگام‌سازی مدل‌ها', {
      action: 'model_sync_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export {
  User,
  Group,
  GroupMember,
  Image,
  ImageShare
}; 