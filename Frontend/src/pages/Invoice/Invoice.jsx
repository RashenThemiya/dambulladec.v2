import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import { printInvoices } from "../../utils/printInvoices";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../../components/LoadingSpinner";

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [showOkOnly, setShowOkOnly] = useState(false);
  const [showBulkEmailConfirm, setShowBulkEmailConfirm] = useState(false);

  const navigate = useNavigate();
  const { name, role } = useAuth();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Unauthorized: Please log in first.");
          setLoading(false);
          return;
        }
        const response = await api.get("api/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(response.data)) {
          setInvoices(response.data);
        } else {
          setError("Unexpected response format");
        }
      } catch (err) {
        setError("Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-500 text-white";
      case "Arrears":
        return "bg-red-500 text-white";
      case "Partially Paid":
        return "bg-yellow-500 text-black";
      case "Unpaid":
        return "bg-gray-500 text-white";
      case "Newly Arrived":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (activeTab !== "all") {
      if (activeTab === "paid" && invoice.status !== "Paid") return false;
      if (activeTab === "arrears" && invoice.status !== "Arrears") return false;
      if (activeTab === "partly-paid" && invoice.status !== "Partially Paid") return false;
      if (activeTab === "newly-arrived" && invoice.printedtime !== 0) return false;
      if (activeTab === "unpaid" && invoice.status !== "Unpaid") return false;
    }
    return (
      invoice.shop_id.toString().includes(searchQuery) ||
      invoice.invoice_id.toString().includes(searchQuery) ||
      invoice.month_year.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices((prevSelected) =>
      prevSelected.includes(invoiceId)
        ? prevSelected.filter((id) => id !== invoiceId)
        : [...prevSelected, invoiceId]
    );
  };

  const onPrintClick = () => {
    if (selectedInvoices.length === 0) return;
    setConfirmMessage("Are you sure you want to print?");
    setShowOkOnly(false);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: Please log in first.");
      return;
    }
    const invoicesToPrint = filteredInvoices.filter((invoice) =>
      selectedInvoices.includes(invoice.invoice_id)
    );
    printInvoices(invoicesToPrint, token);
    setShowConfirm(false);
  };

  // Bulk Email: only per-invoice toasts, no summary
  const handleSendBulkEmail = async () => {
    setShowBulkEmailConfirm(false);
    setEmailSending(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setEmailSending(false);
        toast.error("Unauthorized: Please log in first.", { autoClose: 3000 });
        return;
      }
      const invoicesToSend = filteredInvoices.filter((invoice) =>
        selectedInvoices.includes(invoice.invoice_id)
      );
      const response = await api.post(
        "/api/email/send-email",
        { invoices: invoicesToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailSending(false);

      if (response.data && Array.isArray(response.data.results)) {
        const { results } = response.data;
        results.forEach((result) => {
          if (result.success) {
            toast.info(
              `Invoice #${result.invoice_id} sent to Shop #${result.shop_id} successfully.`,
              { autoClose: 2000 }
            );
            // Auto-uncheck after successful send
            setSelectedInvoices((prev) =>
              prev.filter((id) => id !== result.invoice_id)
            );
          } else {
            toast.error(
              `Failed to send Invoice #${result.invoice_id} to Shop #${result.shop_id}: ${result.message}`,
              { autoClose: 4000 }
            );
          }
        });
      } else {
        toast.error("Failed to send invoices. Invalid response format.", { autoClose: 3000 });
      }
    } catch (error) {
      setEmailSending(false);
      console.error(error);
      toast.error(
        `An error occurred while sending the email: ${error?.response?.data?.message || error.message || "Unknown error"}`,
        { autoClose: 3000 }
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar className="w-64 flex-shrink-0" />
      <div className="flex-1 p-6 overflow-auto">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        {emailSending && <LoadingSpinner />}
        <h1 className="text-3xl font-bold mb-4">Invoice Management</h1>
        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          placeholder="Search by Shop ID, Invoice ID, or Month-Year"
          className="p-2 border rounded mb-4 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex space-x-4 mt-6 border-b pb-2">
          {[
            { key: "all", label: "All Invoices" },
            { key: "paid", label: "Paid Invoices" },
            { key: "arrears", label: "Arrears Invoices" },
            { key: "partly-paid", label: "Partly Paid" },
            { key: "newly-arrived", label: "Newly Arrived" },
            { key: "unpaid", label: "Unpaid Invoices" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg cursor-pointer ${
                activeTab === tab.key ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4 mt-4">
          <ConfirmWrapper
            show={showConfirm}
            message={confirmMessage}
            onConfirm={handleConfirm}
            onCancel={() => setShowConfirm(false)}
            confirmText="Yes"
            cancelText={showOkOnly ? "Ok" : "No"}
            icon="🖨️"
          >
            <button
              onClick={onPrintClick}
              disabled={selectedInvoices.length === 0}
              className={`px-6 py-2 rounded-lg text-white flex items-center ${
                selectedInvoices.length === 0
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-700"
              }`}
            >
              <Printer className="w-5 h-5 mr-2" />
              Print Selected Invoices
            </button>
          </ConfirmWrapper>
          <ConfirmWrapper
            show={showBulkEmailConfirm}
            message={`Are you sure you want to send the selected ${selectedInvoices.length} invoice(s) via email?`}
            onConfirm={handleSendBulkEmail}
            onCancel={() => setShowBulkEmailConfirm(false)}
            confirmText="Send"
            cancelText="Cancel"
            icon="📧"
          >
            <button
              onClick={() => setShowBulkEmailConfirm(true)}
              disabled={selectedInvoices.length === 0}
              className={`px-6 py-2 rounded-lg text-white flex items-center ${
                selectedInvoices.length === 0
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700"
              }`}
            >
              📧 Send Selected Invoices via Email
            </button>
          </ConfirmWrapper>
        </div>

        <div className="overflow-x-auto bg-white p-4 shadow-md rounded-lg mt-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedInvoices.length === filteredInvoices.length &&
                      filteredInvoices.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(
                          filteredInvoices.map((invoice) => invoice.invoice_id)
                        );
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                  />
                </th>
                <th className="border p-2">Invoice ID</th>
                <th className="border p-2">Shop ID</th>
                <th className="border p-2">Month</th>
                <th className="border p-2">Rent Amount</th>
                <th className="border p-2">Operation Fee</th>
                <th className="border p-2">VAT</th>
                <th className="border p-2">Previous Balance</th>
                <th className="border p-2">Total Fines</th>
                <th className="border p-2">Fines Prev Month</th>
                <th className="border p-2">Total Arrears</th>
                <th className="border p-2">Total Amount</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Total Paid</th>
                <th className="border p-2">Prev Total Paid</th>
                <th className="border p-2">Prev Payment Date</th>
                <th className="border p-2">Created At</th>
                <th className="border p-2">Shop Name</th>
                <th className="border p-2">Tenant</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="20" className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="border">
                    <td className="border p-2">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.invoice_id)}
                        onChange={() =>
                          toggleInvoiceSelection(invoice.invoice_id)
                        }
                      />
                    </td>
                    <td className="border p-2">{invoice.invoice_id}</td>
                    <td
                      className="px-6 py-4 text-sm text-blue-600 cursor-pointer underline"
                      onClick={() =>
                        navigate(`/shop-summary/${invoice.shop_id}`)
                      }
                    >
                      {invoice.shop_id}
                    </td>
                    <td className="border p-2">
                      {new Date(invoice.month_year).toLocaleDateString()}
                    </td>
                    <td className="border p-2">LKR {invoice.rent_amount}</td>
                    <td className="border p-2">LKR {invoice.operation_fee}</td>
                    <td className="border p-2">LKR {invoice.vat_amount}</td>
                    <td className="border p-2">
                      LKR {invoice.previous_balance}
                    </td>
                    <td className="border p-2">LKR {invoice.fines}</td>
                    <td className="border p-2">LKR {invoice.previous_fines}</td>
                    <td className="border p-2">LKR {invoice.total_arrears}</td>
                    <td className="border p-2">LKR {invoice.total_amount}</td>
                    <td
                      className={`border p-2 text-center font-bold ${getStatusClass(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </td>
                    <td className="border p-2">
                      LKR {invoice.total_paid?.toFixed(2) || "0.00"}
                    </td>
                    <td className="border p-2">
                      LKR{" "}
                      {invoice.previous_payment_summary?.total_paid?.toFixed(
                        2
                      ) || "0.00"}
                    </td>
                    <td className="border p-2">
                      {invoice.previous_payment_summary?.last_payment_date
                        ? new Date(
                            invoice.previous_payment_summary.last_payment_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="border p-2">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="border p-2">
                      {invoice.Shop?.shop_name || "N/A"}
                    </td>
                    <td className="border p-2">
                      {invoice.Shop?.Tenant?.name || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
