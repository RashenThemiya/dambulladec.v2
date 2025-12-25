import React, { useState } from "react";

const PaymentList = ({ payments }) => {
    const [searchTerm, setSearchTerm] = useState("");

    if (!payments || payments.length === 0) {
        return <p className="text-gray-500 text-center">No payments available.</p>;
    }

    // Filter and sort payments by date (latest first)
    const filteredPayments = payments
        .filter(payment =>
            payment.payment_id.toString().includes(searchTerm) ||
            new Date(payment.payment_date).toLocaleDateString().includes(searchTerm)
        )
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)); // Latest payments first

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4 text-gray-700">Payments</h3>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by Payment ID or Date..."
                    className="w-full p-2 border rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Payments Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 bg-white">
                    <thead>
                        <tr className="bg-gray-200 text-gray-700">
                            <th className="border p-2">Payment ID</th>
                            <th className="border p-2">Amount Paid</th>
                            <th className="border p-2">Payment Date</th>
                            <th className="border p-2">Payment Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map((payment) => (
                            <tr key={payment.payment_id} className="text-center">
                                <td className="border p-2">{payment.payment_id}</td>
                                <td className="border p-2">LKR {payment.amount_paid}</td>
                                <td className="border p-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                <td className="border p-2">{payment.payment_method}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentList;
