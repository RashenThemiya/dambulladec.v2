// routes/vehicleTickets.js
const express = require("express");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../config/database");

const VehicleTicket = require("../models/VehicleTicket");
const VehicleType = require("../models/VehicleType");
const GateCounter = require("../models/GateCounter");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const {
  authenticateUser,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

function getSriLankaDate() {
  const now = new Date();

  // Convert to Sri Lanka time (+5:30)
  const slTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  return slTime.toISOString().slice(0, 10); // YYYY-MM-DD
}
async function getNextGateSequence(gateNumber, transaction) {
  const counterDate = getSriLankaDate();

  // 1️⃣ Ensure row exists (gate + date)
  await sequelize.query(
    `
    INSERT INTO gate_counters (gateNumber, counterDate, currentValue)
    VALUES (:gateNumber, :counterDate, 0)
    ON DUPLICATE KEY UPDATE gateNumber = gateNumber
    `,
    {
      replacements: { gateNumber, counterDate },
      transaction,
    }
  );

  // 2️⃣ Atomic increment
  await sequelize.query(
    `
    UPDATE gate_counters
    SET currentValue = LAST_INSERT_ID(currentValue + 1)
    WHERE gateNumber = :gateNumber AND counterDate = :counterDate
    `,
    {
      replacements: { gateNumber, counterDate },
      transaction,
    }
  );

  // 3️⃣ Read incremented value
  const [[{ nextSeq }]] = await sequelize.query(
    `SELECT LAST_INSERT_ID() AS nextSeq`,
    { transaction }
  );

  return String(nextSeq).padStart(3, "0");
}

/**
 * ✅ ISSUE VEHICLE TICKET
 */router.post(
  "/",
  authenticateUser,
  authorizeRole(["admin", "superadmin", "tiketing"]),
  async (req, res) => {
    const {
      vehicleNumber,
      vehicleTypeId,
      fromLocation,
      products,
      gateNumber,
    } = req.body;

    if (!vehicleNumber || !vehicleTypeId || !gateNumber) {
      return res.status(400).json({
        message: "Vehicle number, vehicle type, and gate number are required.",
      });
    }

    const t = await sequelize.transaction();

    try {
      const vehicleType = await VehicleType.findByPk(vehicleTypeId, {
        transaction: t,
      });

      if (!vehicleType) {
        await t.rollback();
        return res.status(400).json({ message: "Invalid vehicle type." });
      }

      // ✅ get gate-wise + date-wise counter
      const seq = await getNextGateSequence(gateNumber, t);

      // example: G1_2025-01-30_15
      const today = new Date().toISOString().slice(0, 10);
      const customId = `${gateNumber}_${today}_${seq}`;

      const ticket = await VehicleTicket.create(
        {
          vehicleNumber,
          vehicleTypeId,
          vehicleTypeTicketId: vehicleType.id,
          ticketPrice: vehicleType.defaultPrice,
          fromLocation,
          products: products ? JSON.stringify(products) : null,
          gateNumber,
          customId,
          entryTime: new Date(),
          byWhom: req.user.email,
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({
        message: "Ticket issued successfully",
        customId,
        ticket,
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        message: "Error issuing ticket",
        error: error.message,
      });
    }
  }
);

/**
 * 📋 GET TICKETS BY DATE
 */
router.get(
  "/by-date",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const { startDate, endDate, byWhom, vehicleTypeId, gateNumber, vehicleNumber } = req.query;

    try {
      const whereClause = {};

      // ✅ FIX: Add time to make it work for full day
      if (startDate) {
        whereClause.entryTime = { 
          [Op.gte]: new Date(startDate + 'T00:00:00') 
        };
      }
      if (endDate) {
        whereClause.entryTime = {
          ...(whereClause.entryTime || {}),
          [Op.lte]: new Date(endDate + 'T23:59:59')
        };
      }

      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
      if (gateNumber) whereClause.gateNumber = gateNumber;
      if (vehicleNumber) whereClause.vehicleNumber = { [Op.like]: `%${vehicleNumber}%` };

      const { rows, count } = await VehicleTicket.findAndCountAll({
        where: whereClause,
        include: [
          { model: VehicleType, attributes: ["id", "name", "defaultPrice"] },
        ],
        order: [["entryTime", "DESC"]],
      });

      res.status(200).json({ total: count, tickets: rows });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tickets", error: error.message });
    }
  }
);

/**
 * 💰 DAILY INCOME
 */ /**
 * 💰 DAILY INCOME BY GATE
 */
router.get(
  "/daily-income",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const { startDate, endDate, vehicleTypeId, byWhom, gateNumber } = req.query;

    try {
      const whereClause = {};
      if (startDate)
        whereClause.entryTime = { [Op.gte]: new Date(startDate + "T00:00:00") };
      if (endDate)
        whereClause.entryTime = {
          ...(whereClause.entryTime || {}),
          [Op.lte]: new Date(endDate + "T23:59:59"),
        };
      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
      if (gateNumber) whereClause.gateNumber = gateNumber; // filter by gate if provided

      const data = await VehicleTicket.findAll({
        attributes: [
          [fn("DATE", col("entryTime")), "date"],
          "gateNumber",
          [fn("SUM", col("ticketPrice")), "totalIncome"],
          [fn("COUNT", col("id")), "ticketCount"],
        ],
        where: whereClause,
        group: [literal("DATE(entryTime)"), "gateNumber"],
        order: [
          [literal("DATE(entryTime)"), "DESC"],
          ["gateNumber", "ASC"],
        ],
      });

      res.json(data);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching daily income", error: error.message });
    }
  }
);

/**
 * 📆 MONTHLY INCOME BY GATE
 */
router.get(
  "/monthly-income",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const { vehicleTypeId, byWhom, gateNumber } = req.query;

    try {
      const whereClause = {};
      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
      if (gateNumber) whereClause.gateNumber = gateNumber; // filter by gate if provided

      const data = await VehicleTicket.findAll({
        attributes: [
          [fn("YEAR", col("entryTime")), "year"],
          [fn("MONTH", col("entryTime")), "month"],
          "gateNumber",
          [fn("SUM", col("ticketPrice")), "totalIncome"],
          [fn("COUNT", col("id")), "ticketCount"],
        ],
        where: whereClause,
        group: [
          fn("YEAR", col("entryTime")),
          fn("MONTH", col("entryTime")),
          "gateNumber",
        ],
        order: [
          [fn("YEAR", col("entryTime")), "DESC"],
          [fn("MONTH", col("entryTime")), "DESC"],
          ["gateNumber", "ASC"],
        ],
      });

      res.json(data);
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error fetching monthly income by gate",
          error: error.message,
        });
    }
  }
);

