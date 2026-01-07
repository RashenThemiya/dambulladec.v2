const dayjs = require('dayjs');
const Fine = require('../models/Fine');
const Rent = require('../models/Rent');
const OperationFee = require('../models/OperationFee');
const VAT = require('../models/VAT');
const ShopBalance = require('../models/ShopBalance');
const AuditTrail = require('../models/AuditTrail');

async function adjustFineBasedOnPaymentDate(invoice, paymentTimestamp, shopBalance, adminName, transaction) {
    const invoiceMonth16th = dayjs(invoice.month_year).date(16);
    const isBeforeOrOn15th = dayjs(paymentTimestamp).isBefore(invoiceMonth16th, 'day');
    const isDecember = dayjs(invoice.month_year).month() === 11; // December = 11

    // Fetch existing fine for this invoice
    let fine = await Fine.findOne({ where: { invoice_id: invoice.invoice_id }, transaction });

    if (isDecember) {
        // ---------------------------
        // December: calculate total unpaid including rents, operation fees, VAT, and existing fines
        // ---------------------------
        let unpaidTotal = 0;

        // Unpaid rents
        const rents = await Rent.findAll({ where: { shop_id: invoice.shop_id }, transaction });
        rents.forEach(r => {
            unpaidTotal += Math.max(0, Number(r.rent_amount) - Number(r.paid_amount));
        });

        // Unpaid operation fees
        const ops = await OperationFee.findAll({ where: { shop_id: invoice.shop_id }, transaction });
        ops.forEach(o => {
            unpaidTotal += Math.max(0, Number(o.operation_amount) - Number(o.paid_amount));
        });

        // Unpaid VAT
        const vats = await VAT.findAll({ where: { shop_id: invoice.shop_id }, transaction });
        vats.forEach(v => {
            unpaidTotal += Math.max(0, Number(v.vat_amount) - Number(v.paid_amount));
        });

        // Existing fines for the shop
        const existingFines = await Fine.findAll({ where: { shop_id: invoice.shop_id }, transaction });
        existingFines.forEach(f => {
            unpaidTotal += Math.max(0, Number(f.fine_amount) - Number(f.paid_amount));
        });

        // Adjust by shop balance
        const balanceAmount = parseFloat(shopBalance?.balance_amount || 0);
        const outstanding = unpaidTotal - balanceAmount;

        if (outstanding <= 0) {
            // Nothing to fine, remove existing fine if exists
            if (fine) {
                const refundAmount = parseFloat(fine.paid_amount || 0);
                shopBalance.balance_amount += refundAmount;
                shopBalance.balance_amount = parseFloat(shopBalance.balance_amount.toFixed(2));
                await shopBalance.save({ transaction });

                await fine.destroy({ transaction });

                await AuditTrail.create({
                    shop_id: invoice.shop_id,
                    invoice_id: invoice.invoice_id,
                    event_type: 'Correction',
                    event_description: `Existing fine of ${refundAmount.toFixed(2)} refunded because outstanding is zero.`,
                    user_actioned: adminName
                }, { transaction });
            }
            return shopBalance;
        }

        const totalFineAmount = +(outstanding * 0.30).toFixed(2);

        if (fine) {
            // Update existing fine
            fine.fine_amount = totalFineAmount;
            fine.status = 'Unpaid';
            fine.paid_amount = 0;
            await fine.save({ transaction });

            await AuditTrail.create({
                shop_id: invoice.shop_id,
                invoice_id: invoice.invoice_id,
                event_type: 'Fine Updated',
                event_description: `December fine updated to ${totalFineAmount}.`,
                user_actioned: adminName
            }, { transaction });
        } else {
            // Create new fine
            await Fine.create({
                invoice_id: invoice.invoice_id,
                shop_id: invoice.shop_id,
                fine_amount: totalFineAmount,
                status: 'Unpaid',
                paid_amount: 0
            }, { transaction });

            await AuditTrail.create({
                shop_id: invoice.shop_id,
                invoice_id: invoice.invoice_id,
                event_type: 'Fine Applied',
                event_description: `December fine of ${totalFineAmount} applied.`,
                user_actioned: adminName
            }, { transaction });
        }
    } else {
        // ---------------------------
        // Non-December logic
        // ---------------------------
        if (fine && isBeforeOrOn15th) {
            // Refund fine if payment before 16th
            const refundAmount = parseFloat(fine.paid_amount || 0);
            shopBalance.balance_amount += refundAmount;
            shopBalance.balance_amount = parseFloat(shopBalance.balance_amount.toFixed(2));
            await shopBalance.save({ transaction });

            await fine.destroy({ transaction });

            await AuditTrail.create({
                shop_id: invoice.shop_id,
                invoice_id: invoice.invoice_id,
                event_type: 'Correction',
                event_description: `Fine of ${refundAmount.toFixed(2)} refunded because payment was before 16th.`,
                user_actioned: adminName
            }, { transaction });
        } else if (!fine && !isBeforeOrOn15th) {
            // Apply fine if payment after 15th
            const rent = await Rent.findOne({ where: { invoice_id: invoice.invoice_id }, transaction });
            if (rent) {
                const unpaidRent = parseFloat(rent.rent_amount || 0) - parseFloat(rent.paid_amount || 0);
                if (unpaidRent > 0) {
                    const fineAmount = +(unpaidRent * 0.30).toFixed(2);
                    await Fine.create({
                        invoice_id: invoice.invoice_id,
                        shop_id: invoice.shop_id,
                        fine_amount: fineAmount,
                        status: 'Unpaid',
                        paid_amount: 0
                    }, { transaction });

                    await AuditTrail.create({
                        shop_id: invoice.shop_id,
                        invoice_id: invoice.invoice_id,
                        event_type: 'Fine Applied',
                        event_description: `Late payment fine of ${fineAmount} added after 15th.`,
                        user_actioned: adminName
                    }, { transaction });
                }
            }
        }
    }

    return shopBalance;
}

module.exports = {
    adjustFineBasedOnPaymentDate
};
