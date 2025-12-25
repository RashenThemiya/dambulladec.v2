const express = require('express');
const { Op } = require('sequelize');
const Shop = require('../models/Shop');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Fine = require('../models/Fine');
const OperationFee = require('../models/OperationFee');
const Rent = require('../models/Rent');
const Vat = require('../models/VAT');
const AuditTrail = require('../models/AuditTrail');
const shopBalance = require('../models/ShopBalance');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware"); 
const { applyFineToAllInvoices } = require('../utils/applyFineToAllInvoices'); // Adjust the path accordingly
const { applyArrestAction } = require('../utils/applyArrestAction'); // Adjust the path accordingly
const { applyFineArrestAction } = require('../utils/applyFineArrestAction'); // Adjust the path accordingly
// ✅ Import middleware once

const router = express.Router();

router.put('/update-vat-rate', authenticateUser, authorizeRole(["admin", "superadmin"]), async (req, res) => {
  const { newVatRate } = req.body;

  if (!newVatRate) {
    return res.status(400).json({ message: 'New VAT rate is required.' });
  }

  try {
    const [updatedRows] = await Shop.update(
      { vat_rate: newVatRate },
      { where: {} }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ message: 'No shops found to update.' });
    }

    return res.status(200).json({ message: `VAT rate updated for ${updatedRows} shops successfully.` });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating VAT rate for all shops', error: err.message });
  }
});
router.post('/apply-fines', authenticateUser, authorizeRole(["admin", "superadmin"]), async (req, res) => {
  const result = await applyFineToAllInvoices();
  return res.status(result.success ? 200 : 400).json(result);
});

// Apply Fine Arrest Action
router.post('/fine-arrest-action', authenticateUser, authorizeRole(["admin", "superadmin"]), async (req, res) => {
  const result = await applyFineArrestAction();
  return res.status(result.success ? 200 : 400).json(result);
});

// ✅ Apply Full Arrest Action to Invoices and Related Entities
router.post('/invoice-arrest-action', authenticateUser, authorizeRole(["admin", "superadmin"]), async (req, res) => {
  const result = await applyArrestAction();
  return res.status(result.success ? 200 : 400).json(result);
});

module.exports = router; // Make sure to export the router
