const { Sequelize } = require('sequelize');
const Invoice = require('../models/Invoice');
const Fine = require('../models/Fine');
const AuditTrail = require('../models/AuditTrail');
const { applyFine } = require('../utils/applyFine');
const dayjs = require('dayjs');

/**
 * Apply fines to all eligible invoices that are older than 17 days and do NOT already have a fine.
 * @returns {object} - Success or failure response.
 */
async function applyFineToAllInvoices() {
    try {
        const fineThresholdDate = dayjs().subtract(17, 'days').toDate();
        console.log(`📅 Fine threshold date is: ${fineThresholdDate}`);

        const invoices = await Invoice.findAll({
            where: {
                status: { [Sequelize.Op.in]: ['Unpaid', 'Partially Paid', 'Arrest'] },
                createdAt: { [Sequelize.Op.lte]: fineThresholdDate }
            }
        });

        console.log(`📄 Found ${invoices.length} potentially eligible invoices.`);

        if (!invoices.length) {
            return { success: false, message: "No eligible invoices found for fine application." };
        }

        const invoiceIds = invoices.map(inv => inv.invoice_id);

        const existingFines = await Fine.findAll({
            attributes: ['invoice_id'],
            where: { invoice_id: { [Sequelize.Op.in]: invoiceIds } },
            raw: true
        });

        const finedInvoiceIds = new Set(existingFines.map(f => f.invoice_id));
        console.log(`💰 ${finedInvoiceIds.size} invoices already have fines.`);

        const invoicesToFine = invoices.filter(inv => !finedInvoiceIds.has(inv.invoice_id));
        console.log(`🔍 ${invoicesToFine.length} invoices eligible for fine application.`);

        if (!invoicesToFine.length) {
            return { success: false, message: "All eligible invoices already have fines." };
        }

        let totalFinedInvoices = 0;

        for (const invoice of invoicesToFine) {
            console.log(`⚙️ Applying fine to invoice #${invoice.invoice_id}...`);
            const result = await applyFine(invoice.invoice_id);

            if (result.success) {
                totalFinedInvoices++;
                console.log(`✅ Fine of ${result.fineAmount} applied to invoice #${invoice.invoice_id}`);

                // Audit Trail
                await AuditTrail.create({
                    shop_id: invoice.shop_id,
                    invoice_id: invoice.invoice_id,
                    event_type: 'Fine Applied',
                    event_description: `Fine of ${result.fineAmount} applied to overdue invoice.`,
                    user_actioned: 'System'
                });
            } else {
                console.warn(`⚠️ Failed to apply fine to invoice #${invoice.invoice_id}: ${result.message}`);
            }
        }

        return { success: true, message: `${totalFinedInvoices} invoices fined successfully.` };

    } catch (error) {
        console.error("❌ Fine Application Error:", error);
        return { success: false, message: `Error applying fines: ${error.message}` };
    }
}

module.exports = { applyFineToAllInvoices };
