const { applyFineToAllInvoices } = require("../utils/applyFineToAllInvoices"); // Adjust the path accordingly

async function testApplyFine() {
    console.log("🚀 Running Fine Application Test...");

    try {
        const result = await applyFineToAllInvoices();
        console.log("✅ Test Result:", result);
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

// Run the test function
testApplyFine();
