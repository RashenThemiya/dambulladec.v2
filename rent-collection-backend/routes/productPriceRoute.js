const express = require('express');
const router = express.Router();
const Price = require('../models/Price');
const Product = require('../models/Product');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

// 1. Add or update daily price range for multiple products (bulk)
router.post('/update-multiple', authenticateUser, authorizeRole(['admin', 'superadmin','editor']), async (req, res) => {
  const entries = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: 'Request body must be a non-empty array.' });
  }

  const results = [];
  const errors = [];

  for (const entry of entries) {
    const { product_id, min_price, max_price, date } = entry;

    if (!product_id || min_price == null || max_price == null || !date) {
      errors.push({ entry, message: 'Missing required fields' });
      continue;
    }

    try {
      const [priceRecord, created] = await Price.findOrCreate({
        where: { product_id, date },
        defaults: { min_price, max_price }
      });

      if (!created) {
        priceRecord.min_price = min_price;
        priceRecord.max_price = max_price;
        await priceRecord.save();
      }

      results.push({
        product_id,
        date,
        status: created ? 'added' : 'updated',
        min_price: priceRecord.min_price,
        max_price: priceRecord.max_price
      });
    } catch (err) {
      errors.push({ entry, message: err.message });
    }
  }

  res.status(200).json({
    message: `Processed ${results.length} entries.`,
    results,
    errors,
  });
});

// 2. Add/update price range for a single product/date
router.post('/update', authenticateUser, authorizeRole(['admin', 'superadmin','editor']), async (req, res) => {
  const { product_id, min_price, max_price, date } = req.body;

  if (!product_id || min_price == null || max_price == null || !date) {
    return res.status(400).json({ message: 'product_id, min_price, max_price, and date are required.' });
  }

  try {
    const [priceRecord, created] = await Price.findOrCreate({
      where: { product_id, date },
      defaults: { min_price, max_price }
    });

    if (!created) {
      priceRecord.min_price = min_price;
      priceRecord.max_price = max_price;
      await priceRecord.save();
    }

    res.status(200).json({
      message: created ? 'Price range added successfully' : 'Price range updated successfully',
      data: priceRecord
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating price range', error: err.message });
  }
});

// 3. Get price range chart for a product
router.get('/product/:productId/chart', async (req, res) => {
  const { productId } = req.params;

  try {
    const prices = await Price.findAll({
      where: { product_id: productId },
      include: {
        model: Product,
        attributes: ['name'], // assuming 'name' is the field
      },
      order: [['date', 'ASC']],
    });

    res.status(200).json(prices);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching price chart', error: err.message });
  }
});

// 4. Get all product price ranges on a specific day
router.get('/by-date/:date', async (req, res) => {
  const { date } = req.params;

  try {
    const prices = await Price.findAll({
      where: { date },
      include: [{ model: Product, attributes: ['id', 'name', 'type', 'image'] }],
    });

    const formatted = prices.map(p => ({
      id: p.id,
      date: p.date,
      min_price: p.min_price,
      max_price: p.max_price,
      product: {
        id: p.Product.id,
        name: p.Product.name,
        type: p.Product.type,
        image: p.Product.image
          ? `data:image/jpeg;base64,${p.Product.image.toString('base64')}`
          : null
      }
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching prices for date', error: err.message });
  }
});

// 5. Get price range of a specific product on a specific day
router.get('/product/:productId/date/:date', async (req, res) => {
  const { productId, date } = req.params;

  try {
    const price = await Price.findOne({
      where: {
        product_id: productId,
        date
      }
    });

    if (!price) {
      return res.status(404).json({ message: 'Price not found for given product and date' });
    }

    res.status(200).json(price);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching price', error: err.message });
  }
});

// 6. Update price range of a product on a specific day
router.put('/product/:productId/date/:date', authenticateUser, authorizeRole(['admin', 'superadmin','editor']), async (req, res) => {
  const { productId, date } = req.params;
  const { min_price, max_price } = req.body;

  if (min_price == null || max_price == null) {
    return res.status(400).json({ message: 'min_price and max_price are required.' });
  }

  try {
    const priceRecord = await Price.findOne({
      where: {
        product_id: productId,
        date
      }
    });

    if (!priceRecord) {
      return res.status(404).json({ message: 'Price record not found.' });
    }

    priceRecord.min_price = min_price;
    priceRecord.max_price = max_price;
    await priceRecord.save();

    res.status(200).json({
      message: 'Price range updated successfully',
      data: priceRecord
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating price range', error: err.message });
  }
});

module.exports = router;
