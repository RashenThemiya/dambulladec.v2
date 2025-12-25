import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { FiPlusCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const AddShop = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState({
    shop_id: "",
    shop_name: "",
    location: "",
    rent_amount: "",
    vat_rate: "",
    operation_fee: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) => {
    setShop({ ...shop, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized! Please log in first.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(shop),
      });

      if (response.ok) {
        setShowSuccess(true);
        setShop({
          shop_id: "",
          shop_name: "",
          location: "",
          rent_amount: "",
          vat_rate: "",
          operation_fee: ""
        });

        setTimeout(() => {
          setShowSuccess(false);
          navigate("/shop-management");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Unknown error occurred.");
      }
    } catch (error) {
      console.error("Error adding shop:", error);
      setError("An error occurred while adding the shop.");
    } finally {
      setLoading(false);
      setIsConfirmed(false); // reset confirmation flag
    }
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    handleSubmit(new Event("submit"));
  };

  const handleCancel = () => {
    setIsConfirmed(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Shop</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
            ❌ {error}
          </div>
        )}

        {showSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
            ✅ Shop has been added successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="shop_id"
            placeholder="Shop ID"
            value={shop.shop_id}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="shop_name"
            placeholder="Shop Name"
            value={shop.shop_name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Shop Location"
            value={shop.location}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="number"
            name="rent_amount"
            placeholder="Rent Amount"
            value={shop.rent_amount}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="number"
            name="vat_rate"
            placeholder="VAT Rate"
            value={shop.vat_rate}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="number"
            name="operation_fee"
            placeholder="Operation Fee"
            value={shop.operation_fee}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />

          <ConfirmWrapper
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            message="Confirm Adding Shop"
            additionalInfo="Please double-check all shop details before submission."
            confirmText="Yes, Add Shop"
            cancelText="No, Go Back"
            icon={<FiPlusCircle />}
            buttonBackgroundColor="bg-blue-600"
            buttonTextColor="text-white"
          >
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Shop"}
            </button>
          </ConfirmWrapper>

          <button
            type="button"
            onClick={() => navigate("/shop-management")}
            className="w-full mt-2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddShop;
