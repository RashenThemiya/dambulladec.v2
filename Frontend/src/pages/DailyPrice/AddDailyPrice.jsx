import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const AddDailyPrice = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [prices, setPrices] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products");
        setProducts(res.data);
      } catch (err) {
        setGlobalError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const validateField = (productId, field, value) => {
    const current = {
      ...prices[productId],
      [field]: value,
    };

    const min = parseFloat(current.min_price);
    const max = parseFloat(current.max_price);

    let error = "";

    if ((current.min_price && !current.max_price) || (!current.min_price && current.max_price)) {
      error = "Both min and max prices are required.";
    } else if (min && max && min > max) {
      error = "Min price should not exceed max price.";
    }

    setErrors((prev) => ({
      ...prev,
      [productId]: error,
    }));
  };

  const handlePriceChange = (productId, field, value) => {
    setPrices((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
    validateField(productId, field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setGlobalError(null);
    setSuccess(null);

    const dataToSubmit = Object.entries(prices)
      .filter(([_, value]) => value.min_price && value.max_price)
      .map(([product_id, value]) => ({
        product_id,
        min_price: parseFloat(value.min_price),
        max_price: parseFloat(value.max_price),
        date,
      }));

    // Check if there are any validation errors
    const hasErrors = Object.values(errors).some((e) => e);
    if (hasErrors || dataToSubmit.length === 0) {
      setGlobalError("Please fix the validation errors before submitting.");
      setSubmitting(false);
      return;
    }

    try {
      await api.post("/api/prices/update-multiple", dataToSubmit);
      setSuccess("Prices added/updated successfully!");
      setPrices({});
      setErrors({});
      setTimeout(() => navigate("/daily-price"), 2000);
    } catch (err) {
      setGlobalError("Failed to update prices.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (globalError) return <div className="text-center text-red-500">{globalError}</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Add Daily Price Ranges</h2>

        {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}
        {globalError && <p className="text-red-500 text-sm mb-4 text-center">{globalError}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-300">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Min Price (Rs.)</th>
                  <th className="px-4 py-2 text-left">Max Price (Rs.)</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm">
                {products.map((product) => {
                  const errorMsg = errors[product.id];
                  const hasError = !!errorMsg;

                  return (
                    <tr key={product.id} className="border-b">
                      <td className="px-4 py-2">{product.name}</td>
                      <td className="px-4 py-2">{product.type}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={prices[product.id]?.min_price || ""}
                          onChange={(e) =>
                            handlePriceChange(product.id, "min_price", e.target.value)
                          }
                          className={`w-full p-2 border ${hasError ? "border-red-500" : "border-gray-300"
                            } rounded-lg`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={prices[product.id]?.max_price || ""}
                          onChange={(e) =>
                            handlePriceChange(product.id, "max_price", e.target.value)
                          }
                          className={`w-full p-2 border ${hasError ? "border-red-500" : "border-gray-300"
                            } rounded-lg`}
                        />
                        {hasError && (
                          <p className="text-red-500 text-xs mt-1">{errorMsg}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            {submitting ? "Saving..." : "Save All Price Ranges"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/daily-price")}
            className="w-full mt-2 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition duration-300"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );

};

export default AddDailyPrice;