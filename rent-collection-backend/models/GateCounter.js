const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GateCounter = sequelize.define('GateCounter', {
  gateNumber: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  counterDate: {
      type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: false,          // must be false since it's part of primary key
      primaryKey: true,
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
