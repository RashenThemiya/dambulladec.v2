function calculateDues(records, amountField) {
  let totalArrest = 0;
  let totalPartPaid = 0;
  let totalUnpaid = 0;
  let totalAmount = 0;

  // Loop through each record
  for (const record of records) {
      let dueAmount = parseFloat(record[amountField]) - parseFloat(record.paid_amount);
      
      // Check status and add accordingly
      if (record.status === 'Arrest') {
          totalArrest += dueAmount;
      } 
      if (record.status === 'Partially Paid') {
          totalPartPaid += dueAmount;
      }
      if (record.status === 'Unpaid') {
          totalUnpaid += dueAmount;
      }

      totalAmount += dueAmount; // Sum up all dues
  }

  return { totalArrest, totalPartPaid, totalUnpaid, totalAmount };
}

module.exports = { calculateDues };
