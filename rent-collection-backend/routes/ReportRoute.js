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
    sheet.pageSetup = {
  paperSize: 9, // 9 = A4
  orientation: 'landscape', // or 'portrait' depending on layout
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0 // 0 = use as many pages as needed vertically
};
    sheet.columns = [
      { header: 'Shop ID', key: 'shop_id' },
      { header: 'Month', key: 'month' },
      { header: 'Rent Amount', key: 'rent_amount' },
      { header: 'Operation Fee', key: 'operation_fee' },
      { header: 'VAT', key: 'vat_amount' },
      { header: 'Previous Balance', key: 'previous_balance' },
      { header: 'Previous Total Fines', key: 'fines' },
      { header: 'Fines Previous Month', key: 'previous_fines' },
      { header: 'Fine This Invoice', key: 'fine_for_this_invoice' }, // ✅ Add this
      { header: 'Total Arrears', key: 'total_arrears' },
      { header: 'Total Amount', key: 'total_amount' },
      { header: 'Total Paid', key: 'total_paid' },
      { header: 'Remaining', key: 'remaining' },
      { header: 'Extra Payment', key: 'extra_payment' }, // ✅ NEW
    /*  { header: 'Shop Balance', key: 'shop_balance' },*/
      { header: 'Rent Paid This Month', key: 'rent_paid_this_month' },
      { header: 'Fine Paid This Month', key: 'fine_paid_this_month' },
      { header: 'Operation Fee Paid This Month', key: 'operation_paid_this_month' },
      { header: 'VAT Paid This Month', key: 'vat_paid_this_month' },
     /* { header: 'Other Arrears Paid', key: 'other_arrears_paid' },*/
      { header: 'Total other months paid', key: 'total_other_months_paid' },
     /* { header: 'Other Month Rent Paid', key: 'other_rent_paid' },
      { header: 'Other Month Fine Paid', key: 'other_fine_paid' },
      { header: 'Other Month Operation Fee Paid', key: 'other_operation_paid' },
      { header: 'Other Month VAT Paid', key: 'other_vat_paid' },*/
      { header: 'Other Month Invoice IDs', key: 'other_invoice_ids' },
    ];

    const totals = {
      shop_balance: 0,
      rent_paid_this_month: 0,
      fine_paid_this_month: 0,
      operation_paid_this_month: 0,
      total_other_months_paid: 0, // ✅ NEW
      vat_paid_this_month: 0,
      other_arrears_paid: 0, // ❌ This is missing in your current snippet
      other_rent_paid: 0,
      other_fine_paid: 0,
      other_operation_paid: 0,
      other_vat_paid: 0,
      total_paid: 0,
      remaining: 0,
      extra_payment: 0,
      previous_balance:0,
      rent_amount:0,
      operation_fee:0,
      vat:0,
      total_arrears:0,
      total_amount:0,
      fines:0,
      previous_fines:0,
      fine_for_this_invoice:0,

       // ✅ Fix: add this line
    };

    for (const inv of invoices) {
      const shop_id = inv.shop_id;
      const shopInvoices = invoiceMapByShop[shop_id] || [];
      const currentIndex = shopInvoices.findIndex(i => i.invoice_id === inv.invoice_id);
      const nextInvoice = shopInvoices[currentIndex + 1];
      const invStart = new Date(inv.createdAt).getTime();
      const invEnd = nextInvoice ? new Date(nextInvoice.createdAt).getTime() : Date.now();
      const fineThisInvoice =  parseFloat(fineByInvoiceId[inv.invoice_id] || 0);
       console.log("Fine for this invoice:",fineThisInvoice);
      // Normalize both shop_ids to lower case for comparison
      const paidForThisInvoice = allPayments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          const paymentTime = paymentDate.getTime();
      
          // Check if payment is in the selected month and year
          const isSameMonth =
            paymentDate.getFullYear() === selectedYear &&
            paymentDate.getMonth() + 1 === selectedMonth;
      
          // Normalize both shop_ids to lower case for comparison
          const isSameShop = payment.shop_id.toLowerCase() === shop_id.toLowerCase();
      
          // Check if payment is within the invoice date range
          const isInInvoiceRange = paymentTime >= invStart && paymentTime < invEnd;
      
          // Return the filter criteria
          return isSameMonth && isSameShop && isInInvoiceRange;
        })
        .reduce((sum, payment) => sum + parseFloat(payment.amount_paid || 0), 0);
      
      console.log("Paid for this invoice:", paidForThisInvoice);
      
      
      let prevBalance = parseFloat(inv.previous_balance);


      let remaining = parseFloat(inv.total_amount) - paidForThisInvoice;
      remaining = Math.max(remaining, 0);
      const shop_balance = balanceByShop[shop_id] || 0;
      let adjusted_arrears = parseFloat(inv.total_arrears);

