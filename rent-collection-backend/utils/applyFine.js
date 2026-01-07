const { Sequelize } = require('sequelize');
const Fine = require('../models/Fine');
const Invoice = require('../models/Invoice');
const Rent = require('../models/Rent');
const OperationFee = require('../models/OperationFee');
const VAT = require('../models/VAT');
const ShopBalance = require('../models/ShopBalance');
const AuditTrail = require('../models/AuditTrail');
const sequelize = require('../config/database');

async function applyFine(invoiceId) {
  const t = await sequelize.transaction();

  try {
    console.log(`🔍 Processing fine for invoice: ${invoiceId}`);

    // 1️⃣ Fetch invoice
    const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
    if (!invoice) throw new Error('Invoice not found');

    const shopId = invoice.shop_id;
    const isDecember = new Date(invoice.month_year).getMonth() === 11; // December = 11

    // 2️⃣ Prevent duplicate fine for the invoice
    const existingFine = await Fine.findOne({
      where: { invoice_id: invoiceId },
      transaction: t
    });

    if (existingFine) {
      await t.rollback();
      return { success: false, message: 'Fine already exists for this invoice' };
    }

    let totalFineAmount = 0;

    // =====================================================
    // 🎄 DECEMBER LOGIC — SHOP-WIDE UNPAID INCLUDING EXISTING FINES
    // =====================================================
    if (isDecember) {
      // 🔹 Shop balance
      const shopBalance = await ShopBalance.findOne({
        where: { shop_id: shopId },
        transaction: t
      });
      const balanceAmount = Number(shopBalance?.balance_amount || 0);

      let unpaidTotal = 0;

      // 🔹 All unpaid rents for the shop
      const rents = await Rent.findAll({ where: { shop_id: shopId }, transaction: t });
      rents.forEach(r => {
        unpaidTotal += Math.max(0, Number(r.rent_amount) - Number(r.paid_amount));
      });

      // 🔹 All unpaid operation fees for the shop
      const ops = await OperationFee.findAll({ where: { shop_id: shopId }, transaction: t });
      ops.forEach(o => {
        unpaidTotal += Math.max(0, Number(o.operation_amount) - Number(o.paid_amount));
      });

      // 🔹 All unpaid VAT for the shop
      const vats = await VAT.findAll({ where: { shop_id: shopId }, transaction: t });
      vats.forEach(v => {
        unpaidTotal += Math.max(0, Number(v.vat_amount) - Number(v.paid_amount));
      });

      // 🔹 All existing fines for the shop (regardless of status)
      const existingFines = await Fine.findAll({
        where: { shop_id: shopId },
        transaction: t
      });
      existingFines.forEach(f => {
        unpaidTotal += Math.max(0, Number(f.fine_amount) - Number(f.paid_amount));
      });

      // 🔥 Final outstanding calculation
      const outstanding = unpaidTotal - balanceAmount;

      if (outstanding <= 0) {
        await t.rollback();
        return { success: false, message: 'No outstanding amount for December fine' };
      }

      totalFineAmount = +(outstanding * 0.30).toFixed(2);
    } 
    // =====================================================
    // 🟢 NON-DECEMBER LOGIC — ORIGINAL PER-INVOICE FINE
    // =====================================================
    else {
      const rents = await Rent.findAll({ where: { invoice_id: invoiceId }, transaction: t });

      if (rents.length === 0) {
        await t.rollback();
        return { success: false, message: 'No rent records found' };
      }

      rents.forEach(r => {
        const outstandingRent = Number(r.rent_amount) - Number(r.paid_amount);
        if (outstandingRent > 0) totalFineAmount += outstandingRent * 0.30;
      });

      totalFineAmount = +totalFineAmount.toFixed(2);

      if (totalFineAmount === 0) {
        await t.rollback();
        return { success: false, message: 'No outstanding rent to apply a fine' };
      }
    }

    // 3️⃣ Create fine record
    await Fine.create({
      invoice_id: invoiceId,
      shop_id: shopId,
      fine_amount: totalFineAmount,
      status: 'Unpaid'
    }, { transaction: t });

    // 4️⃣ Audit log
    await AuditTrail.create({
      shop_id: shopId,
      event_type: 'Fine Applied',
      event_description: `A fine of ${totalFineAmount} was applied to Invoice ID ${invoiceId}.`,
      user_actioned: 'System'
    }, { transaction: t });

    await t.commit();
    console.log(`✅ Fine of ${totalFineAmount} applied successfully to invoice #${invoiceId}`);
    return { success: true, message: `Fine of ${totalFineAmount} applied successfully.`, fineAmount: totalFineAmount };

  } catch (error) {
    await t.rollback();
    console.error(`❌ Error applying fine to invoice #${invoiceId}:`, error);
    return { success: false, message: error.message };
  }
}

module.exports = { applyFine };
