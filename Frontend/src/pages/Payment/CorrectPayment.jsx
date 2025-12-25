import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { MdWarningAmber } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

const CorrectPayment = () => {
    const navigate = useNavigate();
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);

    const [formData, setFormData] = useState({
        invoice_id: "",
        shop_id: "",
        actual_amount: "",
        admin_put_amount: "0",
        edit_reason: "",
        payment_date: "",
    });

    const [searchDate, setSearchDate] = useState("");
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const fetchPayments = async () => {
        setError(null);
        setSuccess(null);
        setPayments([]);
        setFetching(true);

        try {
            const token = localStorage.getItem("token");
            const response = await api.get(`/api/paymentscorrection/payments-by-date`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    shop_id: formData.shop_id,
                    payment_date: searchDate,
                },
            });

            if (response.data.success && response.data.data?.length > 0) {
                setPayments(response.data.data);
            } else {
                setError("No payments found.");
            }
        } catch (err) {
            setError("Error fetching payments.");
        } finally {
            setFetching(false);
        }
    };

    const handlePaymentClick = (payment) => {
        setFormData({
            invoice_id: payment.invoice_id || "",
            shop_id: payment.shop_id || "",
            actual_amount: "",
            admin_put_amount: payment.amount_paid?.toString() || "",
            edit_reason: "",
            payment_date: payment.payment_date?.split("T")[0] || "",
        });
        setSearchDate(payment.payment_date?.split("T")[0] || "");
    };

    const handleSubmit = async () => {
        const { invoice_id, shop_id, actual_amount, admin_put_amount, edit_reason, payment_date } = formData;

        if (!shop_id || !actual_amount || !admin_put_amount || !payment_date) {
            setError("All required fields must be filled.");
            return;
        }

        const payload = {
            shop_id,
            actual_amount: parseFloat(actual_amount),
            admin_put_amount: parseFloat(admin_put_amount),
            edit_reason,
            payment_date,
        };

        if (invoice_id?.trim()) payload.invoice_id = invoice_id;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem("token");
            const response = await api.post(
                "/api/paymentscorrection/correct-payment/",
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSuccess("✅ Payment correction applied successfully!");
                setFormData({
                    invoice_id: "",
                    shop_id,
                    actual_amount: "",
                    admin_put_amount: "",
                    edit_reason: "",
                    payment_date,
                });
                fetchPayments();  // Refresh payment list
            } else {
                setError(response.data.message || "Payment correction failed.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
            setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000); // Clear messages after 5 seconds
        }
    };

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const isSearchDisabled = !formData.shop_id || !searchDate;

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">

                <h2 className="text-2xl font-bold mb-4 text-center">Correct Payment</h2>

                {/* Success and Error Messages */}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                        <button onClick={() => setSuccess(null)} className="float-right">×</button>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                        <button onClick={() => setError(null)} className="float-right">×</button>
                    </div>
                )}

                {/* Search Section */}
                <section className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Step 1: Find Payments</h3>
                    <label className="block mb-1">Shop ID *</label>
                    <input
                        type="text"
                        value={formData.shop_id}
                        onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <label className="block mt-3 mb-1">Payment Date *</label>
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                    <button
                        onClick={fetchPayments}
                        disabled={isSearchDisabled}
                        className={`w-full mt-3 py-2 rounded ${isSearchDisabled ? "bg-gray-300 cursor-not-allowed text-gray-600" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                    >
                        {fetching ? "Searching..." : "Search Payments"}
                    </button>
                </section>

                {/* List of Payments */}
                {payments.length > 0 && (
                    <section className="mb-6">
                        <h4 className="font-semibold mb-2">Step 2: Select a Payment</h4>
                        <ul className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded">
                            {payments.map((pmt) => (
                                <li
                                    key={pmt.payment_id || pmt.invoice_id || Math.random()}
                                    className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-blue-100"
                                    onClick={() => handlePaymentClick(pmt)}
                                    title="Click to autofill the form with this payment"
                                >
                                    <strong>Invoice:</strong> {pmt.invoice_id || "N/A"} | <strong>Amount:</strong> {pmt.amount_paid} | <strong>Method:</strong> {pmt.payment_method}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Correction Form */}
                <section>
                    <h4 className="text-lg font-semibold mb-2">Step 3: Correct Payment Details</h4>
                    <div className="space-y-3">
                        <label>Invoice ID (Optional)</label>
                        <input
                            type="text"
                            name="invoice_id"
                            value={formData.invoice_id}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />

                        <label>Actual Amount *</label>
                        <input
                            type="number"
                            name="actual_amount"
                            value={formData.actual_amount}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />

                        <label>Admin Recorded Amount *</label>
                        <input
                            type="number"
                            name="admin_put_amount"
                            placeholder="Admin Recorded Amount"
                            value={formData.admin_put_amount || 0}
                            readOnly
                            className="w-full p-2 border rounded bg-gray-100 text-gray-700 cursor-not-allowed"
                        />

                        <label>Payment Date *</label>
                        <input
                            type="date"
                            name="payment_date"
                            value={formData.payment_date}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />

                        <label>Reason for Correction</label>
                        <textarea
                            name="edit_reason"
                            value={formData.edit_reason}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />

                        {/* Use ConfirmWrapper for confirmation before submission */}
                        <ConfirmWrapper
                            onConfirm={handleSubmit}
                            message="Are you sure you want to submit this correction?"
                            additionalInfo="Once submitted, the payment details will be updated."
                            icon={<MdWarningAmber />}
                            confirmText="Yes, Submit"
                            cancelText="No, Cancel"
                            buttonBackgroundColor="bg-green-600"
                            buttonTextColor="text-white"
                        >
                            <button
                                type="button"
                                disabled={loading}
                                className={`w-full py-2 rounded ${loading ? "bg-gray-400 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                            >
                                {loading ? "Processing..." : "Submit Correction"}
                            </button>
                        </ConfirmWrapper>

                        {/* Back Button Below */}
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => navigate("/payments")}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
                            >
                                ← Back to Main
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CorrectPayment;
