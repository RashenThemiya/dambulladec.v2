import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { useAuth } from "../../context/AuthContext";

const ViewPublications = () => {
    const navigate = useNavigate();
    const [publications, setPublications] = useState([]);
    const [activeTab, setActiveTab] = useState("notice");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);

    // Fetch publications from the API
    useEffect(() => {
        const fetchPublications = async () => {
            try {
                const response = await api.get("/api/publications");
                setPublications(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch publications.");
            } finally {
                setLoading(false);
            }
        };
        fetchPublications();
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

    const handleDeletePublication = async (id) => {
        try {
            const deleted = publications.find(pub => pub.id === id);
            await api.delete(`/api/publications/${id}`);
            setPublications(publications.filter((pub) => pub.id !== id));
            setSuccessMessage(`✅ Publication "${deleted?.topic}" deleted successfully.`);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete publication.");
        }
    };

    const filteredPublications = publications.filter((pub) => pub.type === activeTab);

    const tabClasses = (tab) =>
        `px-4 py-2 rounded-t-lg font-semibold ${activeTab === tab ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-700"
        }`;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 py-10 relative">
            <div className="bg-white shadow-xl rounded-lg w-full max-w-6xl p-6">
                <h2 className="text-3xl font-bold text-center mb-6">View Publications</h2>

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-6">
                    {["notice", "announcement", "news", "event"].map((tab) => (
                        <button
                            key={tab}
                            className={tabClasses(tab)}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
                        ❌ {error}
                    </div>
                )}

                {/* Loading/Error/Empty State */}
                {loading ? (
                    <div className="text-center text-gray-500">Loading...</div>
                ) : filteredPublications.length === 0 ? (
                    <div className="text-center text-gray-600">No {activeTab} found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border rounded-lg">
                            <thead className="bg-teal-600 text-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium">ID</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium">Topic</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium">Description</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium">Image</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {filteredPublications.map((pub) => (
                                    <tr key={pub.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">{pub.id}</td>
                                        <td className="px-6 py-4 text-sm">{pub.topic}</td>
                                        <td className="px-6 py-4 text-sm">{pub.description}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {pub.image ? (
                                                <img
                                                    src={pub.image}
                                                    alt="Publication"
                                                    className="w-20 h-20 object-cover rounded shadow"
                                                />
                                            ) : (
                                                <span className="text-gray-400 italic">No image</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <ConfirmWrapper
                                                message={`Are you sure you want to delete the publication "${pub.topic}"? This action cannot be undone.`}
                                                onConfirm={() => handleDeletePublication(pub.id)}
                                            >
                                                <button className="bg-red-600 text-white py-1 px-3 rounded-lg hover:bg-red-700 transition duration-200">
                                                    Delete
                                                </button>
                                            </ConfirmWrapper>
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
                onClick={() => navigate("/publication")}
                className="fixed bottom-8 right-8 bg-gray-800 text-white py-3 px-6 rounded-full shadow-lg hover:bg-gray-900 transition duration-200"
            >
                Back to Main Menu
            </button>
        </div>
    );
};

export default ViewPublications;
