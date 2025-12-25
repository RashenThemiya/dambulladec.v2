const express = require('express');
const { Op } = require('sequelize'); // Ensure Sequelize operators are available
const AuditTrail = require('../models/AuditTrail');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all audit records (Only superadmin can view audit logs)


router.get("/", authenticateUser, authorizeRole(["superadmin"]), async (req, res) => {
    const { page = 1, limit = 50, event_type, start_date, end_date, shop_id } = req.query;
    const offset = (page - 1) * limit;

    try {
        let whereClause = {};  

        if (event_type) {
            whereClause.event_type = event_type;
        }

        if (start_date && end_date) {
            whereClause.event_date = { [Op.between]: [new Date(start_date), new Date(end_date)] };
        } else if (start_date) {
            whereClause.event_date = { [Op.gte]: new Date(start_date) };
        } else if (end_date) {
            whereClause.event_date = { [Op.lte]: new Date(end_date) };
        }

        if (shop_id) {
            whereClause.shop_id = shop_id;
        }

        const audits = await AuditTrail.findAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.status(200).json(audits);
    } catch (err) {
        res.status(500).json({ message: "Error fetching audit records", error: err.message });
    }
});

// Get audit record by ID
router.get('/:auditId', authenticateUser, authorizeRole(['superadmin']), async (req, res) => {
  const { auditId } = req.params;
  try {
    const audit = await AuditTrail.findByPk(auditId);
    if (!audit) return res.status(404).json({ message: 'Audit record not found' });
    res.status(200).json(audit);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching audit record', error: err.message });
  }
});

module.exports = router;
