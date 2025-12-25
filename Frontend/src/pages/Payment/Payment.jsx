import { CreditCard, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";



const Payment = () => {
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
                    <h1>Payment Management</h1>
                    <p className="text-lg text-gray-500">Manage payments efficiently</p>
                </div>

                {/* Payment Management Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {/* Make a Payment */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"><CreditCard className="mr-2 text-green-600" />Make a Payment</h2>
                        <p className="text-gray-700 mb-4">Process a new payment quickly and securely.</p>
                        <button
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 w-full sm:w-auto"
                            onClick={() => navigate("/make-payment")}
                        >
                            Make Payment
                        </button>
                    </div>

                    {/* Correct a Payment */}
                {/* <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"><FileEdit className="mr-2 text-green-600" />Payment Correction</h2>
                        <p className="text-gray-700 mb-4">Modify or correct payment mistake.</p>
                        <button
                            className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 w-full sm:w-auto"
                            onClick={() => navigate("/correct-payment")}
                        >
                            Correct Payment
                        </button>
                    </div>*/}
                    {/* View All Payments */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <h2 className="text-xl font-semibold mb-4 flex items-center"><Eye className="mr-2 text-green-600" />View All Payments</h2>
                        <p className="text-gray-700 mb-4">Check all previous payments and transactions.</p>
                        <button
                            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 w-full sm:w-auto"
                            onClick={() => navigate("/view-payments")}
                        >
                            View Payments
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
