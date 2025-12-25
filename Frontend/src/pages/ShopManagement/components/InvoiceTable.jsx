import React, { useState } from "react";

const InvoiceTable = ({ shop,payments } ) => {
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    if (!shop?.Invoices || shop.Invoices.length === 0) {
        return <p className="text-gray-500 text-center">No invoices available.</p>;
    }

    const toggleInvoiceDetails = (invoiceId) => {
        setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
    };

    // Filter invoices based on search term
    const filteredInvoices = shop.Invoices
    .filter((invoice) => 
        invoice.invoice_id.toString().includes(searchTerm) || 
        new Date(invoice.month_year).toLocaleDateString().includes(searchTerm)
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Latest invoice first
 // Sorting by create_date in descending order


    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4 text-gray-700">Invoices</h3>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by Invoice ID or Month..."
                    className="w-full p-2 border rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 bg-white">
                    {/* Table Header */}
                    <thead>
                        <tr className="bg-gray-200 text-gray-700">
                            <th className="border p-2">Invoice ID</th>
                            <th className="border p-2">Month</th>
                            <th className="border p-2">Prev Shop Balance</th>
                            <th className="border p-2">Total Fine</th>
                            <th className="border p-2">Fine (Prev)</th>
                            <th className="border p-2">Rent</th>
                            <th className="border p-2">Operation Fee</th>
                            <th className="border p-2">VAT</th>
                            <th className="border p-2">Total arrest</th>
                            <th className="border p-2">Total Amount</th>
                            <th className="border p-2">Total Paid</th>
                            <th className="border p-2">Remaining</th>
                            <th className="border p-2">Extra Payment</th>

                            <th className="border p-2">Status</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody>
                        {filteredInvoices.map((invoice, index, invoices) => {
                            const previousInvoice = index > 0 ? invoices[index - 1] : null;
                            const previousFinePaid = previousInvoice?.Fines?.reduce(
                                (sum, fine) => sum + parseFloat(fine.paid_amount || 0),
                                0
                            ) || 0;

// Define invoice period
const invoiceCreated = new Date(invoice.createdAt);
const nextInvoiceCreated = index > 0 ? new Date(invoices[index - 1].createdAt) : null;

const startOfPeriod = invoiceCreated;
const endOfPeriod = nextInvoiceCreated ? nextInvoiceCreated : new Date(); // fallback to now if it's the latest invoice

                                // Filter payments made within the invoice month
                                const invoicePayments = payments?.filter(payment => {
                                    const paymentDate = new Date(payment.payment_date);
                                    return paymentDate >= startOfPeriod && paymentDate < endOfPeriod;
                                }) || [];
                                
                                // Sum up amount_paid from filtered payments
                                const totalPaid = invoicePayments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);


                                                    // Total amount paid during the invoice period
                            const invoiceTotalPaid = totalPaid;

                            // Total invoice cost (e.g., rent + VAT + op. fee + fines)
                            const invoiceTotalAmount = parseFloat(invoice.total_amount);

                            // Total fines actually paid (from this invoice)
                            const finePaid = invoice.Fines?.reduce(
                                (sum, fine) => sum + parseFloat(fine.paid_amount || 0),
                                0
                            ) || 0;

                            // Calculate how much was paid in excess of the invoice
                            const overpaidAmount = invoiceTotalPaid - invoiceTotalAmount;

                            // Extra payment is the amount remaining after also covering the fine payments
                            const extraPayment = Math.max(0, overpaidAmount - finePaid);

                            // Remaining is only applicable if there's no extra payment
                            const remainingAmount = Math.max(0, invoiceTotalAmount - invoiceTotalPaid);

                                

                            return (
                                <React.Fragment key={invoice.invoice_id}>
                                    <tr className="text-center">
                                        <td className="border p-2">{invoice.invoice_id}</td>
                                        <td className="border p-2">{new Date(invoice.month_year).toLocaleDateString()}</td>
                                        <td className="border p-2">LKR {invoice.previous_balance}</td>
                                        <td className="border p-2">LKR {invoice.fines}</td>
                                        <td className="border p-2">LKR {invoice.previous_fines}</td>
                                        <td className="border p-2">LKR {invoice.rent_amount}</td>
                                        <td className="border p-2">LKR {invoice.operation_fee}</td>
                                        <td className="border p-2">LKR {invoice.vat_amount}</td>
                                        <td className="border p-2">LKR {invoice.total_arrears}</td>
                                        <td className="border p-2 font-semibold">LKR {invoice.total_amount}</td>
                                        <td className="border p-2 text-green-600">LKR {totalPaid.toFixed(2)}</td>
                                        <td className="border p-2 text-red-600">LKR {remainingAmount.toFixed(2)}</td>
                                        <td className="border p-2 text-blue-600">
                                                {extraPayment > 0 ? `LKR ${extraPayment.toFixed(2)}` : "-"}
                                                </td>

                                        <td className="border p-2 font-semibold">{invoice.status}</td>
                                        <td className="border p-2">
                                            <button
                                                onClick={() => toggleInvoiceDetails(invoice.invoice_id)}
                                                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
                                            >
                                                {expandedInvoice === invoice.invoice_id ? "Hide" : "View"}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded Section (Invoice Details) */}
                                    {expandedInvoice === invoice.invoice_id && (
                                        <tr>
                                            <td colSpan="13" className="border p-4 bg-gray-100">
                                                <h4 className="text-xl font-semibold text-red-600 mb-3">Invoice Fines & Breakdown</h4>
                                                <div className="p-4 border rounded-lg bg-white">
                                                    <h5 className="text-lg font-semibold text-gray-800">Invoice ID: {invoice.invoice_id}</h5>

                                                    {/* Fines */}
                                                    {invoice.Fines?.length > 0 ? (
                                                        <div className="mt-2">
                                                            <h6 className="text-red-600 font-semibold">Fines</h6>
                                                            <ul className="list-disc pl-5">
                                                                {invoice.Fines.map((fine, i) => (
                                                                    <li key={i} className="text-gray-700">
                                                                        <strong>Fine:</strong> LKR {fine.fine_amount} | 
                                                                        <strong> Paid:</strong> LKR {fine.paid_amount} | 
                                                                        <strong> Status:</strong> {fine.status}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500">No fines for this invoice.</p>
                                                    )}

                                                    {/* Breakdown */}
                                                    <h6 className="text-gray-800 font-semibold mt-3">Breakdown:</h6>
                                                    <ul className="list-disc pl-5">
                                                        {invoice.OperationFees?.map((fee, i) => (
                                                            <li key={i}>Operation Fee Paid: LKR {fee.paid_amount} - {fee.status}</li>
                                                        ))}
                                                        {invoice.VATs?.map((vat, i) => (
                                                            <li key={i}>VAT Paid: LKR {vat.paid_amount} - {vat.status}</li>
                                                        ))}
                                                        {invoice.Rents?.map((rent, i) => (
                                                            <li key={i}>Rent Paid: LKR {rent.paid_amount} - {rent.status} - {rent.paid_date}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoiceTable;
