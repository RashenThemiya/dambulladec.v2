const dayjs = require('dayjs');
const Fine = require('../models/Fine');
const Rent = require('../models/Rent');
const AuditTrail = require('../models/AuditTrail');

async function adjustFineBasedOnPaymentDate(invoice, paymentTimestamp, shopBalance, adminName, transaction) {
    const invoiceMonth16th = dayjs(invoice.month_year).date(16);
    console.log("Invoice Month 16th:", invoiceMonth16th.format('YYYY-MM-DD'));
    const isBeforeOrOn15th = dayjs(paymentTimestamp).isBefore(invoiceMonth16th, 'day');
    console.log("Is payment before or on 15th:", isBeforeOrOn15th);
    const fine = await Fine.findOne({ where: { invoice_id: invoice.invoice_id }, transaction });

    if (fine) {
        if (isBeforeOrOn15th) {
            const refundAmount = parseFloat(fine.paid_amount || 0);
            shopBalance.balance_amount = parseFloat(shopBalance.balance_amount) + refundAmount;
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
        }
    } else {
        if (!isBeforeOrOn15th) {
            const rent = await Rent.findOne({ where: { invoice_id: invoice.invoice_id }, transaction });
            if (rent) {
                const unpaidRent = parseFloat(rent.rent_amount || 0) - parseFloat(rent.paid_amount || 0);
                if (unpaidRent > 0) {
                    const fineAmount = parseFloat((unpaidRent * 0.30).toFixed(2));
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
  
