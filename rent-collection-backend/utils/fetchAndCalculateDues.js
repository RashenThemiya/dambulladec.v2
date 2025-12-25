const Rent = require("../models/Rent");
const OperationFee = require("../models/OperationFee");
const Vat = require("../models/VAT");
const Fine = require("../models/Fine");
const { calculateDues } = require("./calculateDues");
async function fetchAndCalculateDues(shop_id) {
    try {
        // Fetch only records belonging to the given shop_id
        const rentRecords = await Rent.findAll({ where: { shop_id } });
        const operationFees = await OperationFee.findAll({ where: { shop_id } });
        const vatRecords = await Vat.findAll({ where: { shop_id } });
        const fineRecords = await Fine.findAll({ where: { shop_id } });

        // Calculate dues using the helper function
        const rentTotals = calculateDues(rentRecords, 'rent_amount');
        const operationFeeTotals = calculateDues(operationFees, 'operation_amount');
        const vatTotals = calculateDues(vatRecords, 'vat_amount');
        const fineTotals = calculateDues(fineRecords, 'fine_amount');

        return {
            totalArrest: rentTotals.totalArrest + operationFeeTotals.totalArrest + vatTotals.totalArrest + fineTotals.totalArrest,
            totalPartPaid: rentTotals.totalPartPaid + operationFeeTotals.totalPartPaid + vatTotals.totalPartPaid,
            totalUnpaid: rentTotals.totalUnpaid + operationFeeTotals.totalUnpaid + vatTotals.totalUnpaid,
            totalUnpaidFine: fineTotals.totalPartPaid + fineTotals.totalUnpaid,
        };
    } catch (error) {
        console.error('Error fetching dues:', error);
        throw error;
    }
}

module.exports = { fetchAndCalculateDues };
