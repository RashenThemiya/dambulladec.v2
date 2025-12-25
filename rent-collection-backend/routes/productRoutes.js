const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Get all products
router.get('/', authenticateUser, authorizeRole(['admin', 'superadmin','editor']), async (req, res) => {
  try {
    const products = await Product.findAll();

    const formatted = products.map(product => ({
      ...product.toJSON(),
      image: product.image ? `data:image/jpeg;base64,${product.image.toString('base64')}` : null
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

// Get product by ID
router.get('/:productId', authenticateUser, authorizeRole(['admin', 'superadmin','editor']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const formatted = {
      ...product.toJSON(),
      image: product.image ? `data:image/jpeg;base64,${product.image.toString('base64')}` : null
    };

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
});

// Add new product
router.post('/', authenticateUser, authorizeRole(['admin', 'superadmin','editor']), upload.single('image'), async (req, res) => {
  const { name, type } = req.body;
  const image = req.file ? req.file.buffer : null;

  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type are required.' });
  }

  try {
    const newProduct = await Product.create({ name, type, image });
    res.status(201).json({ message: 'Product added successfully', productId: newProduct.id });
  } catch (err) {
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
});

// Update product
router.put('/:productId', authenticateUser, authorizeRole(['admin', 'superadmin','editor']), upload.single('image'), async (req, res) => {
  const { name, type } = req.body;
  const image = req.file ? req.file.buffer : null;

  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type are required.' });
  }

  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.update({ name, type, ...(image && { image }) });
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// Delete product
router.delete('/:productId', authenticateUser, authorizeRole([ 'superadmin']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

// Product summary route (placed at bottom to avoid route clash)
router.get('/product-summary/:productId', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.productId },
      include: [
        { model: Invoice, separate: true, include: [{ model: Payment }] }
      ]
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.status(200).json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

module.exports = router;