/**
 * ❌ DELETE TICKET
 */router.delete(
  "/:id",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      // 1️⃣ Find the ticket
      const ticket = await VehicleTicket.findByPk(req.params.id, { transaction: t });
      if (!ticket) {
        await t.rollback();
        return res.status(404).json({ message: "Ticket not found" });
      }

      const gateNumber = ticket.gateNumber;
      const counterDate = ticket.entryTime.toISOString().slice(0, 10); // YYYY-MM-DD

      // 2️⃣ Extract sequence from customId (assuming format: G1_YYYY-MM-DD_seq)
      const parts = ticket.customId.split("_");
      const ticketSeq = parseInt(parts[2], 10);

      // 3️⃣ Get current gate counter
      const [[{ currentValue }]] = await sequelize.query(
        `SELECT currentValue FROM gate_counters 
         WHERE gateNumber = :gateNumber AND counterDate = :counterDate`,
        { replacements: { gateNumber, counterDate }, transaction: t }
      );

      // 4️⃣ Only allow deletion if this is the last ticket
      if (ticketSeq !== currentValue) {
        await t.rollback();
        return res.status(400).json({
          message: "Can only delete the last ticket issued for this gate and date.",
        });
      }

      // 5️⃣ Decrement gate counter
      await sequelize.query(
        `UPDATE gate_counters 
         SET currentValue = currentValue - 1 
         WHERE gateNumber = :gateNumber AND counterDate = :counterDate`,
        { replacements: { gateNumber, counterDate }, transaction: t }
      );

      // 6️⃣ Delete ticket
      await ticket.destroy({ transaction: t });

      await t.commit();
      res.json({
        message: "Last ticket deleted successfully and gate counter updated.",
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ message: "Error deleting ticket", error: error.message });
    }
  }
);

