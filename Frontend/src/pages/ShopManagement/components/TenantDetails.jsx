import { Mail, MapPin, Phone, User } from "lucide-react";

const TenantDetails = ({ tenant }) => {
    if (!tenant) {
        return <p className="text-gray-500 text-center">No tenant information available.</p>;
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2 flex items-center gap-2">
                <User className="text-blue-600" size={24} /> Tenant Details
            </h3>

            <div className="space-y-3 text-lg">
                <p className="text-gray-700 flex items-center gap-2">
                    <User className="text-gray-500" size={20} /> 
                    <strong className="text-gray-900">Name:</strong> {tenant.name}
                </p>
                <p className="text-gray-700 flex items-center gap-2">
                    <Phone className="text-gray-500" size={20} />
                    <strong className="text-gray-900">Contact:</strong> {tenant.contact}
                </p>
                <p className="text-gray-700 flex items-center gap-2">
                    <MapPin className="text-gray-500" size={20} />
                    <strong className="text-gray-900">Address:</strong> {tenant.address}
                </p>
                <p className="text-gray-700 flex items-center gap-2">
                    <Mail className="text-blue-500" size={20} />
                    <strong className="text-gray-900">Email:</strong> 
                    <span className="text-blue-600 underline">{tenant.email}</span>
                </p>
            </div>
        </div>
    );
};

export default TenantDetails;
