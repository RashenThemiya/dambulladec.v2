import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiEdit3 } from "react-icons/fi";
import api from "../../utils/axiosInstance";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { useAuth } from "../../context/AuthContext";

const EditShop = () => {
    const navigate = useNavigate();
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);
    const { id } = useParams();
    const [shop, setShop] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const response = await api.get(`/api/shops/${id}`);
                setShop(response.data);
            } catch (err) {
                setError("❌ Failed to load shop details.");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchShop();
    }, [id]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleChange = (e) => {
        setShop((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await api.put(`/api/shops/${id}`, shop);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                navigate("/view-shops");
            }, 2000);
        } catch (err) {
            setError("❌ Failed to update shop.");
        } finally {
            setLoading(false);
            setIsConfirmed(false);
        }
    };

    const handleConfirm = () => {
        setIsConfirmed(true);
        handleUpdate();
    };

    const handleCancel = () => {
        setIsConfirmed(false);
        setShowConfirm(false);
    };

    if (initialLoading) return <div className="text-center">Loading...</div>;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    Edit Shop ID: {id} – {shop.shop_name || "Loading..."}
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
                        {error}
                    </div>
                )}

                {showSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
                        ✅ Shop has been updated successfully!
                    </div>
                )}

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    {["shop_name", "location", "rent_amount", "vat_rate", "operation_fee"].map((field) => (
                        <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 capitalize">
                                {field.replace("_", " ")}
                            </label>
                            <input
                                type={field.includes("amount") || field.includes("rate") ? "number" : "text"}
                                name={field}
                                value={shop[field] || ""}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                    ))}

                    <ConfirmWrapper
                        open={showConfirm}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                        message={`Update Confirmation for Shop ID: ${id}`}
                        additionalInfo={`Are you sure you want to update "${shop.shop_name}" (ID: ${id})? This will immediately apply changes.`}
                        confirmText="Yes, Update Shop"
                        cancelText="No, Go Back"
                        icon={<FiEdit3 />}
                    >
                        <button
                            type="button"
                            onClick={() => setShowConfirm(true)}
                            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-300"
                            disabled={loading}
                        >
                            {loading ? "Updating..." : "Update Shop"}
                        </button>
                    </ConfirmWrapper>

                    <button
                        type="button"
                        onClick={() => navigate("/view-shops")}
                        className="w-full mt-2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditShop;
