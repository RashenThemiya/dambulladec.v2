import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const { setToken, setRole, setName } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
       try {
    const res = await api.post("/api/admin/login", { email, password });
    const { token, role, name } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("name", name);

    setToken(token);
    setRole(role);
    setName(name);

    // Redirect based on role
    if (["superadmin", "admin", "editor", "manager"].includes(role)) {
        navigate("/admin-dashboard");
    } else if (role === "tiketing") {
        // Clear session and redirect to login or show error
        localStorage.clear();
        setToken(null);
        setRole(null);
        setName(null);
        setError("Unauthorized role");
        navigate("/login");
    } else {
        setError("Invalid role");
        navigate("/login");
    }
} catch (err) {
    setError(err.response?.data?.message || "Login failed");
} finally {
    setLoading(false);
}

    };

    return (
        <section
            className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-green-300 px-4"
        >
            <div className="w-full max-w-5xl rounded-lg shadow-xl overflow-hidden flex flex-col lg:flex-row bg-white">
                {/* Left Side */}
                <div
                    className="lg:w-1/2 flex flex-col justify-center p-12 bg-gradient-to-tr from-green-600 via-green-500 to-blue-700 text-white"
                    style={{ minHeight: "500px" }}
                >
                    <h2 className="text-4xl font-extrabold mb-4 drop-shadow-md">
                        Welcome Back!
                    </h2>
                    <p className="text-lg leading-relaxed drop-shadow-sm">
                        Please log in to access the admin system. Only authorized admins
                        allowed.
                    </p>

                </div>

                {/* Right Side */}
                <div
                    className="lg:w-1/2 p-12 bg-white flex flex-col justify-center"
                    style={{ minHeight: "500px" }}
                >
                    <div className="mb-8 text-center">
                        <img
                            className="mx-auto w-40 rounded-md shadow-md"
                            src="/images/logo.jpg"
                            alt="logo"
                        />
                        <h3 className="mt-4 text-3xl font-semibold text-gray-800">
                            Admin Login Portal
                        </h3>
                        <p className="text-gray-600 mt-2">
                            Enter your credentials to continue
                        </p>
                    </div>

                    {error && (
                        <p className="text-red-600 text-center mb-6 font-medium">{error}</p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block mb-1 font-medium text-gray-700"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="relative">
                            <label
                                htmlFor="password"
                                className="block mb-1 font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <FaEyeSlash className="h-5 w-5" />
                                    ) : (
                                        <FaEye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>


                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="remember"
                                className="ml-2 block text-sm text-gray-700 select-none"
                            >
                                Remember Me
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-md shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                "Login"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
