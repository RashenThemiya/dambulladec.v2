const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Rent = require('../models/Rent');
const Fine = require('../models/Fine');
const OperationFee = require('../models/OperationFee');
const VAT = require('../models/VAT');
const ShopBalance = require('../models/ShopBalance');
const { getPaymentsByShopAndInvoice } = require('../utils/reportUtils');

router.get('/monthly-income', async (req, res) => {
  try {
    let { month, year } = req.query;
    let selectedMonth, selectedYear, selectedMonthYear;

    if (!month || !year) {
      const latestInvoice = await Invoice.findOne({ order: [['month_year', 'DESC']] });
      if (!latestInvoice) return res.status(404).send('No invoices found.');
      selectedMonthYear = new Date(latestInvoice.month_year);
      selectedMonth = selectedMonthYear.getMonth() + 1;
      selectedYear = selectedMonthYear.getFullYear();
    } else {
      selectedMonth = parseInt(month);
      selectedYear = parseInt(year);

      if (isNaN(selectedMonth) || isNaN(selectedYear) || selectedMonth < 1 || selectedMonth > 12) {
        return res.status(400).json({ success: false, message: 'Invalid month or year provided.' });
      }

      selectedMonthYear = new Date(selectedYear, selectedMonth - 1);
    }

    const startOfPeriod = new Date(selectedYear, selectedMonth - 1, 1);
    const endOfPeriod = new Date(selectedYear, selectedMonth, 0);
    const latestMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    const invoices = await Invoice.findAll({
      where: { month_year: { [Op.between]: [startOfPeriod, endOfPeriod] } },
      order: [['shop_id', 'ASC'], ['createdAt', 'ASC']],
    });

    const allPayments = await Payment.findAll({ attributes: ['shop_id', 'payment_date', 'amount_paid'], raw: true });
    const shopBalances = await ShopBalance.findAll({ attributes: ['shop_id', 'balance_amount'], raw: true });

    const balanceByShop = shopBalances.reduce((map, sb) => {
      map[sb.shop_id] = parseFloat(sb.balance_amount);
      return map;
    }, {});

    const [rentMap, rentCross] = await getPaymentsByShopAndInvoice(Rent, startOfPeriod, endOfPeriod, selectedMonthYear);
    const [fineMap, fineCross] = await getPaymentsByShopAndInvoice(Fine, startOfPeriod, endOfPeriod, selectedMonthYear);
    const [opMap, opCross] = await getPaymentsByShopAndInvoice(OperationFee, startOfPeriod, endOfPeriod, selectedMonthYear);
    const [vatMap, vatCross] = await getPaymentsByShopAndInvoice(VAT, startOfPeriod, endOfPeriod, selectedMonthYear);
    const finesThisMonth = await Fine.findAll({
      where: {
        invoice_id: { [Op.in]: invoices.map(inv => inv.invoice_id) }
      },
      attributes: ['invoice_id', 'fine_amount'],
      raw: true,
    });
    
    const fineByInvoiceId = finesThisMonth.reduce((map, fine) => {
      map[fine.invoice_id] = parseFloat(fine.fine_amount || 0);
      return map;
    }, {});
    
    const invoiceMapByShop = {};
    invoices.forEach(inv => {
      if (!invoiceMapByShop[inv.shop_id]) invoiceMapByShop[inv.shop_id] = [];
      invoiceMapByShop[inv.shop_id].push(inv);
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Monthly Income');

    sheet.columns = [
      { header: 'Shop ID', key: 'shop_id' },
      { header: 'Month', key: 'month' },
      { header: 'Total Paid', key: 'total_paid' },
      { header: 'Shop Balance', key: 'shop_balance' },
    ];

    const totals = {
      shop_balance: 0,
      total_paid: 0,
    };

    for (const inv of invoices) {
      const shop_id = inv.shop_id;
      const shopInvoices = invoiceMapByShop[shop_id] || [];
      const currentIndex = shopInvoices.findIndex(i => i.invoice_id === inv.invoice_id);
      const nextInvoice = shopInvoices[currentIndex + 1];
      const invStart = new Date(inv.createdAt).getTime();
      const invEnd = nextInvoice ? new Date(nextInvoice.createdAt).getTime() : Date.now();
      const fineThisInvoice =  parseFloat(fineByInvoiceId[inv.invoice_id] || 0);
      console.log("Fine for this invoice:", fineThisInvoice);

      const paidForThisInvoice = allPayments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          const paymentTime = paymentDate.getTime();
      
          const isSameMonth =
            paymentDate.getFullYear() === selectedYear &&
            paymentDate.getMonth() + 1 === selectedMonth;
      
          const isSameShop = payment.shop_id.toLowerCase() === shop_id.toLowerCase();
      
          const isInInvoiceRange = paymentTime >= invStart && paymentTime < invEnd;
      
          return isSameMonth && isSameShop && isInInvoiceRange;
        })
        .reduce((sum, payment) => sum + parseFloat(payment.amount_paid || 0), 0);
      
      console.log("Paid for this invoice:", paidForThisInvoice);

      let prevBalance = parseFloat(inv.previous_balance);

      let remaining = parseFloat(inv.total_amount) - paidForThisInvoice;
      remaining = Math.max(remaining, 0);
      const shop_balance = Math.max(0, balanceByShop[shop_id] || 0);

      let adjusted_arrears = parseFloat(inv.total_arrears);
      let other_arrears_paid = 0;
      let effective_shop_balance = shop_balance;

      if (prevBalance < 0) {
        prevBalance = Math.abs(prevBalance);
        adjusted_arrears += prevBalance;
        if (effective_shop_balance > 0) {
          effective_shop_balance = 0;
        }

        let s_balance = Math.abs(effective_shop_balance);
        other_arrears_paid = Math.max(prevBalance - s_balance, 0);
      }

      const absPreviousBalance = Math.max(0, parseFloat(inv.previous_balance));

      sheet.addRow({
        shop_id,
        month: latestMonthStr,
        total_paid: paidForThisInvoice,
        shop_balance,
      });
      
      totals.shop_balance += shop_balance;
      totals.total_paid += paidForThisInvoice;
    }

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const totalRow = sheet.addRow({
      shop_id: 'Total',
      shop_balance: totals.shop_balance,
      total_paid: totals.total_paid,
    });

    totalRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    sheet.columns.forEach(column => {
      column.width = Math.max(15, column.header.length + 5);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Monthly_Income_Report_${latestMonthStr}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating report');
  }
});

module.exports = router;
