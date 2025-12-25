import moment from "moment";
import { useEffect, useState } from "react";
import DashboardCard from "../../components/DashboardCard";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/axiosInstance";

const SanitationDashboard = () => {
  const [daily, setDaily] = useState({ totalIncome: 0, ticketCount: 0 });
  const [monthly, setMonthly] = useState({ totalIncome: 0, ticketCount: 0 });

  const [todayTwenty, setTodayTwenty] = useState({ totalIncome: 0, ticketCount: 0 });
  const [todayHundred, setTodayHundred] = useState({ totalIncome: 0, ticketCount: 0 });

  const [monthTwenty, setMonthTwenty] = useState({ totalIncome: 0, ticketCount: 0 });
  const [monthHundred, setMonthHundred] = useState({ totalIncome: 0, ticketCount: 0 });

  const [allMonthly, setAllMonthly] = useState([]);

  useEffect(() => {
    // Default: fetch today & current month data
    fetchDaily();
    fetchMonthly();
    fetchTicketsByPrice("today", 20, setTodayTwenty);
    fetchTicketsByPrice("today", 100, setTodayHundred);
    fetchTicketsByPrice("month", 20, setMonthTwenty);
    fetchTicketsByPrice("month", 100, setMonthHundred);
    fetchAllMonthlyData();
  }, []);

  // Fetch today's total tickets
  const fetchDaily = async () => {
    try {
      const today = moment().format("YYYY-MM-DD");
      const res = await api.get(`/api/sanitation/by-date?startDate=${today}&endDate=${today}`);
      const tickets = res.data?.tickets || [];
      const totalRevenue = tickets.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
      setDaily({ totalIncome: totalRevenue, ticketCount: tickets.length });
    } catch (err) {
      console.error("Error fetching daily income:", err);
    }
  };

  // Fetch this month's total tickets
  const fetchMonthly = async () => {
    try {
      const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");
      const res = await api.get(`/api/sanitation/by-date?startDate=${startOfMonth}&endDate=${endOfMonth}`);
      const tickets = res.data?.tickets || [];
      const totalRevenue = tickets.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
      setMonthly({ totalIncome: totalRevenue, ticketCount: tickets.length });
    } catch (err) {
      console.error("Error fetching monthly income:", err);
    }
  };

  // Fetch tickets by price for today or month
  const fetchTicketsByPrice = async (range, price, setState) => {
    try {
      let query = `price=${price}`;
      if (range === "today") {
        const today = moment().format("YYYY-MM-DD");
        query += `&startDate=${today}&endDate=${today}`;
      } else if (range === "month") {
        const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
        const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");
        query += `&startDate=${startOfMonth}&endDate=${endOfMonth}`;
      }

      const res = await api.get(`/api/sanitation/by-date?${query}`);
      const tickets = res.data?.tickets || [];
      const totalRevenue = tickets.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);

      setState({ totalIncome: totalRevenue, ticketCount: tickets.length });
    } catch (err) {
      console.error(`Error fetching ${price}Rs ${range} tickets:`, err);
    }
  };

  // Fetch all monthly data (for table)
  const fetchAllMonthlyData = async () => {
    try {
      const res = await api.get("/api/sanitation/monthly-income");
      const data = res.data || [];

      const detailedData = await Promise.all(
        data.map(async (item) => {
          const startOfMonth = moment(`${item.year}-${item.month}-01`).startOf("month").format("YYYY-MM-DD");
          const endOfMonth = moment(`${item.year}-${item.month}-01`).endOf("month").format("YYYY-MM-DD");

          const res20 = await api.get(`/api/sanitation/by-date?startDate=${startOfMonth}&endDate=${endOfMonth}&price=20`);
          const res100 = await api.get(`/api/sanitation/by-date?startDate=${startOfMonth}&endDate=${endOfMonth}&price=100`);

          return {
            ...item,
            twentyCount: res20.data?.tickets?.length || 0,
            hundredCount: res100.data?.tickets?.length || 0,
          };
        })
      );

      setAllMonthly(detailedData);
    } catch (err) {
      console.error("Error fetching all monthly data:", err);
    }
  };

  // Total summary
  const totalSummary = allMonthly.reduce(
    (acc, curr) => {
      acc.totalIncome += parseFloat(curr.totalIncome || 0);
      acc.ticketCount += parseInt(curr.ticketCount || 0);
      acc.twentyCount += parseInt(curr.twentyCount || 0);
      acc.hundredCount += parseInt(curr.hundredCount || 0);
      return acc;
    },
    { totalIncome: 0, ticketCount: 0, twentyCount: 0, hundredCount: 0 }
  );

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        <div className="bg-white shadow-md rounded-lg p-6 h-full">
          <h3 className="text-xl font-bold mb-12 text-gray-800 text-center">
            Sanitation Ticketing Management
          </h3>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {/* Today cards */}
            <DashboardCard title="Today Total" revenue={daily.totalIncome} tickets={daily.ticketCount} icon="dollar" bgGradient="bg-gradient-to-r from-blue-700 to-blue-900" />
            <DashboardCard title="Today Rs 20 Total" revenue={todayTwenty.totalIncome} tickets={todayTwenty.ticketCount} icon="file" bgGradient="bg-gradient-to-r from-blue-700 to-blue-900" detailLink="/sanitation-ticketing?price=20" />
            <DashboardCard title="Today Rs 100 Total" revenue={todayHundred.totalIncome} tickets={todayHundred.ticketCount} icon="file" bgGradient="bg-gradient-to-r from-blue-700 to-blue-900" detailLink="/sanitation-ticketing?price=100" />

            {/* Month cards */}
            <DashboardCard title="This Month Total" revenue={monthly.totalIncome} tickets={monthly.ticketCount} icon="calendar" bgGradient="bg-gradient-to-r from-purple-700 to-purple-900" />
            <DashboardCard title="This Month Rs 20 Total" revenue={monthTwenty.totalIncome} tickets={monthTwenty.ticketCount} icon="file" bgGradient="bg-gradient-to-r from-purple-700 to-purple-900" detailLink="/sanitation-ticketing?price=20&range=month" />
            <DashboardCard title="This Month Rs 100 Total" revenue={monthHundred.totalIncome} tickets={monthHundred.ticketCount} icon="file" bgGradient="bg-gradient-to-r from-purple-700 to-purple-900" detailLink="/sanitation-ticketing?price=100&range=month" />
          </div>

          {/* Monthly Breakdown Table */}
          <h2 className="text-2xl font-semibold mt-12 mb-4">All Months Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border shadow rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left">Month</th>
                  <th className="py-3 px-4 text-left">Total Income</th>
                  <th className="py-3 px-4 text-left">Ticket Count</th>
                  <th className="py-3 px-4 text-left">20Rs Tickets</th>
                  <th className="py-3 px-4 text-left">100Rs Tickets</th>
                </tr>
              </thead>
              <tbody>
                {allMonthly.map((data, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-4">{data.year}-{String(data.month).padStart(2, "0")}</td>
                    <td className="py-2 px-4">Rs. {parseFloat(data.totalIncome || 0).toFixed(2)}</td>
                    <td className="py-2 px-4">{data.ticketCount || 0}</td>
                    <td className="py-2 px-4">{data.twentyCount || 0}</td>
                    <td className="py-2 px-4">{data.hundredCount || 0}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold border-t-2">
                  <td className="py-2 px-4">Total</td>
                  <td className="py-2 px-4">Rs. {totalSummary.totalIncome.toFixed(2)}</td>
                  <td className="py-2 px-4">{totalSummary.ticketCount}</td>
                  <td className="py-2 px-4">{totalSummary.twentyCount}</td>
                  <td className="py-2 px-4">{totalSummary.hundredCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SanitationDashboard;
