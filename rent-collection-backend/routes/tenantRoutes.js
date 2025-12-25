const express = require('express');
const Tenant = require('../models/Tenant');
const Shop = require('../models/Shop');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all tenants (Only superadmin or admin can view all tenants)
router.get('/', authenticateUser, authorizeRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const tenants = await Tenant.findAll({ include: Shop });
    res.status(200).json(tenants);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tenants', error: err.message });
  }
});

// Get tenant by ID
router.get('/:tenantId', authenticateUser, authorizeRole(['superadmin', 'admin', 'manager', 'tenant']), async (req, res) => {
  const { tenantId } = req.params;
  try {
    const tenant = await Tenant.findByPk(tenantId, { include: Shop });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    
    if (req.user.role === 'tenant' && req.user.id !== parseInt(tenantId)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    res.status(200).json(tenant);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tenant', error: err.message });
  }
});

// Add new tenant
router.post('/', authenticateUser, authorizeRole(['superadmin', 'admin']), async (req, res) => {
  const { name, contact, email, address, shop_id } = req.body;

  if (!name || !contact || !email || !address || !shop_id) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const shopExists = await Shop.findByPk(shop_id);
    if (!shopExists) {
      return res.status(400).json({ message: 'Invalid shop_id. Shop does not exist.' });
    }

    const newTenant = await Tenant.create({ name, contact, email, address, shop_id });
    res.status(201).json({ message: 'Tenant added successfully', tenantId: newTenant.id });
  } catch (err) {
    res.status(500).json({ message: 'Error adding tenant', error: err.message });
  }
});

// Update tenant
router.put('/:tenantId', authenticateUser, authorizeRole(['superadmin', 'admin', 'manager', 'tenant']), async (req, res) => {
  const { tenantId } = req.params;
  const { name, contact, email, address, shop_id } = req.body;

  if (!name || !contact || !email || !address || !shop_id) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    
    if (req.user.role === 'tenant' && req.user.id !== parseInt(tenantId)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const shopExists = await Shop.findByPk(shop_id);
    if (!shopExists) {
      return res.status(400).json({ message: 'Invalid shop_id. Shop does not exist.' });
    }

    await tenant.update({ name, contact, email, address, shop_id });
    res.status(200).json({ message: 'Tenant updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating tenant', error: err.message });
  }
});

// Delete tenant
router.delete('/:tenantId', authenticateUser, authorizeRole(['superadmin', 'admin']), async (req, res) => {
  const { tenantId } = req.params;

  try {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    await tenant.destroy();
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting tenant', error: err.message });
  }
});

module.exports = router;