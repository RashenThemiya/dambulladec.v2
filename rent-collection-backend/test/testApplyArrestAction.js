const { applyArrestAction } = require('../utils/applyArrestAction');

async function testApplyArrestAction() {
    try {
        const result = await applyArrestAction();
        console.log("✅ Test Result:", result);
    } catch (error) {
        console.error("❌ Test Error:", error);
    }
}

// Run the test function
testApplyArrestAction();
