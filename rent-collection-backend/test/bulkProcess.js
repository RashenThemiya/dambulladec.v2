const fs = require('fs');
const axios = require('axios');

const data = JSON.parse(fs.readFileSync('./test/payments_data.json')); // adjust path if needed

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoyLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ2MzUzNjk4LCJleHAiOjE3NDYzNjA4OTh9.ZpLnI3oBOD0f9TWkF82m2U2JgD0oKxCiL6euo0Dczsc'; // Replace with actual token if needed
const baseUrl = 'http://3.108.254.92:5000/api/payments'; // Replace with actual base URL

const processPayments = async () => {
  const validPayments = data.filter(p => p.shopId && p.amountPaid && p.paymentDate);

  for (const payment of validPayments) {
    try {
      const response = await axios.post(`${baseUrl}/by-shop/${payment.shopId}`, {
        amountPaid: payment.amountPaid,
        paymentMethod: 'cash', // default or set dynamically if you want
        paymentDate: payment.paymentDate
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      console.log(`✅ ${payment.shopId}: ${response.data.message || 'Processed'}`);
    } catch (error) {
      console.error(`❌ ${payment.shopId}: ${error.response?.data?.message || error.message}`);
    }
  }
};

processPayments();
