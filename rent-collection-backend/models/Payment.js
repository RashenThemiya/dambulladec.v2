const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Shop = require('./Shop');
const Invoice = require('./Invoice');

const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  shop_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  invoice_id: {
    type: DataTypes.STRING,
    allowNull: true, // Invoice ID can now be NULL,

  },
  amount_paid: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('Cash', 'Bank Transfer', 'Cheque', 'Correction Made'),
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'payments',
});

module.exports = Payment;
