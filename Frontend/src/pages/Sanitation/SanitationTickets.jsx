import { parse } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/axiosInstance";

// Export to Excel function
const exportSanitationTicketsExcel = async (tickets) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sanitation Tickets");

  worksheet.columns = [
    { header: "Ticket ID", key: "id", width: 15 },
    { header: "Price (Rs.)", key: "price", width: 15 },
    { header: "Date and Time", key: "createdAtSriLanka", width: 20 },
    { header: "Issued By", key: "byWhom", width: 30 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4CAF50" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const sortedTickets = [...tickets].sort((a, b) => {
    const dateA = parse(a.createdAtSriLanka, "dd/MM/yyyy, HH:mm:ss", new Date());
    const dateB = parse(b.createdAtSriLanka, "dd/MM/yyyy, HH:mm:ss", new Date());
    return dateA - dateB;
  });

  sortedTickets.forEach((ticket) => {
    worksheet.addRow({
      id: ticket.customId,
      price: ticket.price,
      createdAtSriLanka: ticket.createdAtSriLanka,
      byWhom: ticket.byWhom,
    });
  });

  const total = tickets.reduce((sum, t) => sum + parseFloat(t.price), 0);
  const totalRow = worksheet.addRow({
    id: "Total",
    price: total.toFixed(2),
    createdAtSriLanka: "",
    byWhom: "",
  });
  totalRow.font = { bold: true };
  worksheet.getColumn("price").numFmt = "0.00";

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `SanitationTickets_${new Date().toISOString()}.xlsx`);
};

