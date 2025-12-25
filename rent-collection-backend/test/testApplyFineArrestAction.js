const { applyFineArrestAction } = require('../utils/applyFineArrestAction'); // Update with correct path
const sequelize = require("../config/database"); 
async function testApplyFineArrestAction() {
    console.log("Running test for applyFineArrestAction...\n");

    try {
        const result = await applyFineArrestAction();
        console.log("✅ Test Result:", result);
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

// Run the test
testApplyFineArrestAction();
