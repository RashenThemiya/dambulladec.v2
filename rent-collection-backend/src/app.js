require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('../config/database');
const tenantRoutes = require('../routes/tenantRoutes');
const adminRoutes = require('../routes/adminRoutes');
const shopRoutes = require('../routes/shopRoutes');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const paymentRoutes = require('../routes/paymentRoutes'); 
const emailRoutes = require('../routes/emailRoute'); // Import email routes



const paymentCorrection = require('../routes/paymentCorrection'); 
const settingRoutes = require('../routes/settingRoutes'); // Import the new setting routes// Import payment routes

require("../jobs/cronJob");  // If placed in /jobs/
require('../models'); 
const invoiceRoutes = require('../routes/invoiceRoutes');
const auditTrailRoutes = require('../routes/auditRoutes'); // Import audit trail routes
const summeryRoutes = require('../routes/summeryRoutes'); // Import summary routes
const vehicleTicketRoutes = require('../routes/vehicleTicket');
const sanitationRoutes = require('../routes/sanitationRoutes'); // Import sanitation routes
const generateInvoiceRoutes = require('../routes/generateInvoiceRoutes');
const productRoutes = require('../routes/productRoutes'); // Import product routes
const productPriceRoutes = require('../routes/productPriceRoute'); // Import product price routes
const publicationRoutes = require('../routes/publicationRoutes'); 
const ReportRoute        = require('../routes/ReportRoute')// Import publications routes
const ReportRoute2        = require('../routes/ReportRoutedd')// Import publications routes
const ReportRoute3        = require('../routes/ReportRoutec')// Import publications routes
const backupRoutes = require('../routes/backup'); // Import backup routes4
const systemseetingRoute = require('../routes/systemsettingRoute'); // Import system settings routes
const app = express();

app.use(cors({ origin: "*", credentials: true }));

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

console.log("Loading environment variables...");
console.log("Super Admin Email:", process.env.DEFAULT_SUPERADMIN_EMAIL);
console.log("Admin Email:", process.env.DEFAULT_ADMIN_EMAIL);
console.log("JWT Secret:", process.env.JWT_SECRET);

// Routes
app.use('/api/tenants', tenantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/payments', paymentRoutes);  // Payment-related routes
app.use('/api/paymentscorrection', paymentCorrection);
app.use('/api/report', ReportRoute); // Report routes
app.use('/api/report2', ReportRoute2);
app.use('/api/report3', ReportRoute3); // Report routes

app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingRoutes); // Settings routes
app.use('/api/audit', auditTrailRoutes); // Audit trail routes
app.use('/api/summery', summeryRoutes); // Summary routes
app.use('/api/vehicle-tickets', vehicleTicketRoutes);
app.use('/api/sanitation', sanitationRoutes);
app.use('/api/generateInvoices', generateInvoiceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prices', productPriceRoutes); // Product price routes
app.use('/api/publications', publicationRoutes); // Publications routes
app.use('/api/backup', backupRoutes); // Backup routes
app.use('/api/systemsetting', systemseetingRoute); // System settings routes
app.use('/api/email', emailRoutes); // Email routes
const createDefaultAdmins = async () => {
  try {
    const users = [
      {
        username: process.env.DEFAULT_SUPERADMIN_USERNAME,
        email: process.env.DEFAULT_SUPERADMIN_EMAIL,
        password: process.env.DEFAULT_SUPERADMIN_PASSWORD,
        role: "superadmin"
      },
      {
        username: process.env.DEFAULT_ADMIN_USERNAME,
        email: process.env.DEFAULT_ADMIN_EMAIL,
        password: process.env.DEFAULT_ADMIN_PASSWORD,
        role: "admin"
      }
    ];

    for (const user of users) {
      const existingUser = await Admin.findOne({ where: { email: user.email } });
      if (!existingUser) {
        await Admin.create(user);
        console.log(` Default ${user.role} account created: ${user.email}`);
      } else {
        console.log(` Default ${user.role} already exists: ${user.email}`);
      }
    }
  } catch (err) {
    console.error(' Error creating default admins:', err.message);
  }
};

// Sync database and create default admins
sequelize.sync({ alter: true }).then(() => {
  console.log(' Database synced!');
  createDefaultAdmins();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});