let total_other_months_paid;

      let other_arrears_paid = 0; // ✅ Declare and initialize
      let effective_shop_balance = shop_balance; // Clone before potential modification

      if (prevBalance < 0) {
        prevBalance = Math.abs(prevBalance);
        adjusted_arrears += prevBalance;
        if (effective_shop_balance > 0) {
          effective_shop_balance = 0;
        }
      
        let s_balance = Math.abs(effective_shop_balance);
        other_arrears_paid = Math.max(prevBalance - s_balance, 0);

      }
      const absPreviousBalance = Math.max(0, parseFloat(inv.previous_balance));  // Take absolute value to ensure it's positive
      // Add negative shop_balance to total arrears
let extra_payment= (paidForThisInvoice - inv.total_amount - (fineMap[shop_id]?.current || 0)) > 0
  ? (paidForThisInvoice - inv.total_amount - (fineMap[shop_id]?.current || 0)).toFixed(2)
  : 0;

let rent = parseFloat(rentMap[shop_id]?.current || 0);
let fine = parseFloat(fineMap[shop_id]?.current || 0);
let op = parseFloat(opMap[shop_id]?.current || 0);
let vat = parseFloat(vatMap[shop_id]?.current || 0);
let paid = parseFloat(paidForThisInvoice);
let prevBalanced = parseFloat(absPreviousBalance);
let extra = parseFloat(extra_payment);

 total_other_months_paid = paid - rent - fine - op - vat + prevBalanced - extra;
total_other_months_paid = parseFloat(total_other_months_paid.toFixed(2));


      sheet.addRow({
        shop_id,
        month: latestMonthStr,
        rent_amount: inv.rent_amount,
        operation_fee: inv.operation_fee,
        vat_amount: inv.vat_amount,
        previous_balance: absPreviousBalance,
        fines: inv.fines,
        previous_fines: inv.previous_fines,
        fine_for_this_invoice:fineThisInvoice,
        total_arrears: adjusted_arrears,
        total_amount: inv.total_amount,
        total_paid: paidForThisInvoice,
        remaining,
              extra_payment:  extra_payment,
        /*shop_balance,*/
        rent_paid_this_month: rentMap[shop_id]?.current || 0,
        fine_paid_this_month: fineMap[shop_id]?.current || 0,
        operation_paid_this_month: opMap[shop_id]?.current || 0,
        vat_paid_this_month: vatMap[shop_id]?.current || 0,
  
    /*    other_arrears_paid,*/
        total_other_months_paid: total_other_months_paid || 0, // ✅ NEW
      /*  other_rent_paid: rentMap[shop_id]?.other || 0,
        other_fine_paid: fineMap[shop_id]?.other || 0,
        other_operation_paid: opMap[shop_id]?.other || 0,
        other_vat_paid: vatMap[shop_id]?.other || 0,*/
        other_invoice_ids: [
          ...(rentCross[shop_id] || []),
          ...(fineCross[shop_id] || []),
          ...(opCross[shop_id] || []),
          ...(vatCross[shop_id] || []),
        ].join(', '),
      });
      totals.previous_balance += absPreviousBalance; // Add to the totals
     /* totals.shop_balance += shop_balance;*/
      totals.rent_paid_this_month += rentMap[shop_id]?.current || 0;
      totals.fine_paid_this_month += fineMap[shop_id]?.current || 0;
      totals.operation_paid_this_month += opMap[shop_id]?.current || 0;
      totals.vat_paid_this_month += vatMap[shop_id]?.current || 0;
      totals.other_arrears_paid += other_arrears_paid;
      const extraPayment = (paidForThisInvoice - inv.total_amount - (fineMap[shop_id]?.current || 0));
      totals.extra_payment += extraPayment > 0 ? extraPayment : 0;
      totals.total_other_months_paid += total_other_months_paid || 0;
   /*   totals.other_rent_paid += rentMap[shop_id]?.other || 0;
      totals.other_fine_paid += fineMap[shop_id]?.other || 0;
      totals.other_operation_paid += opMap[shop_id]?.other || 0;
      totals.other_vat_paid += vatMap[shop_id]?.other || 0;*/
      totals.total_paid += paidForThisInvoice;
      totals.remaining += remaining;
      totals.rent_amount += parseFloat(inv.rent_amount);
      totals.operation_fee += parseFloat(inv.operation_fee);
      totals.vat += parseFloat(inv.vat_amount);
    /*  totals.total_arrears += adjusted_arrears;*/
      totals.total_amount += parseFloat(inv.total_amount);
      totals.fines += parseFloat(inv.fines);
      totals.previous_fines += parseFloat(inv.previous_fines);
      totals.fine_for_this_invoice += fineThisInvoice;
    }

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const totalRow = sheet.addRow({
      shop_id: 'Total',
      previous_balance: totals.previous_balance,
      rent_paid_this_month: totals.rent_paid_this_month,
      fine_paid_this_month: totals.fine_paid_this_month,
      operation_paid_this_month: totals.operation_paid_this_month,
      vat_paid_this_month: totals.vat_paid_this_month,
      other_arrears_paid: totals.other_arrears_paid || 0,
      extra_payment: totals.extra_payment.toFixed(2),
      total_other_months_paid: totals.total_other_months_paid || 0, // ✅ NEW
// ✅ NEW // ✅ NEW
      other_rent_paid: totals.other_rent_paid,
      other_fine_paid: totals.other_fine_paid,
      other_operation_paid: totals.other_operation_paid,
      other_vat_paid: totals.other_vat_paid,
      /*shop_balance: totals.shop_balance,*/
      total_paid: totals.total_paid,
      remaining: totals.remaining,
      rent_amount: totals.rent_amount,
      operation_fee: totals.operation_fee,
      vat_amount: totals.vat,
      total_arrears: totals.total_arrears,
      total_amount: totals.total_amount,
      fines: totals.fines,
      previous_fines: totals.previous_fines,
      fine_for_this_invoice: totals.fine_for_this_invoice || 0,

    });
