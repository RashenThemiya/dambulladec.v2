const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sanitation = sequelize.define('Sanitation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  customId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  byWhom: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'sanitation',
  timestamps: true,
  indexes: [
    {
      name: 'idx_price',
      fields: ['price']
    },
    {
      name: 'idx_date_price',
      fields: ['date', 'price']
    },
    // NEW: for faster filtering by createdAt (for daily/monthly reports)
    {
      name: 'idx_createdAt',
      fields: ['createdAt']
    },
    // NEW: composite index for filtering by byWhom + createdAt + price
    {
      name: 'idx_byWhom_createdAt_price',
      fields: ['byWhom', 'createdAt', 'price']
    }
  ]
});

module.exports = Sanitation;
