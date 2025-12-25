const { Sequelize } = require('sequelize');
const Invoice = require('../models/Invoice');
const Rent = require('../models/Rent');
const Fine = require('../models/Fine');
const OperationFee = require('../models/OperationFee');
const Vat = require('../models/VAT'); // Corrected VAT import
const AuditTrail = require('../models/AuditTrail');
const sequelize = require('../config/database');
const dayjs = require('dayjs');

/**
 * Apply Fine Arrest Action: Update fines to "Arrest" if they have been "Unpaid" or "Partially Paid" for 30+ days.
 * @returns {object} - Success or failure response.
 */
async function applyFineArrestAction() {
  const t = await sequelize.transaction();
  try {
      const fineArrestThresholdDate = dayjs().subtract(30, 'days').toDate();

      // Find fines that are "Unpaid" or "Partially Paid" and older than 30 days
      const finesToUpdate = await Fine.findAll({
          where: {
              status: { [Sequelize.Op.in]: ['Unpaid', 'Partially Paid'] },
              createdAt: { [Sequelize.Op.lte]: fineArrestThresholdDate } // Older than 30 days
          },
          transaction: t
      });

      if (finesToUpdate.length === 0) {
          await t.commit();
          return { success: false, message: "No fines found for Fine Arrest Action." };
      }

      // Update all selected fines to "Arrest"
      await Fine.update(
          { status: 'Arrest' },
          {
              where: {
                  status: { [Sequelize.Op.in]: ['Unpaid', 'Partially Paid'] },
                  createdAt: { [Sequelize.Op.lte]: fineArrestThresholdDate }
              },
              transaction: t
          }
      );

      // Log the event in Audit Trail
      for (const fine of finesToUpdate) {
          await AuditTrail.create({
              shop_id: fine.shop_id,
              event_type: 'Arrest Action',
              event_description: `Fine ID ${fine.id} has been marked as Arrest due to non-payment for over 30 days.`,
              user_actioned: 'System'
          }, { transaction: t });
      }

      await t.commit();
      return { success: true, message: `${finesToUpdate.length} fines have been marked as Arrest due to prolonged non-payment.` };
  } catch (error) {
      await t.rollback();
      console.error("❌ Fine Arrest Action Error:", error);
      return { success: false, message: error.message };
  }
}

module.exports = { applyFineArrestAction };
