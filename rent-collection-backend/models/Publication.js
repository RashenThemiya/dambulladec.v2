const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Publication = sequelize.define('Publication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('notice', 'news', 'announcement', 'event'),
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image: {
    type: DataTypes.BLOB("long"), // Store image binary data
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'publications', // Not limited to announcements only
});

module.exports = Publication;
