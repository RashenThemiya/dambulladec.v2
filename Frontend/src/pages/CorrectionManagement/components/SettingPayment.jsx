import { useState } from "react";
import api from "../../../utils/axiosInstance";
import ConfirmWrapper from "../../../components/ConfirmWrapper"; // Adjust path as needed

const SettingPayment = ({ shopId, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // We'll remove form's onSubmit and handle submission via ConfirmWrapper onConfirm

  const handleSubmit = async () => {
    if (!amount || isNaN(amount) || !paymentMethod) {
      setError("Amount and payment method are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/api/payments/by-shop/${shopId}`, {
        amountPaid: parseFloat(amount),
        paymentDate: paymentDate,
        paymentMethod: paymentMethod,
        note: note,
      });
      onSuccess?.();
      setAmount("");
      setNote("");
      setPaymentMethod("Cash");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !amount || isNaN(amount) || !paymentMethod;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">Make Payment</h2>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-center">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Amount (LKR)
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            placeholder="Enter amount"
            required
          />
        </div>

        <div>
          <label
            htmlFor="paymentMethod"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Payment Method
          </label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            required
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Online">Online</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="paymentDate"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Payment Date
          </label>
          <input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            required
          />
        </div>

        <div>
          <label
            htmlFor="note"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Note (optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Add a note"
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none"
          />
        </div>

        <div className="flex justify-end">
          <ConfirmWrapper
            onConfirm={handleSubmit}
            message={`Confirm payment of LKR ${amount} via ${paymentMethod}?`}
            confirmText="Yes, Submit"
            cancelText="Cancel"
            buttonBackgroundColor="bg-green-600"
            buttonTextColor="text-white"
          >
            <button
              type="button"
              disabled={isSubmitDisabled}
              className={`px-6 py-3 rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-400 transition ${
                isSubmitDisabled ? "cursor-not-allowed" : "cursor-pointer"
              }`}
              style={{ backgroundColor: isSubmitDisabled ? undefined : undefined }}
            >
              {loading ? "Processing..." : "Submit Payment"}
            </button>
          </ConfirmWrapper>
        </div>
      </form>
    </div>
  );
};

export default SettingPayment;
