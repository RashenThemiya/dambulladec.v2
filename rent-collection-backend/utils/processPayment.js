const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Payment = require('../models/Payment');
const ShopBalance = require('../models/ShopBalance');
const Invoice = require('../models/Invoice');
const Rent = require('../models/Rent');
const OperationFee = require('../models/OperationFee');
const Fine = require('../models/Fine');
const AuditTrail = require('../models/AuditTrail');
const Vat = require('../models/VAT');
const { adjustFineBasedOnPaymentDate } = require('./fineajest'); // or wherever the function is

// Entry point with shop ID
async function processPaymentByShopId(shopId, amountPaid, paymentMethod, paymentDate, adminName) {
    return processPayment(shopId, amountPaid, paymentMethod, paymentDate, adminName, null);
}

// Entry point with invoice ID
async function processPaymentByInvoiceId(invoiceId, amountPaid, paymentMethod, paymentDate, adminName) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
        return { success: false, message: 'Invoice not found' };
    }
    return processPayment(invoice.shop_id, amountPaid, paymentMethod, paymentDate, adminName, invoiceId);
}

// Main payment processor
async function processPayment(shopId, amountPaid, paymentMethod, paymentDate = null, adminName = 'System', invoiceId = null) {
    const t = await sequelize.transaction();
    try {
        amountPaid = parseFloat(amountPaid);
        if (isNaN(amountPaid) || amountPaid <= 0) {
            throw new Error("Invalid payment amount.");
        }

        const paymentTimestamp = paymentDate ? new Date(paymentDate) : new Date();

        // Create Payment Record
        const payment = await Payment.create({
            shop_id: shopId,
            amount_paid: amountPaid.toFixed(2),
            payment_date: paymentTimestamp,
            payment_method: paymentMethod,
            invoice_id: invoiceId
        }, { transaction: t });

        // Update or Create Shop Balance
        let shopBalance = await ShopBalance.findByPk(shopId, { transaction: t });
        if (!shopBalance) {
            shopBalance = await ShopBalance.create({
                shop_id: shopId,
                balance_amount: amountPaid.toFixed(2),
                last_updated: paymentTimestamp
            }, { transaction: t });
        } else {
            shopBalance.balance_amount = parseFloat(shopBalance.balance_amount) + amountPaid;
            shopBalance.balance_amount = parseFloat(shopBalance.balance_amount.toFixed(2));
            shopBalance.last_updated = paymentTimestamp;
            await shopBalance.save({ transaction: t });
        }

        // Add Audit Trail Entry
        await AuditTrail.create({
            shop_id: shopId,
            event_type: 'Payment Made',
            event_description: `Payment of ${amountPaid.toFixed(2)} received via ${paymentMethod}`,
            user_actioned: adminName
        }, { transaction: t });

        // Fetch invoices that need payment
        let invoices;
        if (false) { // Placeholder logic
            invoices = await Invoice.findAll({ where: { invoice_id: invoiceId }, transaction: t });
        } else {
            invoices = await Invoice.findAll({
                where: {
                    shop_id: shopId,
                    status: ['Arrest', 'Unpaid', 'Partially Paid']
                },
                order: [['createdAt', 'ASC'],['status', 'ASC']],
                transaction: t
            });
        }

        // Process payments for each invoice
        let remainingBalance = shopBalance.balance_amount;
        for (const invoice of invoices) {
            if (remainingBalance <= 0) break;
        
            // 🔁 Adjust fine based on payment date before processing payment
            shopBalance = await adjustFineBasedOnPaymentDate(invoice, paymentTimestamp, shopBalance, adminName, t);
        
            // 💵 Then process invoice payments
            remainingBalance = await processInvoicePayments(invoice, remainingBalance, t, paymentTimestamp);
        }
        

        // Update Shop Balance
        shopBalance.balance_amount = remainingBalance;
        shopBalance.last_updated = paymentTimestamp;
        await shopBalance.save({ transaction: t });

        await t.commit();
        return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
        await t.rollback();
        console.error('❌ Payment Processing Error:', error);
        return { success: false, message: 'Payment processing failed' };
    }
}

