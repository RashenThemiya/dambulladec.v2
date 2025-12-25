import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const ViewDailyPrice = () => {
  const navigate = useNavigate();
  const [dailyPrices, setDailyPrices] = useState([]);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchItem, setSearchItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  useEffect(() => {
    const fetchDailyPrices = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/prices/by-date/${searchDate}`);
        setDailyPrices(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch daily prices.");
      } finally {
        setLoading(false);
      }
    };
    fetchDailyPrices();
  }, [searchDate]);

  const handleEdit = (date, productId) => {
    navigate(`/edit-dailyprice/${date}/${productId}`);
  };

  const handleNavigateToProductSummary = (productId) => {
    navigate(`/product-summary/${productId}`);
  };

  const filteredPrices = dailyPrices.filter((price) =>
    price.product?.name?.toLowerCase().includes(searchItem.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8 relative">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-6xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">View Daily Prices</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
          <input
            type="text"
            placeholder="Search by item name"
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-6">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-6">{error}</div>
        ) : filteredPrices.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No daily prices found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Min Price</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Max Price</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{price.id}</td>
                    <td className="px-6 py-4 text-sm">{price.date}</td>
                    <td
                      className="px-6 py-4 text-sm text-blue-600 cursor-pointer underline"
                      onClick={() => handleNavigateToProductSummary(price.product.id)}
                    >
                      {highlight(price.product?.name || "N/A", searchItem)}
                    </td>
                    <td className="px-6 py-4 text-sm">Rs. {price.min_price}</td>
                    <td className="px-6 py-4 text-sm">Rs. {price.max_price}</td>
                    <td className="px-6 py-4 text-sm flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(price.date, price.product.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Back Button */}
      <button
        onClick={() => navigate("/daily-price")}
        className="fixed bottom-8 right-8 bg-gray-800 text-white py-3 px-6 rounded-full shadow-lg hover:bg-gray-900 transition duration-200"
      >
        Back to Management
      </button>
    </div>
  );
};

// Highlighting helper
function highlight(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default ViewDailyPrice;
