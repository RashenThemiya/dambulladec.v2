import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import ConfirmWrapper from "../../components/ConfirmWrapper"; // Adjust the import path as needed
import { FaDownload } from "react-icons/fa"; // Optional icon for confirmation dialog
import { useAuth } from "../../context/AuthContext"; // Adjust the import path as needed

const Report = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const { name, role } = useAuth();

    console.log("Logged in user:", name, "Role:", role);

    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    const handleDownloadReport1 = () => {
        const url = `${baseUrl}/api/report/monthly-income?month=${month}&year=${year}`;
        window.open(url, "_blank");
    };

    const handleDownloadReport2 = () => {
        const url = `${baseUrl}/api/report2/monthly-income?month=${month}&year=${year}`;
        window.open(url, "_blank");
    };

    const handleDownloadReport3 = () => {
        const url = `${baseUrl}/api/report3/monthly-income?month=${month}&year=${year}`;
        window.open(url, "_blank");
    };

    const getMonthOptions = () => {
        return Array.from({ length: 12 }, (_, i) => {
            const value = i + 1;
            const name = new Date(0, value - 1).toLocaleString("default", { month: "long" });
            return <option key={value} value={value}>{name}</option>;
        });
    };

    const getYearOptions = () => {
        const currentYear = today.getFullYear();
        const years = [];
        for (let i = currentYear - 5; i <= currentYear + 2; i++) {
            years.push(i);
        }
        return years.map((yr) => <option key={yr} value={yr}>{yr}</option>);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <div><Sidebar /></div>

            <div className="flex justify-center items-center flex-1 p-6">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center">Download Monthly Income Reports</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Select Month:</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            {getMonthOptions()}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Select Year:</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            {getYearOptions()}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <ConfirmWrapper
                            onConfirm={handleDownloadReport1}
                            message="Confirm Download"
                            additionalInfo={`Download Monthly Rent Payment Summary for ${new Date(0, month - 1).toLocaleString("default", { month: "long" })} ${year}?`}
                            confirmText="Download"
                            cancelText="Cancel"
                            icon={<FaDownload />}
                        >
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center">
                                Download Monthly Rent Payment Summary
                            </button>
                        </ConfirmWrapper>

                        <ConfirmWrapper
                            onConfirm={handleDownloadReport2}
                            message="Confirm Download"
                            additionalInfo={`Download Monthly Remaining Dues Report for ${new Date(0, month - 1).toLocaleString("default", { month: "long" })} ${year}?`}
                            confirmText="Download"
                            cancelText="Cancel"
                            icon={<FaDownload />}
                        >
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center">
                                Download Monthly Remaining Dues Report
                            </button>
                        </ConfirmWrapper>

                        <ConfirmWrapper
                            onConfirm={handleDownloadReport3}
                            message="Confirm Download"
                            additionalInfo={`Download Monthly Shop Payment Summary for ${new Date(0, month - 1).toLocaleString("default", { month: "long" })} ${year}?`}
                            confirmText="Download"
                            cancelText="Cancel"
                            icon={<FaDownload />}
                        >
                            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-center">
                                Download Monthly Shop Payment Summary
                            </button>
                        </ConfirmWrapper>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default Report;
