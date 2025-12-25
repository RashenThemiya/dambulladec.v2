const Invoice = require("../models/Invoice");
const Rent = require("../models/Rent");
const OperationFee = require("../models/OperationFee");
const Vat = require("../models/VAT");
const AuditTrail = require("../models/AuditTrail");
const Shop = require("../models/Shop");
const ShopBalance = require("../models/ShopBalance");

const Fine = require("../models/Fine");  // Add this line
const { applyFineToAllInvoices } = require('./applyFineToAllInvoices'); // Import it at the top
const { 
  runInvoicePaymentProcessWithoutAddingToShopBalance
} = require('../utils/processPayment');
const { fetchAndCalculateDues } = require("./fetchAndCalculateDues");

async function generateInvoice(shop_id, monthYear,adminName = "System") {
  try {
    const invoiceDate = new Date(`${monthYear}-01T00:00:00.000Z`);

    //  Fetch shop details
    const shop = await Shop.findOne({ where: { shop_id } });

    if (!shop) {
      throw new Error(`Shop with ID ${shop_id} not found.`);
    }

    //  Fetch and calculate dues
    const { totalArrest, totalPartPaid, totalUnpaid, totalUnpaidFine } = 
    await fetchAndCalculateDues(shop_id);

    //  Convert values to numbers
    const rentAmount = parseFloat(shop.rent_amount) || 0;
    const operationFee = parseFloat(shop.operation_fee) || 0;
    const vatRate = parseFloat(shop.vat_rate) || 0;

    //  Fetch Shop Balance for the given shop_id
    const shopBalanceRecord = await ShopBalance.findOne({ where: { shop_id } });
    const shopBalanceAmount = shopBalanceRecord ? parseFloat(shopBalanceRecord.balance_amount) : 0;

    //  VAT Calculation (Fixed)
    const vatAmount = (rentAmount + operationFee) * (vatRate / 100);

    //  Calculate final values
    const totalArrears = totalArrest + totalPartPaid + totalUnpaid;
    const fineAmount = totalUnpaidFine;
    let totalAmountToPay =
      totalArrears + rentAmount + operationFee + vatAmount + fineAmount - shopBalanceAmount;
      totalAmountToPay = Math.max(0, totalAmountToPay);
    
      const { Op } = require("sequelize");

      // Step 1: Find the latest invoice before the current one
      const previousInvoice = await Invoice.findOne({
        where: {
          shop_id,
          month_year: { [Op.lt]: monthYear }, // Get the most recent invoice before the current one
        },
        order: [["month_year", "DESC"]], // Ensure we get the latest past invoice
      });
      
      let previousFines = 0;
      
      if (previousInvoice) {
        // Step 2: Check if there are fines linked to that invoice
        const fineRecord = await Fine.findOne({
          where: { invoice_id: previousInvoice.invoice_id },
          attributes: ["fine_amount"],
          raw: true,
        });
      
        // Step 3: If fines exist, take the fine amount; otherwise, default to 0
        previousFines = fineRecord ? parseFloat(fineRecord.fine_amount) || 0 : 0;
      }
      

    //  Create invoice entry
    const invoice = await Invoice.create({
      invoice_id: `INV-${shop_id}-${monthYear.replace("-", "")}`,
      shop_id,
      month_year: monthYear,
      rent_amount: rentAmount,
      operation_fee: operationFee,
      vat_amount: vatAmount, // ✅ Fixed
      previous_balance: shopBalanceAmount, // ✅ Corrected
      fines: fineAmount,
      previous_fines: previousFines,
      total_arrears: totalArrears,
      total_amount: totalAmountToPay,
      status: "Unpaid",
      createdAt: invoiceDate,
       updatedAt: invoiceDate
    });

    //  Create linked entries in related tables
    await Rent.create({
      shop_id,
      invoice_id: invoice.invoice_id,
      rent_amount: rentAmount,
      status: "Unpaid",
      createdAt: invoiceDate,
      updatedAt: invoiceDate
    });

    await OperationFee.create({
      shop_id,
      invoice_id: invoice.invoice_id,
      operation_amount: operationFee,
      status: "Unpaid",
      createdAt: invoiceDate,
      updatedAt: invoiceDate
    });

    await Vat.create({
      shop_id,
      invoice_id: invoice.invoice_id,
      vat_amount: vatAmount,
      status: "Unpaid",
      createdAt: invoiceDate,
     updatedAt: invoiceDate
    });
   
    // 📝 Log event in audit_trail
    await AuditTrail.create({
      shop_id,
      invoice_id: invoice.invoice_id,
      event_type: "Invoice Generated",
      event_description: `Invoice ${invoice.invoice_id} generated for shop ${shop_id}`,
      user_actioned: adminName || "System",
      createdAt: invoiceDate,
      updatedAt: invoiceDate
        });

    console.log(`✅ Invoice ${invoice.invoice_id} generated successfully.`);
    if (shopBalanceAmount  > 0) {
       await runInvoicePaymentProcessWithoutAddingToShopBalance(shop_id, invoiceDate);
    }
    return invoice;

  } catch (error) {
    console.error("❌ Error generating invoice:", error);
    throw error;
  }
}

module.exports = { generateInvoice };
