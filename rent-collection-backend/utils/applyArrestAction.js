const { Sequelize } = require('sequelize');
const Invoice = require('../models/Invoice');
const Rent = require('../models/Rent');
const Fine = require('../models/Fine');
const OperationFee = require('../models/OperationFee');
const Vat = require('../models/VAT'); // Corrected VAT import
const AuditTrail = require('../models/AuditTrail');
const sequelize = require('../config/database');
const dayjs = require('dayjs');

/**
 * Apply Arrest Action to overdue invoices and related entities.
 * @returns {object} - Success or failure response.
 */
async function applyArrestAction() {
    const t = await sequelize.transaction();
    try {
        // Get current date and calculate the threshold (30/31 days ago)
        const thresholdDate = dayjs().subtract(30, 'days').toDate();

        // Fetch invoices that are "Unpaid" or "Partially Paid" and older than 30/31 days
        const overdueInvoices = await Invoice.findAll({
            where: {
                status: { [Sequelize.Op.in]: ['Unpaid', 'Partially Paid'] },
                createdAt: { [Sequelize.Op.lte]: thresholdDate } // Older than 30/31 days
            },
            transaction: t
        });

        if (overdueInvoices.length === 0) {
            await t.commit();
            return { success: false, message: "No overdue invoices found for Arrest Action." };
        }

        let totalArrestedInvoices = 0;

        for (const invoice of overdueInvoices) {
            const invoiceId = invoice.invoice_id;
            const shopId = invoice.shop_id;

            // Update invoice status to "Arrest"
            await invoice.update({ status: 'Arrest' }, { transaction: t });

            // Define entities to update
            const entitiesToUpdate = [
                { model: Rent, name: "Rent" },
                { model: OperationFee, name: "Operation Fee" },
                { model: Vat, name: "VAT" }
            ];

            // Update Rent, Operation Fee, and VAT status if "Unpaid" or "Partially Paid"
            for (const entity of entitiesToUpdate) {
                await entity.model.update(
                    { status: 'Arrest' },
                    { where: { invoice_id: invoiceId, status: { [Sequelize.Op.in]: ['Unpaid', 'Partially Paid'] } }, transaction: t }
                );
            }

            // Update Fine status if it's "Unpaid" or "Partially Paid" and older than 17 days
            const fineThresholdDate = dayjs().subtract(17, 'days').toDate();
            await Fine.update(
                { status: 'Arrest' },
                { where: { 
                    invoice_id: invoiceId, 
                    status: { [Sequelize.Op.in]: ['Unpaid', 'Partially Paid'] }, 
                    createdAt: { [Sequelize.Op.lte]: fineThresholdDate } 
                }, transaction: t }
            );

            // Log the event in Audit Trail
            await AuditTrail.create({
                shop_id: shopId,
                event_type: 'Arrest Action',
                event_description: `Invoice ID ${invoiceId} and related records have been marked as Arrest due to non-payment.`,
                user_actioned: 'System'
            }, { transaction: t });

            totalArrestedInvoices++;
        }

        await t.commit();
        return { success: true, message: `${totalArrestedInvoices} invoices and related records marked as Arrest.` };
    } catch (error) {
        await t.rollback();
        console.error("❌ Arrest Action Error:", error);
        return { success: false, message: error.message };
    }
}

module.exports = { applyArrestAction };
