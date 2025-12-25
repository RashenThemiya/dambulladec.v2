const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',

    // ✅ Enforce UTC without useUTC
    timezone: '+00:00',

    logging: false,
    pool: {
      max: 15,
      min: 0,
      acquire: 1000000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
