const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fine = sequelize.define('Fine', {
  fine_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  shop_id: {
    type: DataTypes.STRING(10),
    allowNull: false, // Ensure a shop is always linked
  },
  invoice_id: {
    type: DataTypes.STRING,
    allowNull: false, // Optional: A fine may exist without an invoice
  },
  fine_amount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 0,
  },
  paid_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  generate_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW, 
  },
  status: {
    type: DataTypes.ENUM('Unpaid', 'Paid', 'Partially Paid', 'Arrest'),
    defaultValue: 'Unpaid',
  },
}, {
  timestamps: true,
  tableName: 'fines',
});

module.exports = Fine;
