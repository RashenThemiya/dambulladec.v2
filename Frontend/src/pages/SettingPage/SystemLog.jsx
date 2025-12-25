import React, { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const SystemLog = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [eventType, setEventType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [shopId, setShopId] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token");
            if (!token) {
                alert("Unauthorized! Please log in first.");
                navigate("/login");
                return;
            }

            try {
                const response = await api.get("/api/audit", {
                    headers: { "Authorization": `Bearer ${token}` },
                    params: { event_type: eventType, start_date: startDate, end_date: endDate, shop_id: shopId, page, limit },
                });

                setLogs(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                setError(error.response?.data?.message || "Failed to fetch logs. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [navigate, eventType, startDate, endDate, shopId, page]);

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-6xl overflow-x-auto">
                <div className="flex justify-between items-center mb-4">
                    <button
                        className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                    <h2 className="text-3xl font-semibold text-gray-800 text-center flex-grow">System Logs</h2>
                </div>

                {/* Filters Section */}
                <div className="flex flex-wrap gap-4 justify-between mb-4">
                    <select
                        className="p-2 border rounded w-full sm:w-auto"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                    >
                        <option value="">All Events</option>
                        <option value="Payment Made">Payment Made</option>
                        <option value="Invoice Generated">Invoice Generated</option>
                        <option value="Fine Applied">Fine Applied</option>
                        <option value="Correction">Correction</option>
                    </select>
                    <input
                        type="date"
                        className="p-2 border rounded w-full sm:w-auto"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                        type="date"
                        className="p-2 border rounded w-full sm:w-auto"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <input
                        type="text"
                        className="p-2 border rounded w-full sm:w-auto"
                        placeholder="Shop ID"
                        value={shopId}
                        onChange={(e) => setShopId(e.target.value)}
                    />
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {logs.length > 0 ? (
                            <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border p-2">Log ID</th>
                                        <th className="border p-2">Shop ID</th>
                                        <th className="border p-2">Invoice ID</th>
                                        <th className="border p-2">Event Type</th>
                                        <th className="border p-2">Description</th>
                                        <th className="border p-2">Old Value</th>
                                        <th className="border p-2">New Value</th>
                                        <th className="border p-2">Edit Reason</th>
                                        <th className="border p-2">Event Date</th>
                                        <th className="border p-2">User Actioned</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <tr key={index} className="border hover:bg-gray-100">
                                            <td className="border p-2 text-center">{log.audit_id}</td>
                                            <td className="border p-2 text-center">{log.shop_id || "N/A"}</td>
                                            <td className="border p-2 text-center">{log.invoice_id || "N/A"}</td>
                                            <td className="border p-2">{log.event_type}</td>
                                            <td className="border p-2">{log.event_description}</td>
                                            <td className="border p-2">{log.old_value || "N/A"}</td>
                                            <td className="border p-2">{log.new_value || "N/A"}</td>
                                            <td className="border p-2">{log.edit_reason || "N/A"}</td>
                                            <td className="border p-2">{log.event_date ? new Date(log.event_date).toLocaleString() : "N/A"}</td>
                                            <td className="border p-2">{log.user_actioned}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-600">No logs available.</p>
                        )}
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                    <button
                        className="p-2 bg-blue-500 text-white rounded disabled:opacity-50 flex items-center"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                    >
                        <FiChevronLeft className="mr-1" /> Previous
                    </button>
                    <span className="p-2">Page {page}</span>
                    <button
                        className="p-2 bg-blue-500 text-white rounded flex items-center"
                        onClick={() => setPage((prev) => prev + 1)}
                    >
                        Next <FiChevronRight className="ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemLog;
