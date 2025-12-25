import React from "react";

const InvoiceDetails = ({ invoice, previousInvoice }) => {
    // Get the fine paid from the previous invoice
    const previousFinePaid = previousInvoice?.Fines?.reduce(
        (sum, fine) => sum + parseFloat(fine.paid_amount || 0),
        0
    ) || 0;

    // Calculate total paid amount (including previous month's fine paid)
    const totalPaid = (
        (invoice.Fines?.reduce((sum, fine) => sum + parseFloat(fine.paid_amount || 0), 0) +
        invoice.Rents?.reduce((sum, rent) => sum + parseFloat(rent.paid_amount || 0), 0) +
        invoice.VATs?.reduce((sum, vat) => sum + parseFloat(vat.paid_amount || 0), 0) +
        invoice.OperationFees?.reduce((sum, fee) => sum + parseFloat(fee.paid_amount || 0), 0)) || 0
    ) + previousFinePaid; // Add fine paid from the previous month

    const remainingAmount = parseFloat(invoice.total_amount) - totalPaid;

    return (
        <div className="border-b pb-4 mb-4 bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Invoice ID: {invoice.invoice_id}</h3>
            <p><strong>Month:</strong> {new Date(invoice.month_year).toLocaleDateString()}</p>
            <p><strong>Previous Balance:</strong> LKR {invoice.previous_balance}</p>
            <p><strong>Previous Month's Unpaid Fine:</strong> LKR {invoice.fines}</p>
            <p><strong>Previous Month Fine:</strong> LKR {invoice.previous_fines}</p>
            <p><strong>Rent Amount:</strong> LKR {invoice.rent_amount}</p>
            <p><strong>Operation Fee:</strong> LKR {invoice.operation_fee}</p>
            <p><strong>VAT Amount:</strong> LKR {invoice.vat_amount}</p>
            <p><strong>Total Arrears:</strong> LKR {invoice.total_arrears}</p>
            <p><strong>Total Amount:</strong> LKR {invoice.total_amount}</p>
            <p><strong>Total Paid:</strong> LKR {totalPaid.toFixed(2)}</p>
            <p><strong>Remaining Amount:</strong> LKR {remainingAmount.toFixed(2)}</p>
            <p><strong>Status:</strong> {invoice.status}</p>

            {/* Show Fines from Foreign Fine Table */}
            <h4 className="font-semibold mt-2 text-red-600">Invoice Fines</h4>
            {invoice.Fines?.length > 0 ? (
                invoice.Fines.map((fine, i) => (
                    <div key={i} className="text-gray-700">
                        <p><strong>Fine Amount:</strong> LKR {fine.fine_amount}</p>
                        <p><strong>Paid Amount:</strong> LKR {fine.paid_amount}</p>
                        <p><strong>Status:</strong> {fine.status}</p>
                    </div>
                ))
            ) : (
                <p>No fines for this invoice.</p>
            )}

            {/* Breakdown */}
            <h4 className="font-semibold mt-2">Breakdown:</h4>
            <ul className="list-disc pl-5">
                {invoice.OperationFees.map((fee, i) => (
                    <li key={i}>Operation Fee Paid: LKR {fee.paid_amount} - {fee.status}</li>
                ))}
                {invoice.VATs.map((vat, i) => (
                    <li key={i}>VAT Paid: LKR {vat.paid_amount} - {vat.status}</li>
                ))}
                {invoice.Rents.map((rent, i) => (
                    <li key={i}>Rent Paid: LKR {rent.paid_amount} - {rent.status} - {rent.paid_date}</li>
                ))}
            </ul>
        </div>
    );
};

export default InvoiceDetails;
