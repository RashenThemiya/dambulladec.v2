import React, { useState } from "react";
import {
    FaBars,
    FaBox,
    FaChartBar,
    FaCog,
    FaFileInvoice,
    FaHome,
    FaMoneyBill,
    FaNewspaper,
    FaSignOutAlt,
    FaStore,
    FaTag,
    FaTimes,
    FaToilet,
    FaTruckPickup,
    FaUser
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./../context/AuthContext"; // Adjust the path as needed
import ConfirmWrapper from "./ConfirmWrapper"; // Adjust the path as needed

const menuItems = [
    { path: "/admin-dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/shop-management", icon: <FaStore />, label: "Shop Management" },
    { path: "/tenant-management", icon: <FaUser />, label: "Tenant Management" },
    { path: "/payments", icon: <FaMoneyBill />, label: "Payments" },
    { path: "/invoices", icon: <FaFileInvoice />, label: "Invoices" },
    { path: "/reports", icon: <FaChartBar />, label: "Reports" },
    { path: "/product-management", icon: <FaBox />, label: "Product" },
    { path: "/daily-price", icon: <FaTag />, label: "Daily Price" },
    { path: "/VehicleTicketDashboard", icon: <FaTruckPickup />, label: "Vehicle Ticketing" },
    { path: "/SanitationDashboard", icon: <FaNewspaper />, label: "Sanitation Dashboard" },
    { path: "/settings", icon: <FaCog />, label: "Settings" },
    { path: "/publication", icon: <FaNewspaper />, label: "Publication" },
      

];

const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsExpanded((prev) => !prev);
    };

    const handleLogout = () => {
        logout();
        navigate("/"); // Navigate to home page after logout
    };

    return (
        <>
            {/* Sidebar for larger screens (Desktop) */}
            <div className={`bg-gray-900 text-white transition-all duration-300 ${isExpanded ? "w-64" : "w-16"} fixed md:relative top-0 left-0 h-full z-50 flex flex-col hidden md:flex`}>
                <button className="text-white p-4 focus:outline-none hover:bg-gray-700 transition md:flex items-center justify-center" onClick={toggleSidebar}>
                    {isExpanded ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
                <ul className="mt-4 space-y-2 flex-grow">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link to={item.path} className="flex items-center p-2 hover:bg-gray-700 transition rounded-lg">
                                <span className="text-xl ml-4 mr-4">{item.icon}</span>
                                <span className={`transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0 hidden"}`}>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
                {/* Logout Button with ConfirmWrapper */}
                <ConfirmWrapper onConfirm={handleLogout} message={"Are you sure you want to logout?"}>

                    <button
                        className="flex items-center p-2 mt-auto hover:bg-red-600 transition rounded-lg text-white w-full text-left"
                    >
                        <span className="text-xl ml-4 mr-4"><FaSignOutAlt /></span>
                        <span className={`transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0 hidden"}`}>Logout</span>
                    </button>
                </ConfirmWrapper>
            </div>

            {/* Sidebar for mobile view (Bottom navigation) */}
            <div className="bg-gray-900 text-white fixed bottom-0 left-0 w-full flex justify-around p-2 md:hidden z-50">
                {menuItems.map((item) => (
                    <Link key={item.path} to={item.path} className="flex flex-col items-center">
                        <span className="text-xl">{item.icon}</span>
                    </Link>
                ))}
                {/* Mobile Logout with ConfirmWrapper */}
                <ConfirmWrapper onConfirm={handleLogout} message={"Are you sure you want to logout?"}>
                    <button className="flex flex-col items-center text-red-500">
                        <span className="text-xl"><FaSignOutAlt /></span>
                    </button>
                </ConfirmWrapper>
            </div>
        </>
    );
};

export default Sidebar;
