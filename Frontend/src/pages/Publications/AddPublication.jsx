import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { FiPlusCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext"; // Adjust the import path as needed

const AddPublication = () => {
    const navigate = useNavigate();
    const [publication, setPublication] = useState({
        type: "",
        topic: "",
        description: "",
        image: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPublication({ ...publication, [name]: value });
    };

    const handleFileChange = (e) => {
        setPublication({ ...publication, image: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConfirmed) return;

        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
            setError("Unauthorized! Please log in first.");
            navigate("/login");
            return;
        }

        const formData = new FormData();
        formData.append("type", publication.type);
        formData.append("topic", publication.topic);
        formData.append("description", publication.description);
        if (publication.image) {
            formData.append("image", publication.image);
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/publications`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                setShowSuccess(true);
                setPublication({ type: "", topic: "", description: "", image: null });

                setTimeout(() => {
                    setShowSuccess(false);
                    navigate("/publication");
                }, 2000);
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Unknown error occurred.");
            }
        } catch (error) {
            console.error("Error adding publication:", error);
            setError("An error occurred while adding the publication.");
        } finally {
            setLoading(false);
            setIsConfirmed(false);
        }
    };

    const handleConfirm = () => {
        setIsConfirmed(true);
        handleSubmit(new Event("submit"));
    };

    const handleCancel = () => {
        setIsConfirmed(false);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Add New Publication</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
                        ❌ {error}
                    </div>
                )}

                {showSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
                        ✅ Publication has been added successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <select
                        name="type"
                        value={publication.type}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                    >
                        <option value="">Select Type</option>
                        <option value="notice">Notice</option>
                        <option value="news">News</option>
                        <option value="announcement">Announcement</option>
                        <option value="event">Event</option>
                    </select>

                    <input
                        type="text"
                        name="topic"
                        placeholder="Topic"
                        value={publication.topic}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Description"
                        value={publication.description}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                    />

                    <input
                        type="file"
                        name="image"
                        onChange={handleFileChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    />

                    <ConfirmWrapper
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                        message="Confirm Adding Publication"
                        additionalInfo="Please verify all details before submission."
                        confirmText="Yes, Add Publication"
                        cancelText="No, Go Back"
                        icon={<FiPlusCircle />}
                        buttonBackgroundColor="bg-blue-600"
                        buttonTextColor="text-white"
                    >
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                            disabled={loading}
                        >
                            {loading ? "Adding..." : "Add Publication"}
                        </button>
                    </ConfirmWrapper>

                    <button
                        type="button"
                        onClick={() => navigate("/publication")}
                        className="w-full mt-2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddPublication;
