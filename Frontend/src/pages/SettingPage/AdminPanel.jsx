import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";

const AdminPanel = () => {
  const token = localStorage.getItem("token");
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [passwordChange, setPasswordChange] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  const headers = { Authorization: `Bearer ${token}` };
  const { name } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  }, [token]);

  const fetchAdmins = async () => {
    try {
      const response = await api.get("/api/admin/list", { headers });
      setAdmins(response.data.admins);
    } catch (error) {
      toast.error("Failed to fetch admins");
      console.error(error);
    }
  };

  const handleRegister = async () => {
    const { username, email, password, role } = newAdmin;

    if (!username || !email || !password) {
      toast.warning("Fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/admin/register", newAdmin, { headers });
      toast.success(res.data.message);
      fetchAdmins();
      setNewAdmin({ username: "", email: "", password: "", role: "admin" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error registering admin");
      console.error("Registration Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword } = passwordChange;

    if (!currentPassword || !newPassword) {
      toast.warning("Please fill in both fields");
      return;
    }

    try {
      setLoading(true);
      const res = await api.put(
        "/api/admin/change-password",
        { currentPassword, newPassword },
        { headers }
      );
      toast.success(res.data.message);
      setPasswordChange({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error changing password");
      console.error("Password Change Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete admin handler
  const handleDeleteAdmin = async (email, adminRole) => {
    if (adminRole === "superadmin") {
      toast.error("Cannot delete Super Admin accounts");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete admin ${email}?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.delete("/api/admin/delete-by-email", {
        headers,
        data: { email },
      });
      toast.success(res.data.message);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting admin");
      console.error("Delete Admin Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="p-8 w-full overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Management</h1>

        {/* Register Admin */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Register New Admin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username"
              className="border rounded p-2"
              value={newAdmin.username}
              onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="border rounded p-2"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="border rounded p-2"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
            />
            <select
              className="border rounded p-2"
              value={newAdmin.role}
              onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
            >
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="tiketing">Tiketing</option>
              <option value="editor">Editor</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <ConfirmWrapper onConfirm={handleRegister}>
            <button
              className={`mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register Admin"}
            </button>
          </ConfirmWrapper>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="Current Password"
              className="border rounded p-2"
              value={passwordChange.currentPassword}
              onChange={(e) =>
                setPasswordChange({ ...passwordChange, currentPassword: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="New Password"
              className="border rounded p-2"
              value={passwordChange.newPassword}
              onChange={(e) =>
                setPasswordChange({ ...passwordChange, newPassword: e.target.value })
              }
            />
          </div>
          <ConfirmWrapper onConfirm={handlePasswordChange}>
            <button
              className={`mt-4 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </ConfirmWrapper>
        </div>

        {/* Admin List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Admin List</h2>
          {admins.length === 0 ? (
            <p className="text-gray-600">No admins found.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2">ID</th>
                  <th className="py-2">Username</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.admin_id} className="border-b hover:bg-gray-100">
                    <td className="py-2">{admin.admin_id}</td>
                    <td className="py-2">{admin.username}</td>
                    <td className="py-2">{admin.email}</td>
                    <td className="py-2">{admin.role}</td>
                    <td className="py-2">
                      {role === "superadmin" && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.email, admin.role)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          disabled={loading || admin.role === "superadmin"}
                          title={
                            admin.role === "superadmin"
                              ? "Cannot delete Super Admin"
                              : "Delete Admin"
                          }
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
