const express = require('express');
const Invoice = require('../models/Invoice');
const Shop = require('../models/Shop');
const Tenant = require('../models/Tenant');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all invoices with shop details and tenant (owner) information

// Get all invoices with shop details and tenant information
const { Op } = require('sequelize');
const Payment = require('../models/Payment');
router.get('/', authenticateUser, authorizeRole(['admin', 'superadmin','editor']), async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            include: [
                {
                    model: Shop,
                    attributes: ['shop_name', 'location'],
                    include: [
                        {
                            model: Tenant,
                            attributes: ['name', 'contact']
                        }
                    ]
                }
            ],
            order: [['shop_id', 'ASC'], ['month_year', 'ASC']]
        });

        const enrichedInvoices = [];

        for (let i = 0; i < invoices.length; i++) {
            const currentInvoice = invoices[i];
            const currentMonth = currentInvoice.month_year;

            // 🔁 Find the previous invoice for this shop
            const previousInvoice = await Invoice.findOne({
                where: {
                    shop_id: currentInvoice.shop_id,
                    month_year: {
                        [Op.lt]: currentInvoice.month_year
                    }
                },
                order: [['month_year', 'DESC']]
            });
            

            const startDate = previousInvoice ? previousInvoice.month_year : new Date(0);
            const endDate = currentMonth;

            // 🔹 Payments in previous period
            const previousPayments = await Payment.findAll({
                where: {
                    shop_id: currentInvoice.shop_id,
                    payment_date: {
                        [Op.gte]: startDate,
                        [Op.lt]: endDate
                    }
                }
            });

            const previousTotalPaid = previousPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
            const lastPreviousPaymentDate = previousPayments.length > 0
                ? new Date(Math.max(...previousPayments.map(p => new Date(p.payment_date))))
                : null;

            // 🔹 Payments for the current invoice month
            const currentPayments = await Payment.findAll({
                where: {
                    shop_id: currentInvoice.shop_id,
                    payment_date: {
                        [Op.gte]: currentMonth,
                        [Op.lt]: new Date(new Date(currentMonth).setMonth(new Date(currentMonth).getMonth() + 1)) // end of current month
                    }
                }
            });

            const currentTotalPaid = currentPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);

            // 📦 Enrich the invoice
            const invoiceData = {
                ...currentInvoice.toJSON(),
                previous_payment_summary: {
                    total_paid: previousTotalPaid,
                    last_payment_date: lastPreviousPaymentDate
                },
                
                total_paid: currentTotalPaid , // 🟢 This is what your frontend needs
                previous_invoice_total_amount: previousInvoice ? previousInvoice.total_amount : null  // 🟢 Add this
                
            };
            

            enrichedInvoices.push(invoiceData);
        }
       

        res.status(200).json(enrichedInvoices);
    } catch (error) {
        console.error('Error fetching enriched invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
});


// Get invoice by ID (Admin & Superadmin)
router.get('/:invoiceId', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    const { invoiceId } = req.params;
    try {
        const invoice = await Invoice.findByPk(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
});

router.patch('/:invoiceId/print', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { invoiceId } = req.params;

  try {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
      }

      // Increment printedtime
      invoice.printedtime += 1;
      await invoice.save();

      res.status(200).json({ message: "Invoice printed successfully", printedtime: invoice.printedtime });
  } catch (error) {
      res.status(500).json({ message: "Error updating printed count", error: error.message });
  }
});



// Send WhatsApp messages for selected invoices
router.post('/send-whatsapp', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    try {
        const { invoices } = req.body; // Expecting [{ invoice_id, shop_id }]

        if (!Array.isArray(invoices) || invoices.length === 0) {
            return res.status(400).json({ message: "No invoice data provided" });
        }

        for (const invoice of invoices) {
            const tenant = await Tenant.findOne({ where: { shop_id: invoice.shop_id } });

            if (!tenant || !tenant.contact) {
                console.warn(`No tenant or contact found for shop_id: ${invoice.shop_id}`);
                continue;
            }

            const message = `Dear ${tenant.name}, your invoice #${invoice.invoice_id} has been processed.`;
            await sendWhatsAppMessage(tenant.contact, message); // Replace with real WhatsApp API
        }

        res.status(200).json({ success: true, message: "WhatsApp messages sent successfully" });
    } catch (error) {
        console.error("WhatsApp send error:", error);
        res.status(500).json({ success: false, message: "Failed to send WhatsApp messages", error: error.message });
    }
});


module.exports = router;
