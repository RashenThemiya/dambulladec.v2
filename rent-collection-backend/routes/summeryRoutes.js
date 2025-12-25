const express = require('express');
const { Sequelize, Op } = require('sequelize');
const Invoice = require('../models/Invoice');
const Fine = require('../models/Fine');
const Rent = require('../models/Rent');
const Vat = require('../models/VAT');
const Shop = require('../models/Shop');
const ShopBalance = require('../models/ShopBalance');
const Tenant = require('../models/Tenant');
const OperationFee = require('../models/OperationFee');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get('/summary', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
    const { month, year } = req.query;

    if (!year) {
        return res.status(400).json({ error: "Year is required." });
    }

    try {
        const shopCount = await Shop.count();
        const tenantCount = await Tenant.count();
        const shopBalanceSum = await ShopBalance.findAll({
            attributes: [[Sequelize.fn('SUM', Sequelize.col('balance_amount')), 'total_shop_balance']],
            where: {
                balance_amount: { [Op.gt]: 0 }
            }
        });

        if (month) {
            // Monthly summary
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            const data = await getMonthlyData(startDate, endDate);

            return res.json({
                ...data,
                shopCount,
                tenantCount,
                shopBalanceSum: shopBalanceSum[0]?.get({ plain: true }) || {}
            });
        } else {
            // Year-wise summary
            const yearData = [];

            for (let m = 0; m < 12; m++) {
                const startDate = new Date(year, m, 1);
                const endDate = new Date(year, m + 1, 0, 23, 59, 59);
                const data = await getMonthlyData(startDate, endDate);

                yearData.push({
                    month: m + 1,
                    ...data
                });
            }

            return res.json({
                year,
                monthlySummaries: yearData,
                shopCount,
                tenantCount,
                shopBalanceSum: shopBalanceSum[0]?.get({ plain: true }) || {}
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

const getMonthlyData = async (startDate, endDate) => {
    const invoiceCounts = await Invoice.findAll({
        attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('invoice_id')), 'total_invoices'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'Paid' THEN 1 ELSE 0 END")), 'paid_count'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'Unpaid' THEN 1 ELSE 0 END")), 'unpaid_count'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'Arrest' THEN 1 ELSE 0 END")), 'arrest_count'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'Partially Paid' THEN 1 ELSE 0 END")), 'partial_count']
        ],
        where: {
            month_year: { [Op.between]: [startDate, endDate] }
        }
    });

    const rentSums = await Rent.findAll({
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('rent_amount')), 'total_rent_amount'],
            [Sequelize.fn('SUM', Sequelize.col('paid_amount')), 'total_rent_paid']
        ],
        where: {
            createdAt: { [Op.between]: [startDate, endDate] }
        }
    });

    const vatSums = await Vat.findAll({
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('vat_amount')), 'total_vat_amount'],
            [Sequelize.fn('SUM', Sequelize.col('paid_amount')), 'total_vat_paid']
        ],
        where: {
            createdAt: { [Op.between]: [startDate, endDate] }
        }
    });

    const fineSums = await Fine.findAll({
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('fine_amount')), 'total_fine_amount'],
            [Sequelize.fn('SUM', Sequelize.col('paid_amount')), 'total_fine_paid']
        ],
        where: {
            createdAt: { [Op.between]: [startDate, endDate] }
        }
    });

    const operationFeeSums = await OperationFee.findAll({
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('operation_amount')), 'total_operation_amount'],
            [Sequelize.fn('SUM', Sequelize.col('paid_amount')), 'total_operation_paid']
        ],
        where: {
            createdAt: { [Op.between]: [startDate, endDate] }
        }
    });

    return {
        invoiceCounts: invoiceCounts[0]?.get({ plain: true }) || {},
        rentSums: rentSums[0]?.get({ plain: true }) || {},
        vatSums: vatSums[0]?.get({ plain: true }) || {},
        fineSums: fineSums[0]?.get({ plain: true }) || {},
        operationFeeSums: operationFeeSums[0]?.get({ plain: true }) || {}
    };
};

module.exports = router;
