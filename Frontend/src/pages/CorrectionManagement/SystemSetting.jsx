import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import {
  exportInvoicesExcel,
  exportPaymentsExcel,
  exportShopSummaryExcel,
} from "../../utils/exportExcel";
import TenantDetails from "../ShopManagement/components/TenantDetails";
import EditableShopBalance from "./components/EditableShopBalance";
import GenerateInvoiceForm from "./components/GenerateInvoiceForm";
import InvoiceTable from "./components/InvoiceTableDelete";
import PaymentList from "./components/PaymentDelete";
import MakePayment from "./components/SettingPayment";
import ConfirmWrapper from "../../components/ConfirmWrapper"; // Only needed for other buttons
import { useAuth } from "../../context/AuthContext";

const SystemSetting = () => {
  const [shopId, setShopId] = useState("");
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("payments");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  const fetchShopSummary = async () => {
    if (!shopId.trim()) return;
    setLoading(true);
    setError(null);
    setShop(null);

    try {
      const response = await api.get(`/api/shops/shop-summary/${shopId}`);
      if (response.data?.shop) {
        setShop(response.data.shop);
      } else {
        setError("Shop not found.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch shop summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummary = () => {
    if (shop) exportShopSummaryExcel(shop);
  };

  const handleExportPayments = () => {
    if (shop?.Payments) exportPaymentsExcel(shop.Payments, shop.shop_name);
  };

  const handleExportInvoices = () => {
    if (shop?.Invoices && shop?.Payments)
      exportInvoicesExcel(shop.Invoices, shop.shop_name, shop.Payments);
  };

  return (
    <div className="w-screen h-screen bg-gray-100 overflow-auto relative">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-white border border-gray-300 shadow px-3 py-1 rounded-lg hover:bg-gray-100 transition"
      >
        <span className="text-xl">←</span>
        <span className="font-medium">Back</span>
      </button>

      <div className="w-full space-y-6">
        <div className="w-full bg-white shadow rounded-lg p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">System Settings</h1>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchShopSummary()}
              placeholder="Enter Shop ID"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            {/* Load Summary button: NO confirmation */}
            <button
              onClick={fetchShopSummary}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              Load Summary
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : shop ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-green-100 text-green-800 text-center text-lg font-semibold py-3 rounded">
                  <EditableShopBalance
                    shop={shop}
                    onBalanceUpdate={(newAmount) =>
                      setShop((prev) => ({
                        ...prev,
                        ShopBalance: {
                          ...prev.ShopBalance,
                          balance_amount: newAmount,
                        },
                      }))
                    }
                  />
                </div>

                <GenerateInvoiceForm
                  shopId={shop.shop_id}
                  onInvoiceGenerated={() => {
                    fetchShopSummary();
                    alert("Invoice generated successfully!");
                  }}
                />

                <div className="bg-gray-50 p-4 rounded shadow">
                  <h3 className="text-lg font-semibold border-b mb-2">Shop Details</h3>
                  <p><strong>ID:</strong> {shop.shop_id}</p>
                  <p><strong>Name:</strong> {shop.shop_name}</p>
                  <p><strong>Location:</strong> {shop.location}</p>
                  <p><strong>Rent:</strong> LKR {shop.rent_amount}</p>
                  <p><strong>VAT:</strong> {shop.vat_rate}%</p>
                  <p><strong>Operation Fee:</strong> LKR {shop.operation_fee}</p>

                  {/* Make Payment button with confirmation */}
                  <ConfirmWrapper
                    onConfirm={() => setShowPaymentModal(true)}
                    message="Are you sure you want to make a payment?"
                    confirmText="Yes, Make Payment"
                    cancelText="No, Cancel"
                    icon={<span>💸</span>}
                  >
                    <button
                      className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Make Payment
                    </button>
                  </ConfirmWrapper>

                  {/* Export Summary button with confirmation */}
                  <ConfirmWrapper
                    onConfirm={handleExportSummary}
                    message="Export shop summary?"
                    confirmText="Export"
                    cancelText="Cancel"
                    icon={<span>📄</span>}
                  >
                    <button
                      className="mt-3 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Export Summary
                    </button>
                  </ConfirmWrapper>
                </div>

                <TenantDetails tenant={shop.Tenant} />
              </div>

              <div className="lg:col-span-3">
                <div className="bg-gray-50 p-4 rounded shadow">
                  <div className="flex gap-4 border-b mb-4">
                    {/* Tab buttons: NO confirmation */}
                    <button
                      onClick={() => setActiveTab("payments")}
                      className={`px-4 py-2 font-medium ${activeTab === "payments" ? "border-b-4 border-green-600 text-green-800" : "text-gray-600"}`}
                    >
                      Payments
                    </button>
                    <button
                      onClick={() => setActiveTab("invoices")}
                      className={`px-4 py-2 font-medium ${activeTab === "invoices" ? "border-b-4 border-green-600 text-green-800" : "text-gray-600"}`}
                    >
                      Invoices
                    </button>
                  </div>

                  <div className="flex justify-end mb-3">
                    {activeTab === "payments" ? (
                      <ConfirmWrapper
                        onConfirm={handleExportPayments}
                        message="Export all payments for this shop?"
                        confirmText="Export"
                        cancelText="Cancel"
                        icon={<span>💵</span>}
                      >
                        <button
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          Export Payments
                        </button>
                      </ConfirmWrapper>
                    ) : (
                      <ConfirmWrapper
                        onConfirm={handleExportInvoices}
                        message="Export all invoices for this shop?"
                        confirmText="Export"
                        cancelText="Cancel"
                        icon={<span>🧾</span>}
                      >
                        <button
                          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                        >
                          Export Invoices
                        </button>
                      </ConfirmWrapper>
                    )}
                  </div>
                  <div className="h-[calc(100vh-300px)] overflow-y-auto">
                    {activeTab === "payments" ? (
                      <PaymentList payments={shop.Payments} />
                    ) : (
                      <InvoiceTable
                        shop={shop}
                        payments={shop.Payments}
                        onInvoiceUpdate={fetchShopSummary}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showPaymentModal && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                  onClick={() => setShowPaymentModal(false)}
                >
                  ×
                </button>
                <MakePayment
                  shopId={shop.shop_id}
                  onSuccess={() => {
                    setShowPaymentModal(false);
                    fetchShopSummary();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSetting;