sheet.getRow(1).font = { bold: true, size: 10 };

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

    const proofStartRow = sheet.rowCount + 2;
    sheet.mergeCells(`A${proofStartRow}:H${proofStartRow}`);
    sheet.getCell(`A${proofStartRow}`).value = 'Mathematical Proof of Total Paid Calculation';
    sheet.getCell(`A${proofStartRow}`).font = { bold: true, size: 14 };
    sheet.getCell(`A${proofStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };

    const formulaRow = proofStartRow + 1;
    const valueRow = proofStartRow + 2;
    const resultRow = proofStartRow + 3;
    sheet.getCell(`A${formulaRow}`).value =
    'Total Paid = Rent Paid (Current) + Fine Paid (Current) + Operation Fee Paid (Current) + VAT Paid (Current) + Other month Paid + Extra Payment - previous balance';

    sheet.getCell(`A${valueRow}`).value =
    `Total Paid = ${totals.rent_paid_this_month.toFixed(2)} + ${totals.fine_paid_this_month.toFixed(2)} + ${totals.operation_paid_this_month.toFixed(2)} + ${totals.vat_paid_this_month.toFixed(2)} + ${totals.total_other_months_paid}  + ${totals.extra_payment.toFixed(2)} - ${totals.previous_balance.toFixed(2)}`;
  
  const totalPaidFinal = 
  totals.rent_paid_this_month +
  totals.fine_paid_this_month +
  totals.operation_paid_this_month +
  totals.vat_paid_this_month +
  totals.total_other_months_paid +
  totals.extra_payment - totals.previous_balance;

    
    sheet.mergeCells(`A${resultRow}:H${resultRow}`);
    sheet.getCell(`A${resultRow}`).value = `Total Paid = ${totalPaidFinal.toFixed(2)}`;
    sheet.getCell(`A${resultRow}`).font = { bold: true, size: 12 };

    for (let i = proofStartRow; i <= resultRow; i++) {
      sheet.getRow(i).eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Monthly_full_Report_${latestMonthStr}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating report');
  }
});

module.exports = router;
