const sequelize = require("../config/database");
const {
  processPaymentByShopId,
  processPaymentByInvoiceId,
  runInvoicePaymentProcessWithoutAddingToShopBalance,
} = require("../utils/processPayment");

const Shop = require("../models/Shop");
const Invoice = require("../models/Invoice");

async function testProcessPayment() {
  try {
    console.log('✅ Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    await sequelize.sync();

    const testData = {
      shopId: '001',
      invoiceId: 'INV-001-202504',
      amountPaid: 40,
      paymentMethod: 'Cash',
      paymentDate: new Date(), // Optional: test fixed date
      adminName: 'AdminTester' // ✅ Explicit admin name
    };

    const shopExists = await Shop.findByPk(testData.shopId);
    if (!shopExists) {
      console.warn(`⚠️ Shop ID ${testData.shopId} does not exist. Skipping test.`);
      return;
    }

    const invoiceExists = await Invoice.findByPk(testData.invoiceId);
    if (!invoiceExists) {
      console.warn(`⚠️ Invoice ID ${testData.invoiceId} does not exist. Skipping test.`);
      return;
    }

    // 👉 Test processPaymentByShopId
    console.log('\n✅ Testing processPaymentByShopId...');
    const resultShop = await processPaymentByShopId(
      testData.shopId,
      testData.amountPaid,
      testData.paymentMethod,
      testData.paymentDate,
      testData.adminName
    );
    console.table(resultShop);

    // 👉 Test processPaymentByInvoiceId
    console.log('\n✅ Testing processPaymentByInvoiceId...');
    const resultInvoice = await processPaymentByInvoiceId(
      testData.invoiceId,
      testData.amountPaid,
      testData.paymentMethod,
      testData.paymentDate,
      testData.adminName
    );
    console.table(resultInvoice);

  } catch (error) {
    console.error('❌ testProcessPayment Error:', error.message);
    console.error(error.stack);
  }
}

async function testRunInvoicePaymentProcessWithoutAddingToShopBalance() {
  try {
    const shopId = 'SHP005'; // Update with real test data

    const shopExists = await Shop.findByPk(shopId);
    if (!shopExists) {
      console.warn(`⚠️ Shop ID ${shopId} does not exist. Skipping test.`);
      return;
    }

    console.log('\n✅ Testing runInvoicePaymentProcessWithoutAddingToShopBalance...');
    const result = await runInvoicePaymentProcessWithoutAddingToShopBalance(shopId);
    console.table(result);

  } catch (error) {
    console.error('❌ testRunInvoicePaymentProcessWithoutAddingToShopBalance Error:', error.message);
    console.error(error.stack);
  }
}

(async function runTests() {
  try {
    await testProcessPayment();
    await testRunInvoicePaymentProcessWithoutAddingToShopBalance();
  } catch (error) {
    console.error('❌ Error running tests:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n✅ Database connection closed.');
  }
})();
