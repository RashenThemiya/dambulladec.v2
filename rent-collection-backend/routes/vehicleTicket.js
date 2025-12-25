// routes/vehicleTickets.js
const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const VehicleTicket = require('../models/VehicleTicket');
const VehicleType = require('../models/VehicleType');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Generate a custom ID per gate in the format GATE1_001
 * Uses the count of tickets already issued for that gate
 */
async function generateCustomId(gateNumber) {
  // Count existing tickets for this gate
  const count = await VehicleTicket.count({ where: { gateNumber } });
  // Increment for new ticket
  const nextCount = count + 1;
  // Format as 3-digit number, e.g., 001, 012
  const paddedCount = String(nextCount).padStart(3, '0');
  return `${gateNumber}_${paddedCount}`;
}

/**
 * ✅ Issue a new vehicle ticket
 */
router.post('/', authenticateUser, authorizeRole(['admin', 'superadmin', 'tiketing']), async (req, res) => {
  const { vehicleNumber, vehicleTypeId, fromLocation, products, gateNumber } = req.body;

  if (!vehicleNumber || !vehicleTypeId || !gateNumber) {
    return res.status(400).json({ message: 'Vehicle number, type, and gate are required.' });
  }

  try {
    // Get the ticket price from VehicleType
    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    if (!vehicleType) return res.status(400).json({ message: 'Invalid vehicle type.' });

    const ticketPrice = vehicleType.defaultPrice; // fixed at issue time
    const byWhom = req.user.email;

    // Generate custom ID
    const customId = await generateCustomId(gateNumber);

    const ticket = await VehicleTicket.create({
      vehicleNumber,
      vehicleTypeId,
      vehicleTypeTicketId: vehicleType.id,
      ticketPrice,
      fromLocation,
      products: products ? JSON.stringify(products) : null,
      gateNumber,
      customId,
      entryTime: new Date(),
      byWhom
    });

    res.status(201).json({
      message: 'Ticket issued successfully',
      ticketId: ticket.id,
      customId: ticket.customId,
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: 'Error issuing ticket', error: error.message });
  }
});

/**
 * 📋 Get tickets filtered by date range, byWhom, vehicleType, or gate
 */
router.get('/by-date', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { startDate, endDate, byWhom, vehicleTypeId, gateNumber, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const whereClause = {};

    if (startDate) whereClause.entryTime = { [Op.gte]: new Date(startDate) };
    if (endDate) whereClause.entryTime = { ...(whereClause.entryTime || {}), [Op.lte]: new Date(endDate) };
    if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
    if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
    if (gateNumber) whereClause.gateNumber = gateNumber;

    const { rows: tickets, count } = await VehicleTicket.findAndCountAll({
      where: whereClause,
      include: [
        { model: VehicleType, attributes: ['id', 'name', 'defaultPrice'] } // include type info
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['entryTime', 'DESC']]
    });

    res.status(200).json({ total: count, page: +page, tickets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

/**
 * 💰 Daily income summary
 */
router.get('/daily-income', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { startDate, endDate, vehicleTypeId, byWhom, gateNumber } = req.query;

  try {
    const whereClause = {};
    if (startDate) whereClause.entryTime = { [Op.gte]: new Date(startDate + 'T00:00:00') };
    if (endDate) whereClause.entryTime = { ...(whereClause.entryTime || {}), [Op.lte]: new Date(endDate + 'T23:59:59') };
    if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
    if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
    if (gateNumber) whereClause.gateNumber = gateNumber;

    const dailyIncome = await VehicleTicket.findAll({
      attributes: [
        [fn('DATE', col('entryTime')), 'date'],
        [fn('SUM', col('ticketPrice')), 'totalIncome'],
        [fn('COUNT', col('id')), 'ticketCount']
      ],
      where: whereClause,
      group: [literal('DATE(entryTime)')],
      order: [[literal('DATE(entryTime)'), 'DESC']]
    });

    res.status(200).json(dailyIncome);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily income', error: error.message });
  }
});

/**
 * 📆 Monthly income summary
 */
router.get('/monthly-income', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { vehicleTypeId, byWhom, gateNumber } = req.query;

  try {
    const whereClause = {};
    if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };
    if (vehicleTypeId) whereClause.vehicleTypeId = vehicleTypeId;
    if (gateNumber) whereClause.gateNumber = gateNumber;

    const monthlyIncome = await VehicleTicket.findAll({
      attributes: [
        [fn('YEAR', col('entryTime')), 'year'],
        [fn('MONTH', col('entryTime')), 'month'],
        [fn('SUM', col('ticketPrice')), 'totalIncome'],
        [fn('COUNT', col('id')), 'ticketCount']
      ],
      where: whereClause,
      group: [fn('YEAR', col('entryTime')), fn('MONTH', col('entryTime'))],
      order: [
        [fn('YEAR', col('entryTime')), 'DESC'],
        [fn('MONTH', col('entryTime')), 'DESC']
      ]
    });

    res.status(200).json(monthlyIncome);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly income', error: error.message });
  }
});

/**
 * ❌ Delete a vehicle ticket by ID
 */
router.delete('/:id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const ticket = await VehicleTicket.findByPk(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await ticket.destroy();
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting ticket', error: error.message });
  }
});

module.exports = router;
