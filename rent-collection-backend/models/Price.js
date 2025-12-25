const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Price = sequelize.define("Price", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    min_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    max_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});

module.exports = Price;
