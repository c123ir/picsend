import sequelize from '../config/database';
import User from '../models/User';
import Logger from '../utils/logger';

async function migrate() {
  try {
    // ایجاد جداول
    await sequelize.sync({ alter: true });
    Logger.info('جداول با موفقیت ایجاد شدند');

    // ایجاد کاربر ادمین پیش‌فرض
    const adminExists = await User.findOne({
      where: { email: 'admin@picsend.ir' }
    });

    if (!adminExists) {
      await User.create({
        email: 'admin@picsend.ir',
        password: '123456',
        fullName: 'مدیر سیستم',
        role: 'admin',
        isActive: true
      });
      Logger.info('کاربر ادمین پیش‌فرض ایجاد شد');
    }

    process.exit(0);
  } catch (error) {
    Logger.error('خطا در اجرای مایگریشن:', { error });
    process.exit(1);
  }
}

migrate(); 