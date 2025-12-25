const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Shop = sequelize.define('Shop', {
  shop_id: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  shop_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rent_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  vat_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  operation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'shops',
});


module.exports = Shop;
