// routes/vehicleTickets.js
const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');

const VehicleTicket = require('../models/VehicleTicket');
const VehicleType = require('../models/VehicleType');
const GateCounter = require('../models/GateCounter');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * 🔥 ATOMIC gate-wise increment (FIRST TIME SAFE)
 */
async function getNextGateSequence(gateNumber, transaction) {
  // 1️⃣ Ensure gate exists (auto-create)
  await sequelize.query(
    `
    INSERT INTO gate_counters (gateNumber, currentValue)
    VALUES (:gateNumber, 0)
    ON DUPLICATE KEY UPDATE gateNumber = gateNumber
    `,
    {
      replacements: { gateNumber },
      transaction
    }
  );

  // 2️⃣ Atomic increment
  await sequelize.query(
    `
    UPDATE gate_counters
    SET currentValue = LAST_INSERT_ID(currentValue + 1)
    WHERE gateNumber = :gateNumber
    `,
    {
      replacements: { gateNumber },
      transaction
    }
  );

  // 3️⃣ Get incremented value
  const [[{ nextSeq }]] = await sequelize.query(
    `SELECT LAST_INSERT_ID() AS nextSeq`,
    { transaction }
  );

  return String(nextSeq).padStart(3, '0'); // 001, 002 ...
}

/**
 * ✅ ISSUE VEHICLE TICKET
 */
router.post(
  '/',
  authenticateUser,
  authorizeRole(['admin', 'superadmin', 'tiketing']),
  async (req, res) => {
    const { vehicleNumber, vehicleTypeId, fromLocation, products, gateNumber } = req.body;

    if (!vehicleNumber || !vehicleTypeId || !gateNumber) {
      return res.status(400).json({
        message: 'Vehicle number, vehicle type, and gate number are required.'
      });
    }

    const t = await sequelize.transaction();

    try {
      // validate vehicle type
      const vehicleType = await VehicleType.findByPk(vehicleTypeId, { transaction: t });
      if (!vehicleType) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid vehicle type.' });
      }

      // 🔥 gate validation OPTIONAL now (auto-create)
      // if you want strict validation, keep this block
      // otherwise remove it
      if (GateCounter.rawAttributes?.gateNumber) {
        await GateCounter.findOrCreate({
          where: { gateNumber },
          defaults: { currentValue: 0 },
          transaction: t
        });
      }

      // get next gate-wise sequence
      const seq = await getNextGateSequence(gateNumber, t);
      const customId = `${gateNumber}_${seq}`;

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
          byWhom: req.user.email
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({
        message: 'Ticket issued successfully',
        ticketId: ticket.id,
        customId,
        ticket
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        message: 'Error issuing ticket',
        error: error.message
      });
    }
  }
);

/**
 * 📋 GET TICKETS BY DATE
 */
