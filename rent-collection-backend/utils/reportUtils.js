const { Op } = require('sequelize');
const Invoice = require('../models/Invoice'); // We need Invoice here for joining

/**
 * Helper: Get payments grouped by shop and whether they belong to current invoice month or not.
 */
const getPaymentsByShopAndInvoice = async (Model, startDate, endDate, referenceMonth) => {
  const records = await Model.findAll({
    where: {
      paid_date: { [Op.between]: [startDate, endDate] },
    },
    include: {
      model: Invoice,
      attributes: ['month_year'],
    },
  });

  const result = {};
  const crossMonthInvoices = {};

  records.forEach(record => {
    const shopId = record.shop_id;
    const invoiceMonth = record.Invoice?.month_year;
    const isCurrentMonth = invoiceMonth &&
      new Date(invoiceMonth).getMonth() === referenceMonth.getMonth() &&
      new Date(invoiceMonth).getFullYear() === referenceMonth.getFullYear();

    const amount = parseFloat(record.paid_amount || 0);
    if (!result[shopId]) result[shopId] = { current: 0, other: 0 };
    if (!crossMonthInvoices[shopId]) crossMonthInvoices[shopId] = [];

    if (isCurrentMonth) {
      result[shopId].current += amount;
    } else {
      result[shopId].other += amount;
      if (record.invoice_id) crossMonthInvoices[shopId].push(record.invoice_id);
    }
  });

  return [result, crossMonthInvoices];
};

module.exports = {
  getPaymentsByShopAndInvoice,
};
