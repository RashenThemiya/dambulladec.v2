const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GateCounter = sequelize.define('GateCounter', {
  gateNumber: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  currentValue: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'gate_counters',
  timestamps: false
});

module.exports = GateCounter;
