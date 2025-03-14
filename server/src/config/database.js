const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('picsend', 'root', '123', {
  host: '127.0.0.1',
  port: 3306,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize; 