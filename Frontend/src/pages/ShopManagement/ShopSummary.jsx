import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/axiosInstance";
import InvoiceTable from "./components/InvoiceTable";
import PaymentList from "./components/PaymentList";
import TenantDetails from "./components/TenantDetails";
import { useAuth } from "../../context/AuthContext";

import { exportInvoicesExcel, exportPaymentsExcel, exportShopSummaryExcel } from "../../utils/exportExcel.js";

const ShopSummary = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("payments");
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  useEffect(() => {
    const fetchShopSummary = async () => {
      try {
        const response = await api.get(`/api/shops/shop-summary/${shopId}`);
        if (response.data && response.data.shop) {
          setShop(response.data.shop);
        } else {
          setError("Shop not found.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load shop summary.");
      } finally {
        setLoading(false);
      }
    };
    fetchShopSummary();
  }, [shopId]);

  const handleExportSummary = () => {
    if (shop) {
      exportShopSummaryExcel(shop);
    }
  };

  const handleExportPayments = () => {
    if (shop?.Payments) {
      exportPaymentsExcel(shop.Payments, shop.shop_name);
    }
  };

  const handleExportInvoices = () => {
    if (shop?.Invoices && shop?.Payments) {
      exportInvoicesExcel(
        shop.Invoices,
        shop.shop_name,
        shop.Payments
      );
    }
  };


  return (
    <div className="w-screen h-screen flex flex-col lg:flex-row bg-gray-100 overflow-hidden">
      <div className="w-full lg:w-1/4 h-1/2 lg:h-full p-4 space-y-4 overflow-y-auto bg-white shadow-md">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 transition duration-200"
        >
          ← Back
        </button>

        <div className="bg-green-100 text-green-800 text-center text-lg font-semibold py-3 rounded-lg shadow">
          Shop Balance: LKR {shop?.ShopBalance?.balance_amount || "0.00"}
        </div>

        <div className="bg-gray-50 p-4 rounded shadow">
          <h3 className="text-lg font-semibold border-b mb-2">Shop Details</h3>
          <p><strong>ID:</strong> {shop?.shop_id}</p>
          <p><strong>Name:</strong> {shop?.shop_name}</p>
          <p><strong>Location:</strong> {shop?.location}</p>
          <p><strong>Rent:</strong> LKR {shop?.rent_amount}</p>
          <p><strong>VAT:</strong> {shop?.vat_rate}%</p>
          <p><strong>Operation Fee:</strong> LKR {shop?.operation_fee}</p>
          <button
            onClick={handleExportSummary}
            className="mt-3 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Export Summary
          </button>
        </div>

        <TenantDetails tenant={shop?.Tenant} />
      </div>

      <div className="w-full lg:w-3/4 h-1/2 lg:h-full p-6 overflow-hidden">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Shop Summary</h2>

        <div className="bg-white p-4 rounded shadow h-full flex flex-col">
          <div className="flex space-x-4 border-b pb-2 mb-4">
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-6 py-2 text-lg font-semibold transition duration-200 ${activeTab === "payments"
                ? "border-b-4 border-green-600 text-green-800"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveTab("invoices")}
              className={`px-6 py-2 text-lg font-semibold transition duration-200 ${activeTab === "invoices"
                ? "border-b-4 border-green-600 text-green-800"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Invoices
            </button>
          </div>

          <div className="flex justify-end mb-4">
            {activeTab === "payments" ? (
              <button
                onClick={handleExportPayments}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
              >
                Export Payments
              </button>
            ) : (
              <button
                onClick={handleExportInvoices}
                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition duration-200"
              >
                Export Invoices
              </button>
            )}
          </div>

          {/* Main scrollable table area */}
          <div className="h-[calc(100vh-270px)] overflow-y-auto">
            {activeTab === "payments" ? (
              <PaymentList payments={shop?.Payments} />
            ) : (
              <InvoiceTable shop={shop} payments={shop?.Payments} />
            )}
          </div>
        </div>
      </div>
    </div>

  );
};

export default ShopSummary;
