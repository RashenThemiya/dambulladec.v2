const sequelize = require('../config/database');
const Shop = require('./Shop');
const ShopBalance = require('./ShopBalance');
const Fine = require('./Fine');
const Invoice = require('./Invoice');
const OperationFee = require('./OperationFee');
const Rent = require('./Rent');
const Tenant = require('./Tenant');
const Vat = require('./VAT'); 
const Payment = require('./Payment');
const AuditTrail = require('./AuditTrail');
const Product = require('./Product'); // Assuming you have a Product model
const Price = require('./Price'); // Assuming you have a Price model
const VehicleType = require('./VehicleType');
const VehicleTicket = require('./VehicleTicket');
const GateCounter = require('./GateCounter');


Product.hasMany(Price, { foreignKey: "product_id", onDelete: "CASCADE" });
Price.belongsTo(Product, { foreignKey: "product_id" });


// ✅ Tenant & Shop Relationship
Shop.hasOne(Tenant, { foreignKey: 'shop_id', onDelete: 'CASCADE', hooks: true });
Tenant.belongsTo(Shop, { foreignKey: 'shop_id', allowNull: false }); // Tenant MUST belong to a shop

// ✅ Shop Balance
Shop.hasOne(ShopBalance, { foreignKey: 'shop_id', onDelete: 'CASCADE', hooks: true });
ShopBalance.belongsTo(Shop, { foreignKey: 'shop_id' });

// ✅ Fines & Invoices
Shop.hasMany(Fine, { foreignKey: 'shop_id', onDelete: 'CASCADE', hooks: true });
Fine.belongsTo(Shop, { foreignKey: 'shop_id' });

Invoice.hasMany(Fine, { foreignKey: 'invoice_id', onDelete: 'CASCADE', hooks: true });
Fine.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// ✅ Invoices & Shops
Shop.hasMany(Invoice, { foreignKey: 'shop_id', onDelete: 'CASCADE', hooks: true });
Invoice.belongsTo(Shop, { foreignKey: 'shop_id' });

// ✅ Operation Fees
Shop.hasMany(OperationFee, { foreignKey: 'shop_id', onDelete: 'CASCADE', hooks: true });
OperationFee.belongsTo(Shop, { foreignKey: 'shop_id' });

Invoice.hasMany(OperationFee, { foreignKey: 'invoice_id', onDelete: 'CASCADE', hooks: true });
OperationFee.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// ✅ Rent Payments
Shop.hasMany(Rent, { foreignKey: 'shop_id', onDelete: 'CASCADE', hooks: true });
Rent.belongsTo(Shop, { foreignKey: 'shop_id' });

Invoice.hasMany(Rent, { foreignKey: 'invoice_id', onDelete: 'CASCADE', hooks: true });
Rent.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// ✅ VAT
Shop.hasMany(Vat, { foreignKey: 'shop_id', onDelete: 'CASCADE', hooks: true });
Vat.belongsTo(Shop, { foreignKey: 'shop_id' });

Invoice.hasMany(Vat, { foreignKey: 'invoice_id', onDelete: 'CASCADE', hooks: true });
Vat.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// ✅ Audit Trail (Ensure `shop_id` & `invoice_id` allow NULL for `SET NULL`)
Shop.hasMany(AuditTrail, { foreignKey: 'shop_id', onDelete: 'SET NULL', hooks: true });
AuditTrail.belongsTo(Shop, { foreignKey: 'shop_id', allowNull: true });

Invoice.hasMany(AuditTrail, { foreignKey: 'invoice_id', onDelete: 'SET NULL', hooks: true });
AuditTrail.belongsTo(Invoice, { foreignKey: 'invoice_id', allowNull: true });

// ✅ Add Shop- Payment Association
Shop.hasMany(Payment, { foreignKey: 'shop_id', onDelete: 'CASCADE', hooks: true });
Payment.belongsTo(Shop, { foreignKey: 'shop_id' });

// ✅ Add Invoice- Payment Association
Invoice.hasMany(Payment, { foreignKey: 'invoice_id', onDelete: 'CASCADE', hooks: true });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

VehicleType.hasMany(VehicleTicket, { foreignKey: 'vehicleTypeId', onDelete: 'RESTRICT' });
VehicleTicket.belongsTo(VehicleType, { foreignKey: 'vehicleTypeId' });

// ✅ Sync the database
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
})();

// ✅ Export Models
module.exports = { sequelize, Shop, ShopBalance, Fine, Invoice, OperationFee, Rent, Tenant, Vat, Payment, AuditTrail, Product, Price , VehicleType, VehicleTicket , GateCounter};
