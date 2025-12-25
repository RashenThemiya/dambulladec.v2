const request = require('supertest');
const express = require('express');
const paymentRoutes = require('../routes/paymentRoutes');

// Mock middlewares
jest.mock('../middleware/authMiddleware', () => ({
  authenticateUser: (req, res, next) => {
    req.user = { email: 'admin@example.com', role: 'admin' };
    next();
  },
  authorizeRole: (roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) {
      return next();
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
  },
}));

// Mock Payment model
jest.mock('../models', () => ({
  Payment: {
    findAll: jest.fn().mockResolvedValue([{ id: 1, amount_paid: 100 }]),
    findOne: jest.fn(),
  },
}));

// Mock process functions
jest.mock('../utils/processPayment', () => ({
  processPaymentByShopId: jest.fn().mockResolvedValue({ success: true, message: 'Processed' }),
  processPaymentByInvoiceId: jest.fn().mockResolvedValue({ success: true, message: 'Processed' }),
}));

const app = express();
app.use(express.json());
app.use('/api', paymentRoutes);

describe('Payment Routes', () => {
  test('GET /api/payments returns all payments', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.payments)).toBe(true);
  });

  test('POST /api/by-shop/:shopId should process payment if not already paid', async () => {
    const { Payment } = require('../models');
    Payment.findOne.mockResolvedValue(null); // No existing payment

    const res = await request(app)
      .post('/api/by-shop/a-1-1')
      .send({
        amountPaid: 100,
        paymentMethod: 'cash',
        paymentDate: '2025-06-04',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/by-shop/:shopId should fail if payment already exists', async () => {
    const { Payment } = require('../models');
    Payment.findOne.mockResolvedValue({ id: 1 }); // Existing payment found

    const res = await request(app)
      .post('/api/by-shop/a-1-1')
      .send({
        amountPaid: 100,
        paymentMethod: 'cash',
        paymentDate: '2025-06-04',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already been recorded/);
  });

  test('POST /api/by-invoice/:invoiceId processes invoice payment', async () => {
    const res = await request(app)
      .post('/api/by-invoice/a-1-1')
      .send({
        amountPaid: 150,
        paymentMethod: 'bank transfer',
        paymentDate: '2025-06-04',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/by-invoice/:invoiceId fails with missing fields', async () => {
    const res = await request(app)
      .post('/api/by-invoice/a-1-1')
      .send({
        paymentDate: '2025-06-04',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

test('Concurrent POST /api/by-shop/:shopId requests handle locking properly', async () => {
  const { Payment } = require('../models');
  const mockFindOne = jest.fn();

  // First call: no existing payment
  // Subsequent calls: pretend the first request created a payment
  mockFindOne
    .mockResolvedValueOnce(null) // 1st call — no payment yet
    .mockResolvedValue({ id: 1 }); // next calls — payment exists

  Payment.findOne = mockFindOne;

  const payload = {
    amountPaid: 100,
    paymentMethod: 'cash',
    paymentDate: '2025-06-04',
  };

  const requests = Array(5).fill(null).map(() =>
    request(app).post('/api/by-shop/concurrent-test').send(payload)
  );

  const responses = await Promise.all(requests);

  const successResponses = responses.filter(r => r.status === 200);
  const duplicateResponses = responses.filter(r => r.status === 400 && /already been recorded/.test(r.body.message));

  expect(successResponses.length).toBe(1); // Only one should succeed
  expect(duplicateResponses.length).toBe(4); // Rest should fail due to duplicate
});

test('All concurrent POST /api/by-shop/:shopId fail if payment already exists for that date', async () => {
  const { Payment } = require('../models');

  // Simulate payment already exists for the date
  Payment.findOne = jest.fn().mockResolvedValue({ id: 123, amount_paid: 100 });

  const payload = {
    amountPaid: 100,
    paymentMethod: 'cash',
    paymentDate: '2025-06-04',
  };

  const requests = Array(5).fill(null).map(() =>
    request(app).post('/api/by-shop/already-paid-shop').send(payload)
  );

  const responses = await Promise.all(requests);

  responses.forEach((res) => {
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already been recorded/);
  });
});
