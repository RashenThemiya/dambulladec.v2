const jwt = require("jsonwebtoken");

// Middleware to authenticate users
const authenticateUser = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided or incorrect format." });
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <TOKEN>"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data (admin)
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message); // Optional logging
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Middleware to authorize roles
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to access this resource." });
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRole };
