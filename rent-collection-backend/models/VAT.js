const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Shop = require('./Shop');
const Invoice = require('./Invoice');

const VAT = sequelize.define('VAT', {
  vat_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  shop_id: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  invoice_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vat_amount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 0,
  },
  generate_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW, 
  },
  paid_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Unpaid', 'Paid', 'Partially Paid', 'Arrest'),
    defaultValue: 'Unpaid',
  },
}, {
  timestamps: true,
  tableName: 'vat',
});

module.exports = VAT;
