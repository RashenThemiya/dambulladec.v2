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
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware"); // ✅ Import middleware once

const router = express.Router();

// Get shops without tenants
router.get('/without-tenants', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const shopsWithoutTenants = await Shop.findAll({
      include: [{
        model: Tenant,
        required: false, // Left join (shops with no tenants will still be included)
      }],
      where: { '$Tenant.shop_id$': null } // Filtering only shops that have no tenants
    });

    res.status(200).json(shopsWithoutTenants);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching shops without tenants', error: err.message });
  }
});

// Get all shops (accessible by Admin and Super Admin)
router.get('/', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const shops = await Shop.findAll();
    res.status(200).json(shops);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching shops', error: err.message });
  }
});

// Get shop by ID (accessible by Admin and Super Admin)
router.get('/:shopId', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { shopId } = req.params;
  try {
    const shop = await Shop.findByPk(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.status(200).json(shop);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching shop', error: err.message });
  }
});

// Add new shop (only accessible by Super Admin)
router.post('/', authenticateUser, authorizeRole(["admin", "superadmin"]), async (req, res) => {
  const { shop_id, shop_name, location, rent_amount, vat_rate, operation_fee } = req.body;

  if (!shop_id || !shop_name || !location || !rent_amount || !vat_rate || !operation_fee) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const newShop = await Shop.create({
      shop_id,
      shop_name,
      location,
      rent_amount,
      vat_rate,
      operation_fee
    });
    res.status(201).json({ message: 'Shop added successfully', shopId: newShop.shop_id });
  } catch (err) {
    res.status(500).json({ message: 'Error adding shop', error: err.message });
  }
});

// Update shop (only accessible by Super Admin)
router.put('/:shopId', authenticateUser, authorizeRole(["admin", "superadmin"]), async (req, res) => {
  const { shopId } = req.params;
  const { shop_name, location, rent_amount, vat_rate, operation_fee } = req.body;

  if (!shop_name || !location || !rent_amount || !vat_rate || !operation_fee) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const shop = await Shop.findByPk(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    await shop.update({ shop_name, location, rent_amount, vat_rate, operation_fee });
    res.status(200).json({ message: 'Shop updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating shop', error: err.message });
  }
});

// Delete shop (only accessible by Super Admin)
router.delete('/:shopId', authenticateUser, authorizeRole([ "superadmin"]), async (req, res) => {
  const { shopId } = req.params;

  try {
    const shop = await Shop.findByPk(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    await shop.destroy();
    res.status(200).json({ message: 'Shop deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting shop', error: err.message });
  }
});



// GET shop summary by shop_id
router.get('/shop-summary/:shop_id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { shop_id } = req.params;

    // Fetch shop details along with related records
    const shop = await Shop.findOne({
      where: { shop_id },
      include: [
        { model: Tenant },
        { 
          model: shopBalance, 
          attributes: ['balance_amount'] // Only include these fields
        },
        { model: Invoice, 
          separate: true, // Prevents duplicate invoice entries
          include: [
            { model: Fine }, // Fines related to invoice
            { model: OperationFee }, // Operation fees related to invoice
            { model: Vat }, // VAT details
            { model: Rent } // Rent details related to invoice
          ]  
        },
        { model: Payment }
      ]
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.status(200).json({ shop });
  } catch (error) {
    console.error('Error fetching shop summary:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;


