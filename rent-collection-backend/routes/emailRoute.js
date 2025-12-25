const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const Tenant = require('../models/Tenant');


dotenv.config();

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("Email credentials not set in environment variables");
}
const sendEmail = async (req, res) => {
  const { invoices } = req.body;

  if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
    return res.status(400).json({ success: false, message: "No invoices provided." });
  }

  const results = [];

  for (const invoice of invoices) {
    try {
      const tenant = await Tenant.findOne({ where: { shop_id: invoice.shop_id } });

      if (!tenant || !tenant.email) {
        results.push({
          invoice_id: invoice.invoice_id,
          shop_id: invoice.shop_id,
          success: false,
          message: "Tenant email not found",
        });
        continue;
      }
      const mailOptions = {
  from: process.env.EMAIL_USER,
  to: tenant.email,
  subject: `Invoice ${invoice.invoice_id} from Dambulla DEC`,
  html: `
    <div style="background-color: #f6e4ba; font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #d2a679;">
     <h2 style="color: #333; text-align: center; font-size: 24px; margin-bottom: 5px;">
  🧾 Monthly Rent Invoice
</h2>
<h3 style="color: #333; text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 20px;">
  Management Office<br>
  Dedicated Economic Center, Dambulla
</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td><strong>Invoice ID:</strong></td>
          <td>${invoice.invoice_id}</td>
        </tr>
        <tr>
          <td><strong>Shop ID:</strong></td>
          <td>${invoice.shop_id}</td>
        </tr>
        <tr>
          <td><strong>Month-Year:</strong></td>
          <td>${new Date(invoice.month_year).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td><strong>Rent:</strong></td>
          <td>Rs. ${invoice.rent_amount}</td>
        </tr>
        <tr>
          <td><strong>Operation Fee:</strong></td>
          <td>Rs. ${invoice.operation_fee}</td>
        </tr>
        <tr>
          <td><strong>VAT:</strong></td>
          <td>Rs. ${invoice.vat_amount}</td>
        </tr>
        <tr>
          <td><strong>Previous Balance:</strong></td>
          <td>Rs. ${invoice.previous_balance}</td>
        </tr>
        <tr>
          <td><strong>Fines:</strong></td>
          <td>Rs. ${invoice.fines}</td>
        </tr>
        <tr>
          <td><strong>Previous Fines:</strong></td>
          <td>Rs. ${invoice.previous_fines}</td>
        </tr>
        <tr>
          <td><strong>Total Arrears:</strong></td>
          <td>Rs. ${invoice.total_arrears}</td>
        </tr>
        <tr>
          <td><strong><span style="color: #d9534f;">Total Amount:</span></strong></td>
          <td><strong><span style="color: #d9534f;">Rs. ${invoice.total_amount}</span></strong></td>
        </tr>
        <tr>
          <td><strong>Status:</strong></td>
          <td>${invoice.status}</td>
        </tr>
       
      </table>
      <p style="margin-top: 20px; font-size: 0.9em; color: #777;">Generated on: ${new Date().toLocaleString()}</p>


      
    </div>
  `,
};


      await transporter.sendMail(mailOptions);

      results.push({
        invoice_id: invoice.invoice_id,
        shop_id: invoice.shop_id,
        success: true,
        message: "Email sent successfully",
      });
    } catch (err) {
      results.push({
        invoice_id: invoice.invoice_id,
        shop_id: invoice.shop_id,
        success: false,
        message: `Error sending email: ${err.message}`,
      });
    }
  }

  return res.status(200).json({ success: true, results });
};


// Register route
router.post("/send-email", sendEmail);
module.exports = router;
