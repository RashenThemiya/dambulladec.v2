import { saveAs } from "file-saver";
import moment from "moment";
import { useEffect, useState } from "react";
import DashboardCard from "../../components/DashboardCard";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/axiosInstance";
import { Link } from "react-router-dom";

const VehicleDashboard = () => {
  const [dailyIncome, setDailyIncome] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState([]);

  useEffect(() => {
    fetchGateWiseDaily();
    fetchGateWiseMonthly();
  }, []);

  // Fetch today gate-wise income
  const fetchGateWiseDaily = async () => {
    try {
      const today = moment().format("YYYY-MM-DD");
      const res = await api.get(
        `/api/vehicle-tickets/daily-income?startDate=${today}&endDate=${today}`
      );
      setDailyIncome(res.data || []);
    } catch (err) {
      console.error("Error fetching daily income:", err);
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
      setMonthlyIncome(res.data || []);
    } catch (err) {
      console.error("Error fetching monthly income:", err);
    }
  };

  // Download Excel via backend API
  const downloadExcel = async () => {
    try {
      const res = await api.get("/api/vehicle-tickets/monthly-income-excel", {
        responseType: "blob" // important for file download
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      saveAs(blob, `MonthlyIncome_${moment().format("YYYYMMDD")}.xlsx`);
    } catch (err) {
      console.error("Error downloading Excel:", err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        <div className="bg-white shadow-md rounded-lg p-6 h-full">
          <h3 className="text-3xl font-bold mb-8 text-gray-800 text-center">
            Vehicle Gate-Wise Dashboard
          </h3>
<div>
  <Link
  to="/vehicle-ticketing"
  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6 inline-block"
>
  View All Vehicle Tickets
</Link>
</div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {/* Daily Cards */}
            {dailyIncome.map((gate, idx) => (
              <DashboardCard
                key={idx}
                title={`Gate ${gate.gateNumber} Today`}
                revenue={parseFloat(gate.totalIncome || 0)}
                tickets={gate.ticketCount}
                icon="dollar"
                bgGradient="bg-gradient-to-r from-green-700 to-green-900"
              />
            ))}

            {/* Monthly Cards */}
            {monthlyIncome.map((gate, idx) => (
              <DashboardCard
                key={idx}
                title={`Gate ${gate.gateNumber} Month`}
                revenue={parseFloat(gate.totalIncome || 0)}
                tickets={gate.ticketCount}
                icon="calendar"
                bgGradient="bg-gradient-to-r from-blue-700 to-blue-900"
              />
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <button
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
              onClick={downloadExcel}
            >
              Download Monthly Income Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDashboard;
