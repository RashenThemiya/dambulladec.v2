import React, { createContext, useContext, useEffect, useState } from "react";

// Create the Auth context
const AuthContext = createContext();

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

// Auth Provider to manage authentication state
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [role, setRole] = useState(localStorage.getItem("role") || null);
    const [name, setName] = useState(localStorage.getItem("name") || null);

    // Sync with localStorage when values change
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            localStorage.setItem("name", name);
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("name");
        }
    }, [token, role, name]);

    // Logout function
    const logout = () => {
        setToken(null);
        setRole(null);
        setName(null);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
    };

    return (
        <AuthContext.Provider value={{ token, setToken, role, setRole, name, setName, logout }}>
            {children}
        </AuthContext.Provider>
    );
};