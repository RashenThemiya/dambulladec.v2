import { useEffect, useRef, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import LoadingSpinner from "../../components/LoadingSpinner";

const ALLOW_FUTURE_DATES = false;

const MakePayment = () => {
  const navigate = useNavigate();
  const { name } = useAuth();

  const firstInputRef = useRef(null);

  const [paymentData, setPaymentData] = useState({
    referenceId: "",
    amountPaid: "",
    paymentMethod: "Cash",
    type: "shop",
    paymentDate: "",
  });

  const [shops, setShops] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await api.get("/api/shops");
        setShops(res.data || []);
        setPaymentData((prev) => ({ ...prev, referenceId: "" }));
      } catch (err) {
        console.error("Failed to load shop list:", err.message);
      }
    };

    const fetchPayments = async () => {
      try {
        const res = await api.get("api/payments/payments");
        setPaymentRecords(res.data?.payments || []);
      } catch (err) {
        console.error("Failed to fetch payment records:", err.message);
      }
    };

    fetchShops();
    fetchPayments();
  }, [paymentData.type]);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [paymentData.referenceId, paymentData.type]);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      setPaymentData({
        ...paymentData,
        type: value,
        referenceId: "",
        amountPaid: "",
        paymentDate: "",
      });
    } else {
      setPaymentData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      const next = form.elements[index + 1];
      if (next && next.type !== "submit" && !next.disabled) {
        e.preventDefault();
        next.focus();
      }
    }
  };

  const handleSubmit = async () => {
    if (loading) return; // Prevent multiple submissions

    setError(null);
    setMessage(null);

    const { referenceId, amountPaid, paymentMethod, type, paymentDate } =
      paymentData;

    if (!referenceId.trim() || !amountPaid || !paymentMethod || !paymentDate) {
      setError("All fields are required. Please complete the form.");
      return;
    }

    const combinedDateTime = `${paymentDate}T11:00:00`;
    if (!ALLOW_FUTURE_DATES && new Date(combinedDateTime) > new Date()) {
      setError("Payment date cannot be in the future.");
      return;
    }

    setLoading(true);
    const endpoint =
      type === "shop"
        ? `api/payments/by-shop/${referenceId.trim()}`
        : `api/payments/by-invoice/${referenceId.trim()}`;

    try {
      await api.post(endpoint, {
        amountPaid: parseFloat(amountPaid),
        paymentMethod,
        paymentDate: new Date(combinedDateTime).toISOString(),
      });

      setMessage("Payment processed successfully!");
      setPaymentData({
        referenceId: "",
        amountPaid: "",
        paymentMethod: "Cash",
        type,
        paymentDate: "",
      });

      if (firstInputRef.current) firstInputRef.current.focus();

      const res = await api.get("api/payments/payments");
      setPaymentRecords(res.data?.payments || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to process payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = paymentRecords.filter(
    (p) =>
      p.shop_id?.toString().trim().toLowerCase() ===
      paymentData.referenceId?.toString().trim().toLowerCase()
  );

  const shop = shops.find((s) => s.shop_id === paymentData.referenceId);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {loading && <LoadingSpinner />} {/* <-- Spinner overlay here */}
      <h2 className="text-2xl font-bold text-center mb-2">Make a Payment</h2>
      <p className="text-center text-gray-600 mb-6">
        Admin: {name || "Unknown"}
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: Payment Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {message && (
            <div className="flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
              <FaCheckCircle className="mr-2 text-green-600 text-xl" />
              <span className="font-medium">{message}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              <FaTimesCircle className="mr-2 text-red-600 text-xl" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Shop ID
              </label>
              {paymentData.type === "shop" ? (
                <select
                  ref={firstInputRef}
                  name="referenceId"
                  value={paymentData.referenceId}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="" disabled>
                    -- Select Shop ID --
                  </option>
                  {shops.map((shop) => (
                    <option key={shop.shop_id} value={shop.shop_id}>
                      {shop.shop_id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  ref={firstInputRef}
                  type="text"
                  name="referenceId"
                  value={paymentData.referenceId}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount Paid
              </label>
              <input
                type="number"
                name="amountPaid"
                value={paymentData.amountPaid}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
                min="1"
                step="0.01"
                disabled={!paymentData.referenceId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border border-gray-300 rounded-lg"
                disabled={!paymentData.referenceId}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Correction Made">Correction Made</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Date
              </label>
              <input
                type="date"
                name="paymentDate"
                value={paymentData.paymentDate}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
                max={!ALLOW_FUTURE_DATES ? today : undefined}
                disabled={!paymentData.referenceId}
              />
            </div>

            <ConfirmWrapper
              message="Confirm Payment Submission"
              additionalInfo="This action is final and cannot be undone."
              onConfirm={handleSubmit}
              icon={<FaExclamationTriangle />}
              confirmText="Yes, Submit"
              cancelText="Cancel"
              buttonBackgroundColor="bg-green-600"
            >
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-300"
                disabled={loading || !paymentData.referenceId}
              >
                {loading ? "Processing..." : "Process Payment"}
              </button>
            </ConfirmWrapper>
          </form>
        </div>

        {/* RIGHT: Shop Details + Payment History */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {paymentData.type === "shop" && paymentData.referenceId && (
            <>
              <h3 className="text-xl font-semibold mb-2">Shop Details</h3>
              {shop ? (
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <p>
                    <strong>Shop ID:</strong> {shop.shop_id}
                  </p>
                  <p>
                    <strong>Name:</strong> {shop.shop_name}
                  </p>
                  <p>
                    <strong>Location:</strong> {shop.location}
                  </p>
                  <p>
                    <strong>Rent:</strong> {shop.rent_amount}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No shop data found.</p>
              )}

              <h3 className="text-xl font-semibold mt-6 mb-2">
                Payment History
              </h3>
              <div className="max-h-64 overflow-y-auto">
                {filteredPayments.length > 0 ? (
                  <table className="w-full text-left border">
                    <thead>
                      <tr className="bg-gray-200 text-sm">
                        <th className="p-2 border">Date</th>
                        <th className="p-2 border">Amount</th>
                        <th className="p-2 border">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((p) => (
                        <tr key={p.payment_id} className="text-sm">
                          <td className="p-2 border">
                            {new Date(p.payment_date).toLocaleDateString()}
                          </td>
                          <td className="p-2 border">LKR {p.amount_paid}</td>
                          <td className="p-2 border">{p.payment_method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">No payment records found.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition duration-300"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default MakePayment;
