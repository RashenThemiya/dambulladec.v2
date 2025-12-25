const { Sequelize } = require('sequelize');
const Fine = require('../models/Fine');
const Invoice = require('../models/Invoice');
const Rent = require('../models/Rent');
const AuditTrail = require('../models/AuditTrail');
const sequelize = require('../config/database');

/**
 * Apply a fine to an invoice (30% of unpaid rent amount).
 * @param {number} invoiceId - The ID of the invoice.
 * @returns {object} - Success or failure response.
 */
async function applyFine(invoiceId) {
    const t = await sequelize.transaction();
    try {
        console.log(`🔍 Looking up invoice ID: ${invoiceId}`);
        
        // Check if invoice exists
        const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
        if (!invoice) {
            console.warn(`⚠️ Invoice ID ${invoiceId} not found.`);
            throw new Error("Invoice not found.");
        }

        const shopId = invoice.shop_id;
        console.log(`🏪 Shop ID for invoice: ${shopId}`);

        // Early exit if fine already exists
        const existingFine = await Fine.findOne({
            where: { invoice_id: invoiceId },
            transaction: t
        });

        if (existingFine) {
            console.warn(`⚠️ Fine already exists for invoice #${invoiceId}`);
            await t.rollback();
            return { success: false, message: "Fine already exists for this invoice." };
        }

        // Fetch rent records
        const rents = await Rent.findAll({
            where: { invoice_id: invoiceId },
            transaction: t
        });

        if (rents.length === 0) {
            console.warn(`⚠️ No rent records found for invoice #${invoiceId}`);
            await t.rollback();
            return { success: false, message: "No rent records found for this invoice." };
        }

        // Calculate total fine
        let totalFineAmount = 0;
        for (const rent of rents) {
            const outstandingRent = parseFloat(rent.rent_amount) - parseFloat(rent.paid_amount);
            if (outstandingRent > 0) {
                const fineAmount = outstandingRent * 0.30;
                totalFineAmount += fineAmount;
                console.log(`➕ Fine from rent ID ${rent.rent_id}: ${fineAmount.toFixed(2)}`);
            }
        }

        if (totalFineAmount === 0) {
            console.log(`💤 No outstanding rent found for invoice #${invoiceId}`);
            await t.rollback();
            return { success: false, message: "No outstanding rent to apply a fine." };
        }

        // Create fine
        await Fine.create({
            invoice_id: invoiceId,
            shop_id: shopId,
            fine_amount: totalFineAmount.toFixed(2),
            status: 'Unpaid'
        }, { transaction: t });

        // Audit log
        await AuditTrail.create({
            shop_id: shopId,
            event_type: 'Fine Applied',
            event_description: `A fine of ${totalFineAmount.toFixed(2)} was applied to Invoice ID ${invoiceId}.`,
            user_actioned: 'System'
        }, { transaction: t });

        await t.commit();
        console.log(`✅ Fine of ${totalFineAmount.toFixed(2)} applied successfully to invoice #${invoiceId}`);
        return {
            success: true,
            message: `Fine of ${totalFineAmount.toFixed(2)} applied successfully.`,
            fineAmount: totalFineAmount.toFixed(2)
        };

    } catch (error) {
        await t.rollback();
        console.error(`❌ Error applying fine to invoice #${invoiceId}:`, error);
        return { success: false, message: error.message };
    }
}

module.exports = { applyFine };
