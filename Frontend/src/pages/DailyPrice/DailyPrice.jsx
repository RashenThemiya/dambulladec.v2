import { Eye, PlusCircle } from "lucide-react"; // optional icons
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext"; // adjust path if needed



const DailyPrice = () => {
  const navigate = useNavigate();
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="p-8 w-full overflow-auto">
        <div className="text-3xl font-semibold mb-8">
          <h1>Daily Price Management</h1>
          <p className="text-lg text-gray-500">Manage product price ranges with ease</p>
        </div>

        {/* Daily Price Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {/* Add Daily Price Range */}
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <PlusCircle className="mr-2 text-blue-600" /> Add Price Range
            </h2>
            <p className="text-gray-700 mb-4">
              Set minimum and maximum prices for each product.
            </p>
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 w-full sm:w-auto"
              onClick={() => navigate("/add-dailyprice")}
            >
              Add Daily Price Range
            </button>
          </div>

          {/* View Daily Price Ranges */}
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Eye className="mr-2 text-green-600" /> View Price History
            </h2>
            <p className="text-gray-700 mb-4">
              Browse daily price ranges that have been recorded.
            </p>
            <button
              className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 w-full sm:w-auto"
              onClick={() => navigate("/view-dailyprices")}
            >
              View Price Ranges
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPrice;
