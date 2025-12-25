const express = require("express");
const router = express.Router();

const Shop = require("../models/Shop");
const { generateInvoice } = require("../utils/generateInvoice");
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

// 🕒 Get current month-year in YYYY-MM format
function getCurrentMonthYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// 🔄 Generate invoices for all shops (superadmin only)

router.post(
  "/generate-all",
  authenticateUser,
  authorizeRole(["superadmin"]),
  async (req, res) => {
    try {
      const monthYear = getCurrentMonthYear();
      const shops = await Shop.findAll();

      if (!shops.length) {
        return res.status(404).json({ message: "No shops found." });
      }

      const adminName = req.user?.email || "System"; // Logged-in user email

      const results = [];

      for (const shop of shops) {
        try {
          const invoice = await generateInvoice(shop.shop_id, monthYear, adminName);
          results.push({
            shop_id: shop.shop_id,
            status: "success",
            invoice_id: invoice.invoice_id,
          });
        } catch (err) {
          results.push({
            shop_id: shop.shop_id,
            status: "failed",
            error: err.message,
          });
        }
      }

      return res.status(200).json({
        message: `Invoice generation completed for ${monthYear} by ${adminName}.`,
        results,
      });
    } catch (error) {
      console.error("❌ Error generating invoices:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  }
);


module.exports = router;
