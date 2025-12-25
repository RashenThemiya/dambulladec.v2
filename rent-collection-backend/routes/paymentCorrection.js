const express = require('express');
const { handlePaymentCorrection } = require('../utils/handlePaymentCorrection');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

const Payment = require('../models/Payment');
const { Op } = require('sequelize');

const router = express.Router();
// Apply payment correction (Only Admin & Super Admin can correct payments)
router.post(
    '/correct-payment',
    authenticateUser,
    authorizeRole(['admin', 'superadmin']),
    async (req, res) => {
        try {
            const { invoice_id, shop_id, actual_amount, admin_put_amount, edit_reason, payment_date } = req.body;
            const actual = Number(actual_amount);
            const admin = Number(admin_put_amount);
            if (!shop_id || isNaN(actual) || isNaN(admin)) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const adminName = req.user.email || 'System';

            const result = await handlePaymentCorrection({
                invoice_id,
                shop_id,
                actual_amount,
                admin_put_amount,
                edit_reason,
                admin_email: adminName,
                payment_date: payment_date || new Date(), // Optional: support custom payment_date
            });

            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('❌ Payment Correction Route Error:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
);

router.get(
    '/payments-by-date',
    authenticateUser,
    authorizeRole(['admin', 'superadmin']),
    async (req, res) => {
      try {
        const { shop_id, payment_date } = req.query;
  
        if (!shop_id || !payment_date) {
          return res.status(400).json({ success: false, message: 'shop_id and payment_date are required' });
        }
  
        // Normalize the date range (from 00:00 to 23:59)
        const startOfDay = new Date(payment_date);
        startOfDay.setHours(0, 0, 0, 0);
  
        const endOfDay = new Date(payment_date);
        endOfDay.setHours(23, 59, 59, 999);
  
        const payments = await Payment.findAll({
          where: {
            shop_id,
            payment_date: {
              [Op.between]: [startOfDay, endOfDay],
            },
          },
          order: [['payment_date', 'ASC']],
        });
  
        return res.status(200).json({ success: true, data: payments });
      } catch (error) {
        console.error('❌ Error fetching payments:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    }
  );
module.exports = router;