// 🔹 Add Vehicle Type Route
router.post(
  "/vehicle-type",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const { name, defaultPrice, description } = req.body;

    if (!name || !defaultPrice) {
      return res.status(400).json({
        message: "Vehicle type name and default price are required.",
      });
    }

    try {
      // Check if vehicle type already exists
      const [vehicleType, created] = await VehicleType.findOrCreate({
        where: { name },
        defaults: { defaultPrice, description },
      });

      if (!created) {
        return res
          .status(400)
          .json({ message: "Vehicle type already exists." });
      }

      res.status(201).json({
        message: "Vehicle type created successfully",
        vehicleType,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating vehicle type", error: error.message });
    }
  }
);
// 🔹 GET ALL VEHICLE TYPES
router.get(
  "/vehicle-types",
  authenticateUser,
  authorizeRole(["admin", "superadmin", "tiketing"]),
  async (req, res) => {
    try {
      const vehicleTypes = await VehicleType.findAll({
        attributes: ["id", "name", "defaultPrice", "description"],
        order: [["name", "ASC"]],
      });

      res.status(200).json(vehicleTypes);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({
          message: "Error fetching vehicle types",
          error: error.message,
        });
    }
  }
);
router.delete(
  "/vehicle-ticket/:id",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const ticket = await VehicleTicket.findByPk(req.params.id, { transaction: t });
      if (!ticket) {
        await t.rollback();
        return res.status(404).json({ message: "Ticket not found" });
      }

      const gateNumber = ticket.gateNumber;
      const counterDate = ticket.entryTime.toISOString().slice(0, 10);

      // Extract sequence number from customId (assumes format G1_YYYY-MM-DD_seq)
      const parts = ticket.customId.split("_");
      const ticketSeq = parseInt(parts[2], 10);

      // Get current gate counter
      const [[{ currentValue }]] = await sequelize.query(
        `SELECT currentValue FROM gate_counters WHERE gateNumber = :gateNumber AND counterDate = :counterDate`,
        { replacements: { gateNumber, counterDate }, transaction: t }
      );

      if (ticketSeq !== currentValue) {
        await t.rollback();
        return res.status(400).json({
          message: "Can only delete the last ticket issued for this gate and date.",
        });
      }

      // Decrement gate counter
      await sequelize.query(
        `UPDATE gate_counters
         SET currentValue = currentValue - 1
         WHERE gateNumber = :gateNumber AND counterDate = :counterDate`,
        { replacements: { gateNumber, counterDate }, transaction: t }
      );

      // Delete ticket
      await ticket.destroy({ transaction: t });

      await t.commit();
      res.json({
        message: "Last ticket deleted successfully and gate counter updated.",
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ message: "Error deleting ticket", error: error.message });
    }
  }
);
router.get(
  "/monthly-income-excel",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const { vehicleTypeId, byWhom } = req.query;

    try {
      const whereClause = {};
      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;

      // Convert entryTime to Sri Lanka time (+5:30) using nested DATE_ADD
      const slEntryTime = "DATE_ADD(DATE_ADD(entryTime, INTERVAL 5 HOUR), INTERVAL 30 MINUTE)";

      const data = await VehicleTicket.findAll({
        attributes: [
          [fn("YEAR", literal(slEntryTime)), "year"],
          [fn("MONTH", literal(slEntryTime)), "month"],
          "gateNumber",
          [fn("SUM", col("ticketPrice")), "totalIncome"],
          [fn("COUNT", col("id")), "ticketCount"],
        ],
        where: whereClause,
        group: [
          literal(`YEAR(${slEntryTime})`),
          literal(`MONTH(${slEntryTime})`),
          "gateNumber",
        ],
        order: [
          [literal(`YEAR(${slEntryTime})`), "DESC"],
          [literal(`MONTH(${slEntryTime})`), "DESC"],
          ["gateNumber", "ASC"],
        ],
        raw: true,
      });

      if (!data.length) {
        return res.status(404).json({ message: "No data available for Excel export." });
      }

      const wsData = [["Year", "Month", "Gate Number", "Total Income", "Ticket Count"]];
      data.forEach((row) => {
        wsData.push([row.year, row.month, row.gateNumber, row.totalIncome, row.ticketCount]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "MonthlyIncome");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="monthly_income_gatewise.xlsx"'
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.send(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating Excel file", error: error.message });
    }
  }
);


// 🔹 EDIT VEHICLE TYPE
router.patch(
  "/vehicle-type/:id",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const { id } = req.params;
    const { name, defaultPrice, description } = req.body;

    try {
      // 1️⃣ Find the vehicle type
      const vehicleType = await VehicleType.findByPk(id);
      if (!vehicleType) {
        return res.status(404).json({ message: "Vehicle type not found." });
      }

      // 2️⃣ Check if new name already exists (optional)
      if (name && name !== vehicleType.name) {
        const existing = await VehicleType.findOne({ where: { name } });
        if (existing) {
          return res
            .status(400)
            .json({ message: "Vehicle type name already exists." });
        }
      }

      // 3️⃣ Update fields
      if (name) vehicleType.name = name;
      if (defaultPrice) vehicleType.defaultPrice = defaultPrice;
      if (description !== undefined) vehicleType.description = description;

      await vehicleType.save();

      res.status(200).json({
        message: "Vehicle type updated successfully",
        vehicleType,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error updating vehicle type", error: error.message });
    }
  }
);
router.get(
  "/daily-income-excel",
  authenticateUser,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const { startDate, endDate, vehicleTypeId, byWhom, gateNumber } = req.query;

    try {
      const whereClause = {};

      const start = startDate ? getSriLankaDate(startDate) : getSriLankaDate();
      const end = endDate ? getSriLankaDate(endDate) : getSriLankaDate();

      whereClause.entryTime = { 
        [Op.gte]: new Date(start + "T00:00:00"),
        [Op.lte]: new Date(end + "T23:59:59")
      };

      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
      if (gateNumber) whereClause.gateNumber = gateNumber;

      const data = await VehicleTicket.findAll({
        attributes: [
          [fn("DATE", col("entryTime")), "date"],
          "gateNumber",
          [fn("SUM", col("ticketPrice")), "totalIncome"],
          [fn("COUNT", col("id")), "ticketCount"],
        ],
        where: whereClause,
        group: [literal("DATE(entryTime)"), "gateNumber"],
        order: [
          [literal("DATE(entryTime)"), "DESC"],
          ["gateNumber", "ASC"],
        ],
        raw: true,
      });

      if (!data.length) {
        return res.status(404).json({ message: "No data available for Excel export." });
      }

      const wsData = [["Date", "Gate Number", "Total Income", "Ticket Count"]];
      data.forEach((row) => {
        wsData.push([row.date, row.gateNumber, row.totalIncome, row.ticketCount]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DailyIncome");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="daily_income_gatewise_${start}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.send(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating Excel file", error: error.message });
    }
  }
);


module.exports = router;
