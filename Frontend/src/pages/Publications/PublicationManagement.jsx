import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { Eye, PlusCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // adjust path if needed

const PublicationManagement = () => {
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
                    <h1>Publication Management</h1>
                    <p className="text-lg text-gray-500">Manage publications efficiently</p>
                </div>

                {/* Publication Management Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">

                    {/* Add New Publication */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"><PlusCircle className="mr-2 text-blue-600" />Add New Publication</h2>
                        <p className="text-gray-700 mb-4">Create a new publication to share with users.</p>
                        <button
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 w-full sm:w-auto"
                            onClick={() => navigate("/add-publication")}
                        >
                            Add Publication
                        </button>
                    </div>


                    {/* View All Publications */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"><Eye className="mr-2 text-green-600" />View All Publications</h2>
                        <p className="text-gray-700 mb-4">See the complete list of all publications.</p>
                        <button
                            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 w-full sm:w-auto"
                            onClick={() => navigate("/view-publications")}
                        >
                            View Publications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicationManagement;
