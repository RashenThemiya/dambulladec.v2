const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Invoice = require('../models/Invoice');
const Rent = require('../models/Rent');
const Fine = require('../models/Fine');
const ShopBalance = require('../models/ShopBalance');
const AuditTrail = require('../models/AuditTrail');
const Payment = require('../models/Payment');
const dayjs = require('dayjs');
const { runInvoicePaymentProcessWithoutAddingToShopBalance } = require('../utils/processPayment');

async function handlePaymentCorrection({
    invoice_id = null,
    shop_id,
    actual_amount,
    admin_put_amount,
    edit_reason = null,
    admin_email = 'Admin',
    payment_date = new Date(),
}) {
    const t = await sequelize.transaction();
    let newShopBalance = null;

    try {
        const actualAmount = isNaN(parseFloat(actual_amount)) ? 0 : parseFloat(actual_amount);
        const adminPutAmount = isNaN(parseFloat(admin_put_amount)) ? 0 : parseFloat(admin_put_amount);
        const missed_amount = actualAmount - adminPutAmount;

        let shopBalance = await ShopBalance.findOne({ where: { shop_id }, transaction: t });
        if (!shopBalance) {
            shopBalance = await ShopBalance.create({ shop_id, balance_amount: 0, last_updated: new Date() }, { transaction: t });
        }

        shopBalance.balance_amount = parseFloat(shopBalance.balance_amount) || 0;
        const oldBalance = shopBalance.balance_amount;

        if (invoice_id) {
            const invoice = await Invoice.findOne({ where: { invoice_id }, transaction: t });
            if (!invoice) throw new Error('Invoice not found');

            const rent = await Rent.findOne({ where: { invoice_id }, transaction: t });
            if (!rent) throw new Error('Associated Rent not found');

            if (missed_amount > 0) {
                const fine = await Fine.findOne({ where: { invoice_id }, transaction: t });
                if (fine) {
                    if (fine.status === 'Paid' || fine.status === 'Partially Paid') {
                        shopBalance.balance_amount += parseFloat(fine.paid_amount) || 0;

                        await AuditTrail.create({
                            shop_id,
                            invoice_id,
                            event_type: 'Correction',
                            event_description: `Refunded fine of ${fine.amount} due to overpayment correction.`,
                            old_value: fine.amount,
                            new_value: 0,
                            edit_reason,
                            user_actioned: admin_email,
                        }, { transaction: t });
                    }

                    await Fine.destroy({ where: { invoice_id }, transaction: t });
                }

                shopBalance.balance_amount += missed_amount;
                await shopBalance.save({ transaction: t });

                await Payment.create({
                    shop_id,
                    invoice_id,
                    amount_paid: missed_amount,
                    payment_date: payment_date,
                    payment_method: 'Correction Made',
                }, { transaction: t });

            } else if (missed_amount < 0) {
                const invoiceAge = dayjs().diff(dayjs(invoice.createdAt), 'day');
                if (invoice.status !== 'Paid' && invoiceAge > 15) {
                    const unpaidAmount = parseFloat(rent.amount) - parseFloat(rent.paid_amount);
                    const fineAmount = unpaidAmount * 0.30;
                    await Fine.create({ invoice_id, shop_id, amount: fineAmount, status: 'Unpaid' }, { transaction: t });
                }

                shopBalance.balance_amount += missed_amount;
                await shopBalance.save({ transaction: t });

                await Payment.create({
                    shop_id,
                    invoice_id,
                    amount_paid: missed_amount,
                    payment_date: payment_date,
                    payment_method: 'Correction Made',
                }, { transaction: t });
            }

        } else {
            shopBalance.balance_amount += missed_amount;

            await Payment.create({
                shop_id,
                amount_paid: missed_amount,
                payment_date: payment_date,
                payment_method: 'Correction Made',
            }, { transaction: t });
        }

        shopBalance.balance_amount = parseFloat(shopBalance.balance_amount.toFixed(2));
        shopBalance.last_updated = new Date();
        await shopBalance.save({ transaction: t });

        newShopBalance = await ShopBalance.findOne({ where: { shop_id }, transaction: t });

        await AuditTrail.create({
            shop_id,
            invoice_id,
            event_type: 'Correction',
            event_description: `Corrected payment: actual=${actualAmount}, admin_put=${adminPutAmount}, difference=${missed_amount}`,
            old_value: oldBalance,
            new_value: newShopBalance ? newShopBalance.balance_amount : null,
            edit_reason,
            user_actioned: admin_email,
        }, { transaction: t });

        await t.commit();
    } catch (error) {
        await t.rollback();
        console.error('❌ Payment Correction Error:', error);
        return { success: false, message: error.message };
    }

    if (newShopBalance.balance_amount > 0) {
        await runInvoicePaymentProcessWithoutAddingToShopBalance(shop_id);
    }

    return { success: true, message: 'Payment correction applied successfully' };
}

module.exports = { handlePaymentCorrection };
