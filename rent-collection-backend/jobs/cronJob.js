const cron = require("node-cron");
const { generateInvoice } = require("../utils/generateInvoice");
const { applyArrestAction } = require("../utils/applyArrestAction");
const { applyFineArrestAction } = require('../utils/applyFineArrestAction');
const { applyFineToAllInvoices } = require("../utils/applyFineToAllInvoices"); // Import fine application function
const Shop = require("../models/Shop");

// Function to run Fine Arrest Action
async function runFineArrestAction() {
  try {
    console.log("🔄 Running Fine Arrest Action job...");
    const result = await applyFineArrestAction();
    console.log("✅ Fine Arrest Action Result:", result);
  } catch (error) {
    console.error("❌ Error in Fine Arrest Action job:", error);
  }
}

// Function to generate Monthly Invoices
async function generateMonthlyInvoices() {
  try {
    console.log("🔄 Starting monthly invoice generation...");
    const today = new Date();
    const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const shops = await Shop.findAll();
    for (const shop of shops) {
      await generateInvoice(shop.shop_id, monthYear);
    }

    console.log("✅ Monthly invoices generated successfully!");
  } catch (error) {
    console.error("❌ Error in monthly invoice generation:", error);
  }
}

// Function to run Arrest Action
async function runArrestAction() {
  try {
    console.log("🔄 Running Arrest Action job...");
    const result = await applyArrestAction();
    console.log("✅ Arrest Action Result:", result);
  } catch (error) {
    console.error("❌ Error in Arrest Action job:", error);
  }
}

// Function to run fine application
async function runFineApplication() {
  try {
    console.log("🔄 Running fine application job...");
    const result = await applyFineToAllInvoices();
    console.log("✅ Fine application result:", result);
  } catch (error) {
    console.error("❌ Error in fine application job:", error);
  }
}

// Schedule Fine Arrest Action to run at 01:00 AM daily
/*cron.schedule("0 1 * * *", async () => {
  await runFineArrestAction();
  console.log("📆 Fine Arrest Action cron job executed.");
});*/

// Schedule invoice generation at 00:00 on the 1st day of every month
/*cron.schedule("0 0 1 * *", async () => {
  await generateMonthlyInvoices();
  console.log("📆 Monthly invoice cron job executed.");
});

// Schedule Arrest Action to run at 00:00 every day
/*cron.schedule("0 0 * * *", async () => {
  await runArrestAction();
  console.log("📆 Arrest Action cron job executed.");
});
*/
// Schedule Fine application to run at 02:00 AM daily
/*cron.schedule("0 2 * * *", async () => {
  await runFineApplication();
  console.log("📆 Fine application cron job executed.");
});*/

// Export all the functions as a single module
module.exports = { generateMonthlyInvoices, runArrestAction, runFineArrestAction, runFineApplication };
