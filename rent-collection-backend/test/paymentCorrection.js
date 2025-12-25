const { handlePaymentCorrection } = require('../utils/handlePaymentCorrection'); // Adjust the path as needed

async function testHandlePaymentCorrection() {
    console.log("✅ Starting Payment Correction Tests...\n");

    // Test Case 1: Missed Payment with Invoice ID (Adds to Shop Balance)
    console.log("🔹 Test 1: Correcting missed payment with invoice_id...");
    await handlePaymentCorrection({
        invoice_id: 'INV-SHP002-202503',
        shop_id: 'SHP002',
        actual_amount: 1000,
        admin_put_amount: 0,
        edit_reason: 'Admin adjustment'
    }).then(res => console.log("✔ Test 1 Passed ✅\n", res))
      .catch(err => console.log("❌ Test 1 Failed ❌\n", err));

    // Test Case 2: Applies Fine for Unpaid Invoice Older than 17 Days
    console.log("🔹 Test 2: Applying fine for overdue unpaid invoice...");
    await handlePaymentCorrection({
        invoice_id: 'INV-SHP010-202503',
        shop_id: 'SHP010',
        actual_amount: 10000,
        admin_put_amount: 100,
        edit_reason: 'Late fine applied'
    }).then(res => console.log("✔ Test 2 Passed ✅\n", res))
      .catch(err => console.log("❌ Test 2 Failed ❌\n", err));

    // Test Case 3: Missed Payment without Invoice ID (Direct Shop Balance Update)
    console.log("🔹 Test 3: Correcting missed payment without invoice_id...");
    await handlePaymentCorrection({
        shop_id: 'SHP003',
        actual_amount: 500,
        admin_put_amount: 300,
        edit_reason: 'Manual balance correction'
    }).then(res => console.log("✔ Test 3 Passed ✅\n", res))
      .catch(err => console.log("❌ Test 3 Failed ❌\n", err));

    console.log("✅ All Tests Completed!\n");
}

// Run the test function
testHandlePaymentCorrection();
