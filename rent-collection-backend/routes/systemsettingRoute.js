const express = require('express');
const { Op } = require('sequelize');
const Payment = require('../models/Payment');
const AuditTrail = require('../models/AuditTrail');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');
const Invoice = require('../models/Invoice');
const ShopBalance = require('../models/ShopBalance');
const { generateInvoice } = require('../utils/generateInvoice');
const Fine = require('../models/Fine');
const { applyFine } = require('../utils/applyFine'); // Ensure this is imported at the top

const router = express.Router();

// DELETE a payment by ID and log the deletion in the AuditTrail
// DELETE a payment by ID and log the deletion in the AuditTrail
router.delete('/payment/:id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    const { id } = req.params;
    const adminName = req.user?.username || "Unknown User";

    try {
        const payment = await Payment.findByPk(id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const deletedPaymentData = payment.get({ plain: true });
        await payment.destroy();

        await AuditTrail.create({
            shop_id: deletedPaymentData.shop_id,
            invoice_id: deletedPaymentData.invoice_id,
            event_type: 'Correction',
            event_description: `Payment ID ${id} deleted by ${adminName}.`,
            old_value: JSON.stringify(deletedPaymentData),
            new_value: null,
            edit_reason: 'Payment deletion due to correction or admin request',
            user_actioned: adminName,
        });

        return res.status(200).json({ message: `Payment with ID ${id} deleted and audit log recorded.` });
    } catch (error) {
        console.error('Error deleting payment:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE an invoice by ID and log the deletion in the AuditTrail
router.delete('/invoice/:invoice_id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    const { invoice_id } = req.params;
    const adminName = req.user?.username || "Unknown User";

    try {
        const invoice = await Invoice.findByPk(invoice_id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const deletedInvoiceData = invoice.get({ plain: true });
        await invoice.destroy();

        await AuditTrail.create({
            shop_id: deletedInvoiceData.shop_id,
            invoice_id: null,
            event_type: 'Correction',
            event_description: `Invoice ID ${invoice_id} deleted by ${adminName}.`,
            old_value: JSON.stringify(deletedInvoiceData),
            new_value: null,
            edit_reason: 'Invoice deletion due to correction or admin request',
            user_actioned: adminName,
        });

        return res.status(200).json({ message: `Invoice with ID ${invoice_id} deleted and audit log recorded.` });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});
router.put('/shop-balance/:shop_id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    const { shop_id } = req.params;
    const { balance_amount } = req.body;
    const adminName = req.user?.username || "Unknown User";

    if (typeof balance_amount !== 'number') {
        return res.status(400).json({ error: 'balance_amount must be a number.' });
    }

    try {
        const shopBalance = await ShopBalance.findByPk(shop_id);

        if (!shopBalance) {
            return res.status(404).json({ error: 'Shop balance record not found.' });
        }

        // Store previous value for audit
        const oldValue = shopBalance.get({ plain: true });

        // Update balance
        shopBalance.balance_amount = balance_amount;
        shopBalance.last_updated = new Date();

        await shopBalance.save();

        // Log audit trail
        await AuditTrail.create({
            shop_id: shop_id,
            invoice_id: null,  // not linked to a specific invoice
            event_type: 'Manual Edit',
            event_description: `Shop balance updated by ${adminName}.`,
            old_value: JSON.stringify(oldValue),
            new_value: JSON.stringify(shopBalance.get({ plain: true })),
            edit_reason: 'Admin manual balance correction or update',
            user_actioned: adminName,
        });

        return res.status(200).json({
            message: `Shop balance for ${shop_id} updated and audit log recorded.`,
            data: shopBalance
        });
    } catch (error) {
        console.error('Error updating shop balance:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/generate', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { shop_id, month_year } = req.body;
  const adminName = req.user?.username || "System";

  if (!shop_id || !month_year) {
    return res.status(400).json({ error: 'shop_id and month_year are required.' });
  }

  try {
    const invoice = await generateInvoice(shop_id, month_year, adminName);
    return res.status(201).json({ message: 'Invoice generated successfully.', invoice });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return res.status(500).json({ error: 'Internal server error while generating invoice.' });
  }
});
// DELETE a fine by invoice_id and log the deletion in the AuditTrail
router.delete('/fine/:invoice_id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    const { invoice_id } = req.params;
    const adminName = req.user?.username || "Unknown User"; // Default to "Unknown User" if no admin info is available

    try {
        // Find the fine associated with the invoice
        const fine = await Fine.findOne({ where: { invoice_id } });

        if (!fine) {
            return res.status(404).json({ error: `Fine not found for invoice ${invoice_id}.` });
        }

        // Store the current fine data before deletion
        const deletedFineData = fine.get({ plain: true });

        // Delete the fine from the database
        await fine.destroy();

        // Log the deletion in the AuditTrail
        await AuditTrail.create({
            shop_id: deletedFineData.shop_id,
            invoice_id: deletedFineData.invoice_id,
            event_type: 'Correction',
            event_description: `Fine for invoice ${invoice_id} deleted by ${adminName}.`,
            old_value: JSON.stringify(deletedFineData),
            new_value: null,
            edit_reason: 'Fine deletion due to correction or admin request',
            user_actioned: adminName,
        });

        return res.status(200).json({ message: `Fine for invoice ${invoice_id} deleted and audit log recorded.` });
    } catch (error) {
        console.error('Error deleting fine:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});
// Apply a fine to an invoice by invoice ID
router.post('/fine/apply/:invoice_id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    const { invoice_id } = req.params;
    const adminName = req.user?.username || "System";

    try {
        const result = await applyFine(invoice_id);

        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        // Optional: log the fine application by admin (update if needed in applyFine)
        await AuditTrail.create({
            invoice_id,
            event_type: 'Correction',
            event_description: `Fine of ${result.fineAmount} manually applied to Invoice ID ${invoice_id} by ${adminName}.`,
            user_actioned: adminName
        });

        return res.status(200).json({ message: result.message, fineAmount: result.fineAmount });
    } catch (error) {
        console.error('Error applying fine:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
