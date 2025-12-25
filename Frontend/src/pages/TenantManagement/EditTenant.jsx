import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiEdit3 } from "react-icons/fi";
import api from "../../utils/axiosInstance";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { useAuth } from "../../context/AuthContext";

const EditTenant = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [tenant, setTenant] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const response = await api.get(`/api/tenants/${id}`);
                setTenant(response.data);
            } catch (err) {
                setError("❌ Failed to load tenant details.");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchTenant();
    }, [id]);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const handleChange = (e) => {
        setTenant((prevTenant) => ({
            ...prevTenant,
            [e.target.name]: e.target.value,
        }));
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await api.put(`/api/tenants/${id}`, tenant);
            setSuccess("✅ Tenant updated successfully! Redirecting...");
            setTimeout(() => {
                navigate("/view-tenants");
            }, 2000);
        } catch (err) {
            setError("❌ Failed to update tenant.");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="text-center">Loading...</div>;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    Editing Tenant ID: {id} – {tenant.name || "Loading..."}
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
                        {success}
                    </div>
                )}

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tenant Name</label>
                        <input
                            type="text"
                            name="name"
                            value={tenant.name || ""}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tenant Contact</label>
                        <input
                            type="text"
                            name="contact"
                            value={tenant.contact || ""}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tenant Address</label>
                        <input
                            type="text"
                            name="address"
                            value={tenant.address || ""}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tenant Email</label>
                        <input
                            type="email"
                            name="email"
                            value={tenant.email || ""}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Shop ID</label>
                        <input
                            type="text"
                            name="shop_id"
                            value={tenant.shop_id || ""}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                            disabled
                        />
                    </div>

                    <ConfirmWrapper
                        open={showConfirm}
                        message={`Update Confirmation for Tenant ID: ${id}`}
                        additionalInfo={`Are you sure you want to update "${tenant.name}" (Tenant ID: ${id})? Changes will be saved immediately.`}
                        confirmText="Yes, Update Tenant"
                        cancelText="No, Cancel"
                        onConfirm={() => {
                            setShowConfirm(false);
                            handleUpdate();
                        }}
                        onCancel={() => setShowConfirm(false)}
                        icon={<FiEdit3 />}
                    >
                        <button
                            type="button"
                            onClick={() => setShowConfirm(true)}
                            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-300"
                            disabled={loading}
                        >
                            {loading ? "Updating..." : "Update"}
                        </button>
                    </ConfirmWrapper>

                    <button
                        type="button"
                        onClick={() => navigate("/view-tenants")}
                        className="w-full mt-2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditTenant;
