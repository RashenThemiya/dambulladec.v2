const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VehicleType = sequelize.define('VehicleType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  defaultPrice: { // used in VehicleTicket for ticketPrice
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: { // optional description for the vehicle type
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'vehicle_types',
  timestamps: false,
  indexes: [
    {
      name: 'idx_vehicleType_name',
      unique: true,
      fields: ['name']
    }
  ]
});

module.exports = VehicleType;
