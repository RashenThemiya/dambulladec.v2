import ExcelJS from "exceljs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";

const ViewPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  // Calculate total amount for filtered payments
  const totalAmount = filteredPayments.reduce(
    (sum, payment) => sum + parseFloat(payment.amount_paid),
    0
  );

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get("api/payments/payments");
        setPayments(response.data.payments);
        setFilteredPayments(response.data.payments); // Initially show all payments
      } catch (err) {
        setError("Failed to fetch payments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Search filter function
  useEffect(() => {
    const filtered = payments.filter((payment) => {
      // Search filter (existing)
      const matchesSearch =
        payment.payment_id.toString().includes(searchQuery) ||
        (payment.shop_id &&
          payment.shop_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (payment.invoice_id &&
          payment.invoice_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (payment.payment_method &&
          payment.payment_method.toLowerCase().includes(searchQuery.toLowerCase()));

      // Date filter for Year & Month
      const paymentDate = new Date(payment.payment_date);
      const paymentYear = paymentDate.getFullYear().toString();
      const paymentMonth = (paymentDate.getMonth() + 1).toString(); // getMonth() is zero-based

      const matchesYear = selectedYear ? paymentYear === selectedYear : true;
      const matchesMonth = selectedMonth ? paymentMonth === selectedMonth : true;

      return matchesSearch && matchesYear && matchesMonth;
    });

    setFilteredPayments(filtered);
  }, [searchQuery, payments, selectedYear, selectedMonth]);


  // Export to Excel function
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payments");

    // Set headers
    worksheet.columns = [
      
      { header: "Shop ID", key: "shop_id", width: 15 },
      { header: "Invoice ID", key: "invoice_id", width: 20 },
      { header: "Amount Paid (LKR)", key: "amount_paid", width: 20 },
      { header: "Payment Method", key: "payment_method", width: 20 },
      { header: "Payment Date", key: "payment_date", width: 20 },
    ];

    // Highlight headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Bold + white text
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }, // Light blue background
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    // Sort payments by shop_id
    filteredPayments.forEach((payment) => {
  payment.shop_id = payment.shop_id.toUpperCase();
});

    filteredPayments.sort((a, b) => {

      if (a.shop_id < b.shop_id) return -1;
      if (a.shop_id > b.shop_id) return 1;
      return 0;
    });

    // Add payment rows
    filteredPayments.forEach((payment) => {
       
      worksheet.addRow({
       
        shop_id: payment.shop_id,
        invoice_id: payment.invoice_id || "N/A",
        amount_paid: parseFloat(payment.amount_paid).toFixed(2),
        payment_method: payment.payment_method,
        payment_date: new Date(payment.payment_date).toLocaleDateString(),
      });
    });

    // Add Total row
    const totalAmount = filteredPayments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount_paid || 0);
    }, 0);

    const totalRow = worksheet.addRow({
    
      shop_id: '',
      invoice_id: 'TOTAL',
      amount_paid: totalAmount.toFixed(2),
      payment_method: '',
      payment_date: '',
    });

    // Style Total row
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Download as Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Payments.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);


  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
        <div className="flex items-center justify-start mb-4 relative">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
          >
            Back
          </button>
          <h2 className="text-2xl font-bold text-center absolute left-1/2 transform -translate-x-1/2">
            All Payments
          </h2>
        </div>



        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by Payment ID, Shop ID, Invoice ID, or Payment Method..."
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex gap-4 mb-4">
          {/* Year Dropdown */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 w-40"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>

          {/* Month Dropdown */}
          <select
            className="p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 w-40"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>


        <p className="text-lg font-semibold mb-4 text-center">
          Total Amount Paid (LKR): {totalAmount.toFixed(2)}
        </p>

        {loading && (
          <p className="text-blue-500 text-center">Loading payments...</p>
        )}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && filteredPayments.length === 0 && (
          <p className="text-gray-600 text-center">
            No matching payments found.
          </p>
        )}

        {!loading && !error && filteredPayments.length > 0 && (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200 sticky top-0">
                  <th className="border border-gray-300 px-4 py-2">
                    Payment ID
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Shop ID</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Invoice ID
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Amount Paid
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Payment Method
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.payment_id} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">
                      {payment.payment_id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {payment.shop_id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {payment.invoice_id || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      LKR {parseFloat(payment.amount_paid).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {payment.payment_method}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
          <ConfirmWrapper
            onConfirm={exportToExcel}
            message="Are you sure you want to download the payments?"
            additionalInfo="This will export all filtered records as an Excel file."
            confirmText="Download"
            cancelText="Cancel"
            buttonBackgroundColor="bg-green-500"
            icon={<span role="img" aria-label="download">📥</span>}
          >
            <button className="ml-auto block bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 mb-4">
              Download as Excel
            </button>
          </ConfirmWrapper>

        </div>


      </div>
    </div>
  );
};

export default ViewPayments;
