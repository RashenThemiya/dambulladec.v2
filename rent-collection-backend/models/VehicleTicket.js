const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VehicleTicket = sequelize.define('VehicleTicket', {
  id: { // default auto-increment numeric ID
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  customId: { // like GATE1_001
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  internalRefId: { // new internal ID for tracking
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vehicleTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vehicleTypeTicketId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ticketPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fromLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  products: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gateNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entryTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  exitTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  byWhom: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'vehicle_tickets',
  timestamps: true,
  indexes: [
    { name: 'idx_vehicleTypeId', fields: ['vehicleTypeId'] },
    { name: 'idx_entryTime', fields: ['entryTime'] },
    { name: 'idx_exitTime', fields: ['exitTime'] },
    { name: 'idx_byWhom_entryTime', fields: ['byWhom', 'entryTime'] },
    { name: 'idx_gateNumber', fields: ['gateNumber'] },
    { name: 'idx_customId', fields: ['customId'] },
    { name: 'idx_internalRefId', fields: ['internalRefId'] }
  ]
});

module.exports = VehicleTicket;
