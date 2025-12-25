import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/axiosInstance";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { useAuth } from "../../context/AuthContext";

const UpdateVATRate = () => {
  const navigate = useNavigate();
  const [vatRate, setVatRate] = useState("");
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  const handleUpdateVAT = async () => {
    const newVatRate = parseFloat(vatRate);
    if (isNaN(newVatRate) || newVatRate <= 0) {
      alert("Please enter a valid VAT rate greater than 0.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized! Please log in first.");
      navigate("/login");
      return;
    }

    try {
      const response = await api.put("/api/settings/update-vat-rate", { newVatRate });
      alert(response.data.message || "VAT rate updated successfully.");
      navigate("/settings");
    } catch (error) {
      console.error("Failed to update VAT rate:", error);
      alert(error.response?.data?.message || "Failed to update VAT rate. Please try again.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="p-8 w-full overflow-auto">
        <div className="text-3xl font-semibold mb-8">
          <h1>Update VAT Rate</h1>
          <p className="text-lg text-gray-500">Modify the VAT rate applied to all shops.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <label className="block text-lg font-semibold mb-2">New VAT Rate (%)</label>
          <input
            type="number"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
            placeholder="Enter new VAT rate"
          />
          <ConfirmWrapper onConfirm={handleUpdateVAT}>
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 w-full"
            >
              Update VAT Rate
            </button>
          </ConfirmWrapper>
        </div>
      </div>
    </div>
  );
};

export default UpdateVATRate;
