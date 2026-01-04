// VehicleDashboard.jsx - Updated with clickable cards
import { saveAs } from "file-saver";
import moment from "moment";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardCard from "../../components/DashboardCard";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/axiosInstance";

const VehicleDashboard = () => {

  const [dailyIncome, setDailyIncome] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDateModal, setShowDateModal] = useState(false);
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchGateWiseDaily();
    fetchGateWiseMonthly();
  }, []);

  // Fetch today gate-wise income
  const fetchGateWiseDaily = async () => {
    try {
      setLoading(true);
      const today = moment().format("YYYY-MM-DD");
      //const today="2025-12-26"
      const res = await api.get(
        `/api/vehicle-tickets/daily-income?startDate=${today}&endDate=${today}`
      );
      setDailyIncome(res.data || []);
    } catch (err) {
      console.error("Error fetching daily income:", err);
    } finally {
    setLoading(false); 
  }
  };

  // Fetch current month gate-wise income
  const fetchGateWiseMonthly = async () => {
    try {
      const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");
      const res = await api.get(
        `/api/vehicle-tickets/monthly-income?startDate=${startOfMonth}&endDate=${endOfMonth}`
      );
      
      // Group by gate and sum
      const grouped = res.data.reduce((acc, item) => {
        const gate = item.gateNumber;
        if (!acc[gate]) {
          acc[gate] = { gateNumber: gate, totalIncome: 0, ticketCount: 0 };
        }
        acc[gate].totalIncome += parseFloat(item.totalIncome || 0);
        acc[gate].ticketCount += parseInt(item.ticketCount || 0);
        return acc;
      }, {});
      
      setMonthlyIncome(Object.values(grouped));
    } catch (err) {
      console.error("Error fetching monthly income:", err);
    }
  };

  // Download Excel via backend API
  const downloadExcel = async () => {
    try {
      const res = await api.get("/api/vehicle-tickets/monthly-income-excel", {
        responseType: "blob"
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      saveAs(blob, `MonthlyIncome_${moment().format("YYYYMMDD")}.xlsx`);
    } catch (err) {
      console.error("Error downloading Excel:", err);
    }
  };
// Download Daily Excel via backend API
const downloadDailyExcel = async () => {
  try {
    const today = moment().format("YYYY-MM-DD");
    const res = await api.get(
      `/api/vehicle-tickets/daily-income-excel?startDate=${today}&endDate=${today}`,
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `DailyIncome_${today}.xlsx`);
  } catch (err) {
    console.error("Error downloading daily Excel:", err);
  }
};
const downloadCustomExcel = async () => {
  try {
    if (!startDate) return alert("Please select start date");

    const sDate = startDate;
    const eDate = endDate || startDate;

    const res = await api.get(
      `/api/vehicle-tickets/daily-income-excel?startDate=${sDate}&endDate=${eDate}`,
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(blob, `Income_${sDate}_to_${eDate}.xlsx`);
    setShowDateModal(false);
  } catch (err) {
    console.error("Error downloading custom Excel:", err);
  }
};
  return (
    
  <div className="flex flex-col md:flex-row h-screen">
    <Sidebar />
    
    <div className="flex-1 overflow-auto p-6 bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 min-h-screen">
        <h3 className="text-3xl font-bold mb-8 text-gray-800 text-center">
          Vehicle Gate-Wise Dashboard
        </h3>

    
        <div className="mb-6 flex flex-wrap gap-4">
          <Link
            to="/vehicle-ticketing"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
          >
            View All Vehicle Tickets
          </Link>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={downloadExcel}
          >
            Download Monthly Income Excel
          </button>
            <button
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              onClick={downloadDailyExcel}
            >
              Download Daily Income Excel
            </button>
        </div>
<button
  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
  onClick={() => setShowDateModal(true)}
>
  Custom Date Income Report
</button>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {/* Daily Cards */}
            {dailyIncome.map((gate, idx) => (
              <div
                key={`daily-${idx}`}
                onClick={() => navigate(`/gate/${gate.gateNumber}/daily`)}
                className="cursor-pointer transform transition hover:scale-105"
              >
                <DashboardCard
                  title={`Gate ${gate.gateNumber} Today`}
                  revenue={parseFloat(gate.totalIncome || 0)}
                  tickets={gate.ticketCount}
                  icon="dollar"
                  bgGradient="bg-gradient-to-r from-green-700 to-green-900"
                />
              </div>
            ))}

            {/* Monthly Cards */}
            {monthlyIncome.map((gate, idx) => (
              <div
                key={`monthly-${idx}`}
                onClick={() => navigate(`/gate/${gate.gateNumber}/monthly`)}
                className="cursor-pointer transform transition hover:scale-105"
              >
                <DashboardCard
                  title={`Gate ${gate.gateNumber} Month`}
                  revenue={parseFloat(gate.totalIncome || 0)}
                  tickets={gate.ticketCount}
                  icon="calendar"
                  bgGradient="bg-gradient-to-r from-blue-700 to-blue-900"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    {showDateModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h3 className="text-xl font-bold mb-4 text-center">
        Custom Income Report
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          End Date (optional)
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded w-full"
        onClick={downloadCustomExcel}
      >
        Download Excel
      </button>

      <button
        className="mt-4 text-sm text-gray-600 w-full"
        onClick={() => setShowDateModal(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}

  </div>
  
);
};

export default VehicleDashboard;