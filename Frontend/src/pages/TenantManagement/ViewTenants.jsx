import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const ITEMS_PER_PAGE = 10;

const ViewTenants = () => {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [confirmDeleteTenantId, setConfirmDeleteTenantId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const response = await api.get("/api/tenants");
                setTenants(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch tenants.");
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

    const handleDeleteTenant = async (tenantId) => {
        try {
            await api.delete(`/api/tenants/${tenantId}`);
            const deleted = tenants.find(t => t.tenant_id === tenantId);
            setTenants(prev => prev.filter((t) => t.tenant_id !== tenantId));
            setSuccessMessage(`✅ Tenant "${deleted?.name}" with ID "${deleted?.tenant_id}" deleted successfully!`);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete tenant.");
        } finally {
            setConfirmDeleteTenantId(null);
        }
    };

    const filteredTenants = tenants.filter((tenant) =>
        tenant.tenant_id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.shop_id?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );


    const totalPages = Math.ceil(filteredTenants.length / ITEMS_PER_PAGE);
    const currentTenants = filteredTenants.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8 relative">
            <div className="bg-white shadow-lg rounded-lg w-full max-w-6xl p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">View All Tenants</h2>

                <input
                    type="text"
                    placeholder="Search by ID, Name, Contact, Email or Shop ID"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full mb-6 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
                />

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
                        ❌ {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-gray-500">Loading...</div>
                ) : filteredTenants.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No tenants found.</div>
                ) : (
                    <div className="overflow-x-auto rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-teal-600 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Tenant ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Contact</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Shop ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentTenants.map((tenant) => (
                                    <tr key={tenant.tenant_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">{highlight(tenant.tenant_id.toString(), searchQuery)}</td>
                                        <td className="px-6 py-4 text-sm">{highlight(tenant.name, searchQuery)}</td>
                                        <td className="px-6 py-4 text-sm">{highlight(tenant.contact, searchQuery)}</td>
                                        <td className="px-6 py-4 text-sm">{highlight(tenant.email, searchQuery)}</td>
                                        <td
                                            className="px-6 py-4 text-sm text-blue-600 cursor-pointer underline"
                                            onClick={() => navigate(`/shop-summary/${tenant.shop_id}`)}
                                        >
                                            {highlight(tenant.shop_id.toString(), searchQuery)}
                                        </td>
                                        <td className="px-6 py-4 text-sm flex flex-wrap gap-2">
                                            <button
                                                onClick={() => navigate(`/edit-tenant/${tenant.tenant_id}`)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm"
                                            >
                                                Edit
                                            </button>
                                            <ConfirmWrapper
                                                message={`Are you sure you want to permanently delete tenant "${tenant.name}" with ID "${tenant.tenant_id}"?`}
                                                onConfirm={() => handleDeleteTenant(tenant.tenant_id)}
                                            >
                                                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
                                                    Delete
                                                </button>
                                            </ConfirmWrapper>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex justify-center items-center mt-6 gap-4">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Back Button */}
            <button
                onClick={() => navigate("/tenant-management")}
                className="fixed bottom-8 right-8 bg-gray-800 text-white py-3 px-6 rounded-full shadow-lg hover:bg-gray-900 transition duration-200"
            >
                Back to Management
            </button>
        </div>
    );
};

function highlight(text, query) {
    if (!text || !query) return text || ""; // Handles null, undefined, or empty string
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200">{part}</mark>
        ) : (
            part
        )
    );
}


export default ViewTenants;