// Process individual invoice components (rent, VAT, etc.)
async function processInvoicePayments(invoice, remainingBalance, t, paymentTimestamp) {
  

    for (const model of [Vat, OperationFee, Rent, Fine]) {
        const records = await model.findAll({
            where: {
                invoice_id: invoice.invoice_id,
                status: { [Sequelize.Op.in]: ['Unpaid', 'Partially Paid', 'Arrest'] }
            },
            transaction: t
        });

        if (records.length === 0) continue;

        for (const record of records) {
            if (remainingBalance <= 0) break;

            let totalField;

                if (model === Vat) totalField = 'vat_amount';
                else if (model === OperationFee) totalField = 'operation_amount';
                else if (model === Rent) totalField = 'rent_amount';
                else if (model === Fine) totalField = 'fine_amount';
                else totalField = 'amount'; // fallback if you add new types
                const totalAmount = parseFloat(record[totalField]);
                const dueAmount = parseFloat(record[totalField]) - parseFloat(record.paid_amount);

            const payment = Math.min(remainingBalance, dueAmount);

            record.paid_amount = parseFloat(record.paid_amount) + payment;
            record.paid_amount = parseFloat(record.paid_amount.toFixed(2));
            remainingBalance -= payment;
            const dueAfter = parseFloat((totalAmount - record.paid_amount).toFixed(2));
            // Update record status
            if (Math.abs(dueAfter) < 0.01)  {
                record.status = 'Paid';
            } else {
                record.status = 'Partially Paid';
                allPaid = false;
                hasUnpaidOrPartial = true;
            }

            record.paid_date = paymentTimestamp;
            await record.save({ transaction: t });
        }
    }

let totalComponents = 0;
let paidComponents = 0;
let unpaidComponents = 0;
let partiallyPaidComponents = 0;
let arrestComponents = 0;

for (const model of [Vat, OperationFee, Rent, Fine]) {
    const components = await model.findAll({
        where: { invoice_id: invoice.invoice_id },
        transaction: t
    });

    for (const component of components) {
        totalComponents++;

        switch (component.status) {
            case 'Paid':
                paidComponents++;
                break;
            case 'Partially Paid':
                partiallyPaidComponents++;
                break;
            case 'Unpaid':
                unpaidComponents++;
                break;
            case 'Arrest':
                arrestComponents++;
                break;
        }
    }
}

// 👇 Determine invoice status
if (paidComponents === totalComponents) {
    invoice.status = 'Paid';
} else if (arrestComponents === totalComponents) {
    invoice.status = 'Arrest';
} else if (unpaidComponents + arrestComponents === totalComponents) {
    invoice.status = 'Unpaid';
} else {
    invoice.status = 'Partially Paid';
}

    await invoice.save({ transaction: t });
    return remainingBalance;
}

// Utility to process unpaid invoices using existing shop balance
async function runInvoicePaymentProcessWithoutAddingToShopBalance(shopId, invoiceDate = null) {
    const t = await sequelize.transaction();
    try {
        const invoices = await Invoice.findAll({
            where: {
                shop_id: shopId,
                status: { [Sequelize.Op.in]: ['Unpaid', 'Partially Paid', 'Arrest'] }
            },
            order: [['createdAt', 'ASC']],
            transaction: t
        });

        if (!invoices.length) {
            await t.rollback();
            return { success: false, message: 'No unpaid invoices found for this shop.' };
        }

        const shopBalance = await ShopBalance.findByPk(shopId, { transaction: t });
        if (!shopBalance || shopBalance.balance_amount <= 0) {
            await t.rollback();
            return { success: false, message: 'No sufficient balance for payment processing' };
        }

        let remainingBalance = shopBalance.balance_amount;
        const usedDate = invoiceDate || new Date();  // Use provided date or current date
        for (const invoice of invoices) {
            remainingBalance = await processInvoicePayments(invoice, remainingBalance, t, usedDate);
            if (remainingBalance <= 0) break;
        }

        await shopBalance.update(
            { balance_amount: remainingBalance },
            { transaction: t }
        );

        await t.commit();
        return { success: true, message: 'Invoice payment process completed without modifying shop balance.' };
    } catch (error) {
        await t.rollback();
        console.error('❌ Invoice Payment Processing Error:', error);
        return { success: false, message: 'Invoice payment processing failed' };
    }
}

module.exports = {
    processPaymentByShopId,
    processPaymentByInvoiceId,
    processInvoicePayments,
    runInvoicePaymentProcessWithoutAddingToShopBalance
};