const SanitationTickets = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const priceFilter = queryParams.get("price");

  // Default dates = today
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [pendingFrom, setPendingFrom] = useState(today);
  const [pendingTo, setPendingTo] = useState(today);

  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [ticketPrice, setTicketPrice] = useState("");
  const [searchByWhom, setSearchByWhom] = useState("");
  const [dailyIncome, setDailyIncome] = useState({ totalIncome: 0, ticketCount: 0 });
  const [monthlyIncome, setMonthlyIncome] = useState({ totalIncome: 0, ticketCount: 0 });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch tickets whenever filters change
  useEffect(() => {
    fetchTickets();
    fetchDailyIncome();
    fetchMonthlyIncome();
    // eslint-disable-next-line
  }, [searchByWhom, priceFilter, fromDate, toDate]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const query = [];
      if (searchByWhom) query.push(`byWhom=${searchByWhom}`);
      if (priceFilter) query.push(`price=${priceFilter}`);
      if (fromDate) query.push(`startDate=${fromDate}`);
      if (toDate) query.push(`endDate=${toDate}`);

      const queryString = query.length ? `?${query.join("&")}` : "";
      const res = await api.get(`/api/sanitation/by-date${queryString}`);
      const allTickets = res.data.tickets || [];
      setTickets(allTickets);
      setFilteredTickets(allTickets);
    } catch (err) {
      setError("Failed to fetch sanitation tickets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyIncome = async () => {
    try {
      const query = [];
      if (searchByWhom) query.push(`byWhom=${searchByWhom}`);
      if (priceFilter) query.push(`price=${priceFilter}`);
      if (fromDate) query.push(`startDate=${fromDate}`);
      if (toDate) query.push(`endDate=${toDate}`);

      const queryString = query.length ? `?${query.join("&")}` : "";
      const res = await api.get(`/api/sanitation/daily-income${queryString}`);
      setDailyIncome(res.data[0] || { totalIncome: 0, ticketCount: 0 });
    } catch (err) {
      console.error("Failed to fetch daily income:", err);
    }
  };

  const fetchMonthlyIncome = async () => {
    try {
      const query = [];
      if (searchByWhom) query.push(`byWhom=${searchByWhom}`);
      if (priceFilter) query.push(`price=${priceFilter}`);
      if (fromDate) query.push(`startDate=${fromDate}`);
      if (toDate) query.push(`endDate=${toDate}`);

      const queryString = query.length ? `?${query.join("&")}` : "";
      const res = await api.get(`/api/sanitation/monthly-income${queryString}`);
      const now = new Date();
      const monthData = res.data.find(
        (entry) =>
          parseInt(entry.month) === now.getMonth() + 1 &&
          parseInt(entry.year) === now.getFullYear()
      );
      setMonthlyIncome(monthData || { totalIncome: 0, ticketCount: 0 });
    } catch (err) {
      console.error("Failed to fetch monthly income:", err);
    }
  };

  const handleIssueTicket = async () => {
    setError(null);
    setSuccessMsg("");

    if (!ticketPrice) {
      setError("Please enter the ticket price.");
      return;
    }

    try {
      const response = await api.post("/api/sanitation", { price: ticketPrice });
      setSuccessMsg(`Ticket issued with ID: ${response.data.ticketId}`);
      setTicketPrice("");
      fetchTickets();
      fetchDailyIncome();
      fetchMonthlyIncome();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to issue ticket.");
    }
  };

  const handleDeleteTicket = async (id) => {
    setError(null);
    setSuccessMsg("");
    try {
      await api.delete(`/api/sanitation/${id}`);
      setSuccessMsg("Ticket deleted successfully.");
      fetchTickets();
      fetchDailyIncome();
      fetchMonthlyIncome();
    } catch (err) {
      setError("Failed to delete the ticket.");
      console.error(err);
    }
  };

  // Date range filter
  const handleDateRangeSubmit = (e) => {
    e.preventDefault();
    setFromDate(pendingFrom);
    setToDate(pendingTo);
  };

  const handleDateRangeReset = () => {
    setFromDate(today);
    setToDate(today);
    setPendingFrom(today);
    setPendingTo(today);
  };
const [currentPage, setCurrentPage] = useState(1);
const ticketsPerPage = 20;

const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

// Current page list
const indexOfLast = currentPage * ticketsPerPage;
const indexOfFirst = indexOfLast - ticketsPerPage;
const currentTickets = filteredTickets.slice(indexOfFirst, indexOfLast);

const handleNextPage = () => {
  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
};

const handlePrevPage = () => {
  if (currentPage > 1) setCurrentPage(currentPage - 1);
};

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-2 bg-gray-50">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
          {/* Header */}
          <h2 className="text-4xl font-bold mb-8 text-gray-800 text-center ">
            {priceFilter === "20"
              ? "Sanitation - 20Rs Tickets"
              : priceFilter === "100"
              ? "Sanitation - 100Rs Tickets"
              : "Sanitation Ticket Management"}
          </h2>

          {/* Issue Ticket Form */}
          {/* <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Ticket Price"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg"
            />
            <button
              onClick={handleIssueTicket}
              className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-6 rounded-lg transition"
            >
              Issue Ticket
            </button>
          </div>

          {error && <div className="mb-4 text-red-600">{error}</div>}
          {successMsg && <div className="mb-4 text-green-600">{successMsg}</div>} */}

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search by Email */}
              <label className="flex flex-col items-start w-full sm:w-auto">
                <span className="text-sm font-medium text-gray-700 mb-1">
                  Search By Email (byWhom)
                </span>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchByWhom}
                  onChange={(e) => setSearchByWhom(e.target.value)}
                  className="border border-gray-300 p-3 rounded-lg w-64"
                />
              </label>

              {/* Date Range */}
              <form
                className="flex flex-col sm:flex-row items-center gap-2"
                onSubmit={handleDateRangeSubmit}
              >
                <label className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700 mb-1">
                    Select Range of Dates
                  </span>
                  <div className="flex flex-row gap-2">
                    <input
                      type="date"
                      value={pendingFrom}
                      onChange={(e) => setPendingFrom(e.target.value)}
                      className="border border-gray-300 p-3 rounded-lg"
                      required
                    />
                    <input
                      type="date"
                      value={pendingTo}
                      onChange={(e) => setPendingTo(e.target.value)}
                      className="border border-gray-300 p-3 rounded-lg"
                      required
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition mt-4 sm:mt-6"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={handleDateRangeReset}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition mt-4 sm:mt-6"
                >
                  Reset
                </button>
              </form>
            </div>
          </div>

          {/* Income Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border border-teal-100">
              <h4 className="text-lg font-semibold text-gray-700">
                {fromDate !== today || toDate !== today || searchByWhom
                  ? "Filtered Income"
                  : "Today's Income"}
              </h4>
              <p className="text-teal-700 font-bold text-2xl">
                Rs.{" "}
                {filteredTickets
                  .reduce((sum, t) => sum + parseFloat(t.price), 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Tickets issued: {filteredTickets.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-teal-100">
              <h4 className="text-lg font-semibold text-gray-700">
                {searchByWhom ? "Filtered Monthly Income" : "This Month's Income"}
              </h4>
              <p className="text-teal-700 font-bold text-2xl">
                Rs. {parseFloat(monthlyIncome?.totalIncome).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Tickets issued: {monthlyIncome?.ticketCount}
              </p>
            </div>
          </div>

          {/* Ticket Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Tickets</h3>
              <button
                onClick={() => exportSanitationTicketsExcel(filteredTickets)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
                disabled={filteredTickets.length === 0}
              >
                Export to Excel
              </button>
            </div>
            {loading ? (
              <p>Loading...</p>
            ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border">
  {/* Table Wrapper with Scroll */}
  <div className="max-h-[450px] overflow-y-auto">
    <table className="w-full table-auto">
      {/* Sticky Table Header */}
      <thead className="bg-teal-600 text-white sticky top-0 z-10">
        <tr>
          <th className="p-3 text-left">ID</th>
          <th className="p-3 text-left">Price</th>
          <th className="p-3 text-left">Date & Time</th>
          <th className="p-3 text-left">By Whom</th>
          {/* <th className="p-3 text-left">Actions</th> */}
        </tr>
      </thead>

      {/* Table Body */}
      <tbody className="text-gray-700 text-sm">
        {currentTickets.length > 0 ? (
          currentTickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b hover:bg-gray-50 even:bg-gray-100"
            >
              <td className="p-3">{ticket.customId}</td>
              <td className="p-3">Rs. {ticket.price}</td>
              <td className="p-3">{ticket.createdAtSriLanka}</td>
              <td className="p-3">{ticket.byWhom}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              className="p-3 text-center text-gray-500"
              colSpan="5"
            >
              No tickets found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
  <div className="flex items-center justify-between p-4 bg-gray-100">
    <p className="text-sm text-gray-700">
      Page {currentPage} of {totalPages}
    </p>

    <div className="flex gap-2">
      <button
        disabled={currentPage === 1}
        onClick={handlePrevPage}
        className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-40 hover:bg-teal-700"
      >
        Prev
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={handleNextPage}
        className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-40 hover:bg-teal-700"
      >
        Next
      </button>
    </div>
  </div>
</div>


            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SanitationTickets;