router.get(
  '/by-date',
  authenticateUser,
  authorizeRole(['admin', 'superadmin']),
  async (req, res) => {
    const { startDate, endDate, byWhom, vehicleTypeId, gateNumber, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
      const whereClause = {};

      if (startDate) whereClause.entryTime = { [Op.gte]: new Date(startDate) };
      if (endDate)
        whereClause.entryTime = { ...(whereClause.entryTime || {}), [Op.lte]: new Date(endDate) };
      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
      if (gateNumber) whereClause.gateNumber = gateNumber;

      const { rows, count } = await VehicleTicket.findAndCountAll({
        where: whereClause,
        include: [{ model: VehicleType, attributes: ['id', 'name', 'defaultPrice'] }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['entryTime', 'DESC']]
      });

      res.status(200).json({ total: count, page: +page, tickets: rows });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
  }
);

/**
 * 💰 DAILY INCOME
 *//**
 * 💰 DAILY INCOME BY GATE
 */
router.get(
  '/daily-income',
  authenticateUser,
  authorizeRole(['admin', 'superadmin']),
  async (req, res) => {
    const { startDate, endDate, vehicleTypeId, byWhom, gateNumber } = req.query;

    try {
      const whereClause = {};
      if (startDate) whereClause.entryTime = { [Op.gte]: new Date(startDate + 'T00:00:00') };
      if (endDate)
        whereClause.entryTime = {
          ...(whereClause.entryTime || {}),
          [Op.lte]: new Date(endDate + 'T23:59:59')
        };
      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
      if (gateNumber) whereClause.gateNumber = gateNumber; // filter by gate if provided

      const data = await VehicleTicket.findAll({
        attributes: [
          [fn('DATE', col('entryTime')), 'date'],
          'gateNumber',
          [fn('SUM', col('ticketPrice')), 'totalIncome'],
          [fn('COUNT', col('id')), 'ticketCount']
        ],
        where: whereClause,
        group: [literal('DATE(entryTime)'), 'gateNumber'],
        order: [[literal('DATE(entryTime)'), 'DESC'], ['gateNumber', 'ASC']]
      });

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching daily income', error: error.message });
    }
  }
);

/**
 * 📆 MONTHLY INCOME BY GATE
 */
router.get(
  '/monthly-income',
  authenticateUser,
  authorizeRole(['admin', 'superadmin']),
  async (req, res) => {
    const { vehicleTypeId, byWhom, gateNumber } = req.query;

    try {
      const whereClause = {};
      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
      if (gateNumber) whereClause.gateNumber = gateNumber; // filter by gate if provided

      const data = await VehicleTicket.findAll({
        attributes: [
          [fn('YEAR', col('entryTime')), 'year'],
          [fn('MONTH', col('entryTime')), 'month'],
          'gateNumber',
          [fn('SUM', col('ticketPrice')), 'totalIncome'],
          [fn('COUNT', col('id')), 'ticketCount']
        ],
        where: whereClause,
        group: [fn('YEAR', col('entryTime')), fn('MONTH', col('entryTime')), 'gateNumber'],
        order: [
          [fn('YEAR', col('entryTime')), 'DESC'],
          [fn('MONTH', col('entryTime')), 'DESC'],
          ['gateNumber', 'ASC']
        ]
      });

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching monthly income by gate', error: error.message });
    }
  }
);

/**
 * ❌ DELETE TICKET
 */
router.delete(
  '/:id',
  authenticateUser,
  authorizeRole(['admin', 'superadmin']),
  async (req, res) => {
    try {
      const ticket = await VehicleTicket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      await ticket.destroy();
      res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting ticket', error: error.message });
    }
  }
);

// 🔹 Add Vehicle Type Route
router.post(
  '/vehicle-type',
  authenticateUser,
  authorizeRole(['admin', 'superadmin']),
  async (req, res) => {
    const { name, defaultPrice, description } = req.body;

    if (!name || !defaultPrice) {
      return res.status(400).json({
        message: 'Vehicle type name and default price are required.'
      });
    }

    try {
      // Check if vehicle type already exists
      const [vehicleType, created] = await VehicleType.findOrCreate({
        where: { name },
        defaults: { defaultPrice, description }
      });

      if (!created) {
        return res.status(400).json({ message: 'Vehicle type already exists.' });
      }

      res.status(201).json({
        message: 'Vehicle type created successfully',
        vehicleType
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating vehicle type', error: error.message });
    }
  }
);
// 🔹 GET ALL VEHICLE TYPES
router.get(
  '/vehicle-types',
  authenticateUser,
  authorizeRole(['admin', 'superadmin', 'tiketing']),
  async (req, res) => {
    try {
      const vehicleTypes = await VehicleType.findAll({
        attributes: ['id', 'name', 'defaultPrice', 'description'],
        order: [['name', 'ASC']]
      });

      res.status(200).json(vehicleTypes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching vehicle types', error: error.message });
    }
  }
);

// 🔹 DELETE VEHICLE TYPE
router.delete(
  '/vehicle-type/:id',
  authenticateUser,
  authorizeRole(['admin', 'superadmin']),
  async (req, res) => {
    try {
      const vehicleType = await VehicleType.findByPk(req.params.id);

      if (!vehicleType) {
        return res.status(404).json({ message: 'Vehicle type not found.' });
      }

      // Optional: Check if any tickets exist for this type
      const ticketCount = await VehicleTicket.count({ where: { vehicleTypeId: vehicleType.id } });
      if (ticketCount > 0) {
        return res.status(400).json({ message: 'Cannot delete vehicle type with existing tickets.' });
      }

      await vehicleType.destroy();
      res.json({ message: 'Vehicle type deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting vehicle type.', error: error.message });
    }
  }
);

router.get(
  '/monthly-income-excel',
  authenticateUser,
  authorizeRole(['admin', 'superadmin']),
  async (req, res) => {
    const { vehicleTypeId, byWhom } = req.query;

    try {
      const whereClause = {};
      if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
      if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;

      // Get all monthly income gate-wise
      const data = await VehicleTicket.findAll({
        attributes: [
          [fn('YEAR', col('entryTime')), 'year'],
          [fn('MONTH', col('entryTime')), 'month'],
          'gateNumber',
          [fn('SUM', col('ticketPrice')), 'totalIncome'],
          [fn('COUNT', col('id')), 'ticketCount']
        ],
        where: whereClause,
        group: [fn('YEAR', col('entryTime')), fn('MONTH', col('entryTime')), 'gateNumber'],
        order: [
          [fn('YEAR', col('entryTime')), 'DESC'],
          [fn('MONTH', col('entryTime')), 'DESC'],
          ['gateNumber', 'ASC']
        ],
        raw: true
      });

      if (!data.length) {
        return res.status(404).json({ message: 'No data available for Excel export.' });
      }

      // Prepare worksheet
      const wsData = [
        ['Year', 'Month', 'Gate Number', 'Total Income', 'Ticket Count']
      ];

      data.forEach(row => {
        wsData.push([row.year, row.month, row.gateNumber, row.totalIncome, row.ticketCount]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'MonthlyIncome');

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Set headers to download
      res.setHeader('Content-Disposition', 'attachment; filename="monthly_income_gatewise.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      res.send(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error generating Excel file', error: error.message });
    }
  }
);

// 🔹 EDIT VEHICLE TYPE
router.patch(
  '/vehicle-type/:id',
  authenticateUser,
  authorizeRole(['admin', 'superadmin']),
  async (req, res) => {
    const { id } = req.params;
    const { name, defaultPrice, description } = req.body;

    try {
      // 1️⃣ Find the vehicle type
      const vehicleType = await VehicleType.findByPk(id);
      if (!vehicleType) {
        return res.status(404).json({ message: 'Vehicle type not found.' });
      }

      // 2️⃣ Check if new name already exists (optional)
      if (name && name !== vehicleType.name) {
        const existing = await VehicleType.findOne({ where: { name } });
        if (existing) {
          return res.status(400).json({ message: 'Vehicle type name already exists.' });
        }
      }

      // 3️⃣ Update fields
      if (name) vehicleType.name = name;
      if (defaultPrice) vehicleType.defaultPrice = defaultPrice;
      if (description !== undefined) vehicleType.description = description;

      await vehicleType.save();

      res.status(200).json({
        message: 'Vehicle type updated successfully',
        vehicleType
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating vehicle type', error: error.message });
    }
  }
);


module.exports = router;
