const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM("fruit", "vegetable", "rice","potatoes","Leaf Vegetable","Grain"), // Now includes "rice"
        allowNull: false
    },
    image: {
        type: DataTypes.BLOB("long"), // Store image as binary data (BLOB)
        allowNull: true
    }
});

module.exports = Product;
