import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { Eye, PlusCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ShopManagement = () => {
    const navigate = useNavigate();
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);

    return (
        <div className="flex flex-col md:flex-row h-screen">
            {/* Sidebar - Ensure proper width */}
            <Sidebar />

            {/* Main Content */}
            <div className="p-8 w-full overflow-auto">
                <div className="text-3xl font-semibold mb-8">
                    <h1>Shop Management</h1>
                    <p className="text-lg text-gray-500">Manage your shops efficiently</p>
                </div>

                {/* Shop Management Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {/* Add New Shop */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"><PlusCircle className="mr-2 text-blue-600" /> Add New Shop</h2>
                        <p className="text-gray-700 mb-4">Create a new shop and add all the details for smooth management.</p>
                        <button
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 w-full sm:w-auto"
                            onClick={() => navigate("/add-shop")}
                        >
                            Add Shop
                        </button>
                    </div>



                    {/* View All Shops */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"> <Eye className="mr-2 text-green-600" /> View All Shops</h2>
                        <p className="text-gray-700 mb-4">View the list of all the shops you've added for easy management.</p>
                        <button
                            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 w-full sm:w-auto"
                            onClick={() => navigate("/view-shops")}
                        >
                            View Shops
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopManagement;
