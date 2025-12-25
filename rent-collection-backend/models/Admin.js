const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");

const Admin = sequelize.define(
  "Admin",
  {
    admin_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("superadmin", "admin", "tiketing", "editor", "manager"), // You can use DataTypes.STRING if more roles are expected
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Hash password before saving or updating admin
const hashPassword = async (admin) => {
  if (admin.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);
  }
};

Admin.beforeCreate(hashPassword);
Admin.beforeUpdate(hashPassword);

module.exports = Admin;
