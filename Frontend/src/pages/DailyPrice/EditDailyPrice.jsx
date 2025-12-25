import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const EditDailyPrice = () => {
  const navigate = useNavigate();
  const { date, productId } = useParams();
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);
  const [dailyPrice, setDailyPrice] = useState({
    minPrice: "",
    maxPrice: "",
    date: date,
    productId: productId,
  });
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const priceResponse = await api.get(`/api/prices/product/${productId}/date/${date}`);

        if (priceResponse.data && priceResponse.data.product_id) {
          const productResponse = await api.get(`/api/products/${priceResponse.data.product_id}`);

          setDailyPrice({
            minPrice: priceResponse.data.min_price,
            maxPrice: priceResponse.data.max_price,
            date: priceResponse.data.date,
            productId: priceResponse.data.product_id,
          });

          setProductName(productResponse.data.name);
        } else {
          throw new Error("Price data is missing in the response.");
        }
      } catch (err) {
        console.error("Error fetching daily price:", err);
        setError("Failed to load daily price.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDailyPrice((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/api/prices/product/${productId}/date/${date}`, {
        min_price: dailyPrice.minPrice,
        max_price: dailyPrice.maxPrice,
      });

      alert("Daily price range updated successfully!");
      navigate("/view-dailyprices");
    } catch (err) {
      console.error("Error updating daily price:", err);
      setError("Failed to update daily price.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Edit Price Range for {productName} on {date}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="text"
              value={date}
              disabled
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Product</label>
            <input
              type="text"
              value={productName}
              disabled
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Min Price (Rs.)</label>
            <input
              type="number"
              name="minPrice"
              value={dailyPrice.minPrice}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max Price (Rs.)</label>
            <input
              type="number"
              name="maxPrice"
              value={dailyPrice.maxPrice}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Price Range"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/view-dailyprices")}
            className="w-full mt-2 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition duration-300"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditDailyPrice;
