import { useState } from "react";
import api from "../../../utils/axiosInstance";
import ConfirmWrapper from "../../../components/ConfirmWrapper"; 

const PaymentDelete = ({ payments }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [localPayments, setLocalPayments] = useState(payments || []);

  const handleDelete = async (paymentId) => {
    try {
      await api.delete(`/api/systemsetting/payment/${paymentId}`);

      // Remove from UI
      setLocalPayments(localPayments.filter((p) => p.payment_id !== paymentId));
      alert("Payment deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Failed to delete payment. ${error.response?.data?.error || ""}`);
    }
  };

  const filteredPayments = localPayments
    .filter(
      (payment) =>
        payment.payment_id.toString().includes(searchTerm) ||
        new Date(payment.payment_date).toLocaleDateString().includes(searchTerm)
    )
    .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Payments</h3>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Payment ID or Date..."
          className="w-full p-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="border p-2">Payment ID</th>
              <th className="border p-2">Amount Paid</th>
              <th className="border p-2">Payment Date</th>
              <th className="border p-2">Payment Method</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.payment_id} className="text-center">
                <td className="border p-2">{payment.payment_id}</td>
                <td className="border p-2">LKR {payment.amount_paid}</td>
                <td className="border p-2">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </td>
                <td className="border p-2">{payment.payment_method}</td>
                <td className="border p-2">
                  <ConfirmWrapper
                    onConfirm={() => handleDelete(payment.payment_id)}
                    message={`Are you sure you want to delete payment ID ${payment.payment_id}?`}
                    confirmText="Yes, Delete"
                    cancelText="Cancel"
                    buttonBackgroundColor="bg-red-500"
                    buttonTextColor="text-white"
                    icon={<span>⚠️</span>}
                  >
                    <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                      Delete
                    </button>
                  </ConfirmWrapper>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentDelete;
