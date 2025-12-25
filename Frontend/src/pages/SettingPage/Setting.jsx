import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CredentialModal from "../../components/CredentialModal";

import Sidebar from "../../components/Sidebar";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";


import { FaBan, FaClipboardList, FaCog, FaDatabase, FaExclamationTriangle, FaFileInvoiceDollar, FaGavel, FaPercentage, FaUserShield } from "react-icons/fa";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const Setting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  const token = localStorage.getItem("token");

  // Custom success popup for invoice generation
  const showInvoiceSuccessPopup = (message) => {
    toast.success(
      <div>
        <div className="font-bold text-green-700 mb-1">Invoices Generated!</div>
        <div>{message}</div>
      </div>,
      {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      }
    );
  };

  const handleApiCall = async (endpoint, successMsg, errorMsg, credentials = {}, customSuccess = null) => {
    if (!token) {
      toast.error("Unauthorized! Please log in.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(endpoint, credentials, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Use custom success popup for invoice generation
      if (customSuccess) {
        customSuccess(response.data.message || successMsg);
      } else {
        toast.success(response.data.message || successMsg);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Refactored actions to accept credentials
  const handleGenerateInvoices = (credentials) =>
    handleApiCall(
      "/api/generateInvoices/generate-all",
      "Invoices generated!",
      "Failed to generate invoices.",
      credentials,
      showInvoiceSuccessPopup // Pass custom popup for invoice generation
    );

  const handleApplyFines = (credentials) =>
    handleApiCall("/api/settings/apply-fines", "Fines applied successfully!", "Failed to apply fines.", credentials);

  const handleFineArrest = (credentials) =>
    handleApiCall("/api/settings/fine-arrest-action", "Fine arrest applied!", "Failed to apply fine arrest.", credentials);

  const handleInvoiceArrest = (credentials) =>
    handleApiCall("/api/settings/invoice-arrest-action", "Invoice arrest applied!", "Failed to apply invoice arrest.", credentials);

  const handleBackupDownload = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/backup/backup`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'database_backup.sql';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Backup download failed");
      console.error(err);
    }
  };


  // Modal verification handler
  const handleVerify = async (email, password) => {
    try {
      const res = await api.post("/api/admin/verify", { email, password });

      if (res.status === 200) {
        toast.success("Verification successful");
        setModalOpen(false); // ✅ Only close modal if verification is successful

        if (pendingAction) {
          pendingAction({ email, password }); // Run the saved action
        }
      } else {
        toast.error("Verification failed");
        // ❌ Don't close modal here
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
      // ❌ Don't close modal on error
    }
    // ✅ Remove the `finally` block completely
  };


  const openCredentialModal = (action) => {
    setPendingAction(() => action); // Save the intended action
    setModalOpen(true); // Show the modal
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="p-8 w-full overflow-auto">
        <div className="text-3xl font-semibold mb-8">
          <h1>Settings</h1>
          <p className="text-lg text-gray-500">Manage system settings</p>
        </div>

        {/* Show loading spinner overlay when loading */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}




        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">

          {/* Update VAT Rate */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                <FaPercentage className="text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Update VAT Rate</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Modify the VAT rate applied to all shops to reflect current tax policies.
            </p>
            <button
              onClick={() => navigate("/update-vat-rate")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl w-full transition-colors duration-300 cursor-pointer"
            >
              Update VAT
            </button>
          </div>

          {/* Manage User Roles */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 text-green-600 p-2 rounded-full">
                <FaUserShield className="text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Manage User Roles</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Assign roles and permissions to control user access levels.
            </p>
            <button
              onClick={() => navigate("/admin-panel")}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-xl w-full transition-colors duration-300 cursor-pointer"
            >
              Manage Roles
            </button>
          </div>

          {/* Generate Invoices */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 text-red-600 p-2 rounded-full">
                  <FaFileInvoiceDollar className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Generate Invoices</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Generate monthly invoices for all shops in just one click.
              </p>
            </div>

            <button
              onClick={() => openCredentialModal(handleGenerateInvoices)}
              disabled={loading}
              className={`py-2.5 px-4 rounded-xl text-white font-medium w-full transition-colors duration-300
      ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 cursor-pointer"}`}
            >
              {loading ? "Generating..." : "Generate Invoices"}
            </button>
          </div>

          {/* Apply Fines */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full">
                  <FaExclamationTriangle className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Apply Fines</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Automatically apply fines for overdue invoices.
              </p>
            </div>
            <button
              onClick={() => openCredentialModal(handleApplyFines)}
              disabled={loading}
              className={`py-2.5 px-4 rounded-xl text-white font-medium w-full transition-colors duration-300 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                }`}
            >
              {loading ? "Processing..." : "Apply Fines"}
            </button>
          </div>

          {/* Fine Arrest Action */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                  <FaGavel className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Fine Arrest Action</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Mark overdue fines as Arrest after 30 days.
              </p>
            </div>
            <button
              onClick={() => openCredentialModal(handleFineArrest)}
              disabled={loading}
              className={`py-2.5 px-4 rounded-xl text-white font-medium w-full transition-colors duration-300
  ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                }`}


            >
              {loading ? "Processing..." : "Apply Fine Arrest"}
            </button>
          </div>

          {/* Invoice Arrest Action */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
                  <FaBan className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Invoice Arrest Action</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Mark invoices and related records as Arrest if overdue.
              </p>
            </div>
            <button
              onClick={() => openCredentialModal(handleInvoiceArrest)}
              disabled={loading}
              className={`py-2.5 px-4 rounded-xl text-white font-medium w-full transition-colors duration-300 ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 cursor-pointer"
                }`}
            >
              {loading ? "Processing..." : "Apply Invoice Arrest"}
            </button>
          </div>



          {/* System Logs */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 text-green-600 p-2 rounded-full">
                  <FaClipboardList className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">View System Logs</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Monitor activity logs for security and compliance.
              </p>
            </div>
            <button
              onClick={() => navigate("/system-logs")}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-xl w-full transition-colors duration-300 cursor-pointer"
            >
              View Logs
            </button>
          </div>

          {/* Backup System Data */}

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
                  <FaDatabase className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Backup System Data</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Download a backup of the database for safekeeping.
              </p>
            </div>
            <button
              onClick={handleBackupDownload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl w-full transition-colors duration-300 cursor-pointer"

            >
              Backup Data
            </button>
          </div>


          {/* System Configuration */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-4 min-w-0">
                <div className="bg-cyan-100 text-cyan-600 p-2 rounded-full flex-shrink-0">
                  <FaCog className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 truncate">System Configuration</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Modify core system configuration and preferences.
              </p>
            </div>
            <button
              onClick={() => navigate("/system-setting")}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2.5 px-4 rounded-xl w-full transition-colors duration-300 cursor-pointer"
            >
              System Settings
            </button>
          </div>



        </div>

      </div>

      {/* Credential Modal */}
      <CredentialModal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        onVerify={handleVerify}
      />
    </div>
  );
};

export default Setting;
