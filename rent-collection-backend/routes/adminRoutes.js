const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 📝 Register a New Admin (Super Admin Only)
 * Route: POST /api/admin/register
 * Access: Super Admin
 */router.post("/register", authenticateUser, authorizeRole(["superadmin"]), async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Validate role
    if (!["superadmin", "admin", "tiketing", "editor", "manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role!" });
    }

    // Check if admin already exists
    const existingUser = await Admin.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Admin already exists" });

    // ✅ Let Sequelize handle hashing via beforeCreate
    const newAdmin = await Admin.create({ username, email, password, role });

    res.status(201).json({ message: "Admin registered successfully!", admin: newAdmin });
  } catch (err) {
    console.error("Admin Registration Error:", err);
    res.status(500).json({ message: "Error registering admin", error: err.message });
  }
});

/**
 * 🔐 Verify Admin Credentials (Re-authentication for sensitive actions)
 * Route: POST /api/admin/verify
 * Access: Logged-in Admins (or can be public if not requiring token)
 */
router.post("/verify", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Verification successful" });
  } catch (err) {
    console.error("Credential Verification Error:", err);
    res.status(500).json({ message: "Error verifying credentials", error: err.message });
  }
});

/**
 * 🔑 Admin Login
 * Route: POST /api/admin/login
 * Access: Public
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin.admin_id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: admin.role,
      name: admin.name,   // <-- add admin name here
      email: admin.email  // (optional) include email if needed
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

/**
 * 👤 Get Admin Profile
 * Route: GET /api/admin/profile
 * Access: Authenticated Admins
 */
router.get("/profile", authenticateUser, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.adminId, {
      attributes: { exclude: ["password"] },
    });

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json({ admin });
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
});
/**
 * 🔐 Change Admin Password
 * Route: PUT /api/admin/change-password
 * Access: Authenticated Admins
 */
router.put("/change-password", authenticateUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Find admin by ID
    const admin = await Admin.findByPk(req.user.adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    // ✅ Set new password (it will be hashed via model's beforeUpdate hook)
    admin.password = newPassword;

    // Save the updated admin
    await admin.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password Change Error:", err);
    res.status(500).json({ message: "Error updating password", error: err.message });
  }
});

/**
 * 🔒 Super Admin-Only Route
 * Route: GET /api/admin/superadmin
 * Access: Super Admin
 */
router.get("/superadmin", authenticateUser, authorizeRole(["superadmin"]), (req, res) => {
  res.status(200).json({ message: "Welcome Super Admin!" });
});

/**
 * 🔒 Admin & Super Admin Route
 * Route: GET /api/admin/admin
 * Access: Admin & Super Admin
 */
router.get("/admin", authenticateUser, authorizeRole(["admin", "superadmin"]), (req, res) => {
  res.status(200).json({ message: "Welcome Admin!" });
});

/**
 * 📜 Get All Admins (Super Admin Only)
 * Route: GET /api/admin/list
 * Access: Super Admin
 */
router.get("/list", authenticateUser, authorizeRole(["superadmin"]), async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({ admins });
  } catch (err) {
    console.error("Error Fetching Admin List:", err);
    res.status(500).json({ message: "Error fetching admin list", error: err.message });
  }
});

/**
 * ❌ Delete an Admin Account by Email (Super Admin Only, cannot delete other Super Admins)
 * Route: DELETE /api/admin/delete-by-email
 * Access: Super Admin
 */
router.delete("/delete-by-email", authenticateUser, authorizeRole(["superadmin"]), async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Prevent deletion of any superadmin account
    if (admin.role === "superadmin") {
      return res.status(403).json({ message: "Cannot delete Super Admin accounts" });
    }

    await admin.destroy();
    res.status(200).json({ message: "Admin account deleted successfully" });
  } catch (err) {
    console.error("Admin Deletion Error:", err);
    res.status(500).json({ message: "Error deleting admin", error: err.message });
  }
});

module.exports = router;
