import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { Eye, PlusCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // adjust path if needed

const ProductManagement = () => {
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
                    <h1>Product Management</h1>
                    <p className="text-lg text-gray-500">Manage your products effectively</p>
                </div>

                {/* Product Management Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">

                    {/* Add New Product */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"><PlusCircle className="mr-2 text-blue-600" />Add New Product</h2>
                        <p className="text-gray-700 mb-4">Add a new product to your catalog.</p>
                        <button
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 w-full sm:w-auto"
                            onClick={() => navigate("/add-product")}
                        >
                            Add Product
                        </button>
                    </div>

                    {/* View All Products */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"><Eye className="mr-2 text-green-600" />View All Products</h2>
                        <p className="text-gray-700 mb-4">View a complete list of your products.</p>
                        <button
                            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 w-full sm:w-auto"
                            onClick={() => navigate("/view-products")}
                        >
                            View Products
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductManagement;
