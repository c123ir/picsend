import sequelize from '../config/database';
import User from '../models/User';

async function migrate() {
  try {
    // اتصال به دیتابیس
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');

    // ایجاد جداول
    await sequelize.sync({ force: true });
    console.log('Database tables have been created successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate(); 