import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, // Ensure this is set in .env
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to include the token in every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response, // Return response if successful
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized! Redirecting to login...");
            localStorage.removeItem("token"); // Clear invalid token
            window.location.href = "/login"; // Redirect to login page
        }
        return Promise.reject(error);
    }
);

export default api;
