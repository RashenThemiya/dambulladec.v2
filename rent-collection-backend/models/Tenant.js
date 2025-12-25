const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Shop = require('./Shop'); // Import Shop model

const Tenant = sequelize.define('Tenant', {
  tenant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  shop_id: {
    type: DataTypes.STRING(10),
    allowNull: false, // A tenant must be linked to a shop // If shop is deleted, remove the tenant
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,  ///this one need to be false, because we have to send emails to tenants
    validate: {
      isEmail: true,
    },
  },
}, {
  timestamps: true,
  tableName: 'tenants',
});


module.exports = Tenant;
