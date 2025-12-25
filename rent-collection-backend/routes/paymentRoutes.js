const express = require('express');
const {
  processPaymentByShopId,
  processPaymentByInvoiceId,
} = require('../utils/processPayment');
const {
  authenticateUser,
  authorizeRole,
} = require('../middleware/authMiddleware');
const { Payment } = require('../models');
const { Sequelize } = require('sequelize'); // ✅ Add this line
const router = express.Router();
// Simple in-memory locking system per shopId



const { acquireLock, releaseLock } = require('../utils/lock'); // ✅ Import here

// Get all payments (accessible by Admin and Super Admin)
router.get('/payments', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const payments = await Payment.findAll();
    return res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch payments", error: error.message });
  }
});

router.post('/by-shop/:shopId', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { shopId } = req.params;
  const { amountPaid, paymentMethod, paymentDate } = req.body;
  const adminName = req.user.email || 'System';

  if (!amountPaid || !paymentMethod || !paymentDate) {
    return res.status(400).json({ success: false, message: 'Amount paid, payment method, and payment date are required' });
  }

  await acquireLock(shopId); // 👈 Acquire lock before processing

  try {
    const startOfDay = new Date(paymentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(paymentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingPayment = await Payment.findOne({
      where: {
        shop_id: shopId,
        payment_date: {
          [Sequelize.Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `A payment has already been recorded for this shop on ${paymentDate}`
      });
    }

    const result = await processPaymentByShopId(shopId, amountPaid, paymentMethod, paymentDate, adminName);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({ success: false, message: 'Payment processing failed', ...result });
    }

  } catch (err) {
    console.error('Error processing payment for shop:', err);
    return res.status(500).json({ success: false, message: 'Error processing payment', error: err.message });
  } finally {
    releaseLock(shopId); // 👈 Always release lock
  }
});

// Process payment by Invoice ID (accessible by Admin and Super Admin)
router.post('/by-invoice/:invoiceId', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { invoiceId } = req.params;
  const { amountPaid, paymentMethod, paymentDate } = req.body;
  const adminName = req.user.email || 'System';

  if (!amountPaid || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Amount paid and payment method are required' });
  }

  try {
    const result = await processPaymentByInvoiceId(invoiceId, amountPaid, paymentMethod, paymentDate, adminName);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({ success: false, message: 'Payment processing failed', ...result });
    }
  } catch (err) {
    console.error('Error processing payment for invoice:', err);
    return res.status(500).json({ success: false, message: 'Error processing payment', error: err.message });
  }
});

module.exports = router;
