import { useState } from "react";
import api from "../../../utils/axiosInstance";
import ConfirmWrapper from "../../../components/ConfirmWrapper"; // Adjust path as needed

const GenerateInvoiceForm = ({ shopId, onInvoiceGenerated }) => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const years = [];
  const startYear = 2020;
  const endYear = 2035;

  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  const months = [
    { name: "January", value: "01" },
    { name: "February", value: "02" },
    { name: "March", value: "03" },
    { name: "April", value: "04" },
    { name: "May", value: "05" },
    { name: "June", value: "06" },
    { name: "July", value: "07" },
    { name: "August", value: "08" },
    { name: "September", value: "09" },
    { name: "October", value: "10" },
    { name: "November", value: "11" },
    { name: "December", value: "12" },
  ];

  const getMonthYear = () => {
    if (selectedYear && selectedMonth) {
      return `${selectedYear}-${selectedMonth}`;
    }
    return "";
  };

  const handleGenerateInvoice = async () => {
    const monthYear = getMonthYear();

    if (!shopId || !monthYear) {
      setError("Please select both year and month.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/systemsetting/generate", {
        shop_id: shopId,
        month_year: monthYear,
      });

      console.log("API Response:", response);

      if (response.data?.invoice) {
        onInvoiceGenerated(response.data.invoice);
        setSelectedYear("");
        setSelectedMonth("");
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.error || "Failed to generate invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded shadow-md w-full max-w-md">
      <h3 className="text-lg font-semibold mb-3">Generate Invoice</h3>

      <div className="mb-4 flex gap-2">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Month</option>
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.name}
            </option>
          ))}
        </select>
      </div>

      <ConfirmWrapper
  onConfirm={handleGenerateInvoice}
  message={`Generate invoice for ${
    selectedMonth && selectedYear
      ? `${months.find((m) => m.value === selectedMonth)?.name} ${selectedYear}`
      : "selected month and year"
  }?`}
  confirmText="Yes, Generate"
  cancelText="Cancel"
  buttonBackgroundColor="bg-blue-600"
  buttonTextColor="text-white"
>
<button
  disabled={loading || !selectedYear || !selectedMonth}
  className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full ${
    (loading || !selectedYear || !selectedMonth) ? "cursor-not-allowed" : "cursor-pointer"
  }`}
>
  {loading ? "Generating..." : "Generate Invoice"}
</button>

</ConfirmWrapper>


      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
};

export default GenerateInvoiceForm;
