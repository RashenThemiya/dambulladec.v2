const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');

// ✅ Import each model directly
const Invoice = require('../models/Invoice');
const Rent = require('../models/Rent');
const Fine = require('../models/Fine');
const OperationFee = require('../models/OperationFee');
const VAT = require('../models/VAT');
const ShopBalance = require('../models/ShopBalance');

router.get('/monthly-income', async (req, res) => {
  try {
    // 🔹 Get all invoices ordered by shop_id
    const invoices = await Invoice.findAll({
      order: [['shop_id', 'ASC'], ['createdAt', 'ASC']],
      raw: true,
    });

    if (!invoices.length) return res.status(404).send('No invoices found.');

    // 🔹 Get shop balances
    const shopBalances = await ShopBalance.findAll({
      attributes: ['shop_id', 'balance_amount'],
      raw: true,
    });

    const balanceByShop = shopBalances.reduce((map, sb) => {
      map[sb.shop_id] = parseFloat(sb.balance_amount || 0);
      return map;
    }, {});

    // 🔹 Group invoices by shop_id
    const invoiceMapByShop = {};
    invoices.forEach(inv => {
      if (!invoiceMapByShop[inv.shop_id]) invoiceMapByShop[inv.shop_id] = [];
      invoiceMapByShop[inv.shop_id].push(inv);
    });

    // 🔹 Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Arrest Report ');

    sheet.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    sheet.columns = [
      { header: 'Shop ID', key: 'shop_id' },
      { header: 'Shop Balance', key: 'previous_balance' },
      { header: 'Total Rent Remaining', key: 'rent_total_remaining' },
      { header: 'Total Operation Fee Remaining', key: 'op_total_remaining' },
      { header: 'Total VAT Remaining', key: 'vat_total_remaining' },
      { header: 'Total Fine Remaining', key: 'fine_total_remaining' },
      { header: 'Total Arrears', key: 'total_overall_arrears' },
    ];

    // 🔹 Totals tracker
    const totals = {
      previous_balance: 0,
      rent_total_remaining: 0,
      op_total_remaining: 0,
      vat_total_remaining: 0,
      fine_total_remaining: 0,
      total_overall_arrears: 0,
    };

    // 🔹 Loop each shop
    for (const [shop_id, shopInvoices] of Object.entries(invoiceMapByShop)) {
      let shopTotals = {
        rent_total_remaining: 0,
        op_total_remaining: 0,
        vat_total_remaining: 0,
        fine_total_remaining: 0,
        previous_balance: parseFloat(balanceByShop[shop_id] || 0),
      };

      // 🔹 Calculate each component
      for (const inv of shopInvoices) {
        const rentRecords = await Rent.findAll({ where: { invoice_id: inv.invoice_id }, raw: true });
        const opRecords = await OperationFee.findAll({ where: { invoice_id: inv.invoice_id }, raw: true });
        const vatRecords = await VAT.findAll({ where: { invoice_id: inv.invoice_id }, raw: true });
        const fineRecords = await Fine.findAll({ where: { invoice_id: inv.invoice_id }, raw: true });

        // ✅ Corrected field names and calculations
        shopTotals.rent_total_remaining += rentRecords.reduce(
          (sum, r) => sum + (parseFloat(r.rent_amount || 0) - parseFloat(r.paid_amount || 0)),
          0
        );

        shopTotals.op_total_remaining += opRecords.reduce(
          (sum, o) => sum + (parseFloat(o.operation_amount || 0) - parseFloat(o.paid_amount || 0)),
          0
        );

        shopTotals.vat_total_remaining += vatRecords.reduce(
          (sum, v) => sum + (parseFloat(v.vat_amount || 0) - parseFloat(v.paid_amount || 0)),
          0
        );

        shopTotals.fine_total_remaining += fineRecords.reduce(
          (sum, f) => sum + (parseFloat(f.fine_amount || 0) - parseFloat(f.paid_amount || 0)),
          0
        );
      }

 const total_overall_arrears =
  shopTotals.rent_total_remaining +
  shopTotals.op_total_remaining +
  shopTotals.vat_total_remaining +
  shopTotals.fine_total_remaining -
  (shopTotals.previous_balance > 0 ? 0 : shopTotals.previous_balance);


      // 🔹 Add row to sheet
      sheet.addRow({
        shop_id,
        previous_balance: shopTotals.previous_balance.toFixed(2),
        rent_total_remaining: shopTotals.rent_total_remaining.toFixed(2),
        op_total_remaining: shopTotals.op_total_remaining.toFixed(2),
        vat_total_remaining: shopTotals.vat_total_remaining.toFixed(2),
        fine_total_remaining: shopTotals.fine_total_remaining.toFixed(2),
        total_overall_arrears: total_overall_arrears.toFixed(2),
      });

      // 🔹 Update totals
      totals.previous_balance += shopTotals.previous_balance;
      totals.rent_total_remaining += shopTotals.rent_total_remaining;
      totals.op_total_remaining += shopTotals.op_total_remaining;
      totals.vat_total_remaining += shopTotals.vat_total_remaining;
      totals.fine_total_remaining += shopTotals.fine_total_remaining;
      totals.total_overall_arrears += total_overall_arrears;
    }

    // 🔹 Add totals row
    const totalRow = sheet.addRow({
      shop_id: 'Total',
      previous_balance: totals.previous_balance.toFixed(2),
      rent_total_remaining: totals.rent_total_remaining.toFixed(2),
      op_total_remaining: totals.op_total_remaining.toFixed(2),
      vat_total_remaining: totals.vat_total_remaining.toFixed(2),
      fine_total_remaining: totals.fine_total_remaining.toFixed(2),
      total_overall_arrears: totals.total_overall_arrears.toFixed(2),
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

    // 🔹 Style header
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    sheet.columns.forEach(column => {
      column.width = 25;
    });

    // 🔹 Return Excel file to client
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="arrest report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).send('Error generating report');
  }
});

module.exports = router;
