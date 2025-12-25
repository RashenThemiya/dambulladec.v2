import React from 'react';
import Sidebar from '../components/Sidebar';

const AdminDashboard = () => {
    return (

        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Component */}

            <div> <Sidebar /></div>
            {/* Main Content */}
            <div className="flex-1 p-6 transition-all duration-300">

                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome to the admin dashboard. Manage your content efficiently.</p>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold">Users</h2>
                        <p className="text-sm">Manage registered users</p>
                    </div>
                    <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold">Analytics</h2>
                        <p className="text-sm">View site performance</p>
                    </div>
                    <div className="bg-red-500 text-white p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold">Settings</h2>
                        <p className="text-sm">Configure dashboard settings</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
