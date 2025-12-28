
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import Sidebar from "../../components/Sidebar";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const exportMonthlyTicketsExcel = async (tickets, gateNumber, month, year) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Gate ${gateNumber} - ${month}/${year}`);

  worksheet.columns = [
    { header: "#", key: "index", width: 8 },
    { header: "Ref ID", key: "id", width: 12 },
    { header: "Custom ID", key: "customId", width: 15 },
    { header: "Vehicle Number", key: "vehicleNumber", width: 18 },
    { header: "Type", key: "vehicleType", width: 14 },
    { header: "Price", key: "ticketPrice", width: 12 },
    { header: "Date", key: "date", width: 15 },
    { header: "Time", key: "time", width: 12 },
    { header: "By", key: "byWhom", width: 25 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2196F3" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  tickets.forEach((ticket, idx) => {
    worksheet.addRow({
      index: idx + 1,
      id: ticket.id,
      customId: ticket.customId,
      vehicleNumber: ticket.vehicleNumber,
      vehicleType: ticket.VehicleType?.name || ticket.vehicleType,
      ticketPrice: Number(ticket.ticketPrice).toFixed(2),
      date: moment(ticket.entryTime).format("YYYY-MM-DD"),
      time: moment(ticket.entryTime).format("HH:mm:ss"),
      byWhom: ticket.byWhom,
    });
  });

  const total = tickets.reduce((sum, t) => sum + parseFloat(t.ticketPrice), 0);
  const totalRow = worksheet.addRow({
    index: "",
    id: "Total",
    customId: "",
    vehicleNumber: "",
    vehicleType: "",
    ticketPrice: total.toFixed(2),
    date: "",
    time: "",
    byWhom: "",
  });

  totalRow.font = { bold: true };
  worksheet.getColumn("ticketPrice").numFmt = "0.00";

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Gate_${gateNumber}_Monthly_${year}_${month}_${new Date().toISOString()}.xlsx`
  );
};

const GateMonthlyTickets = () => {
  const { gateNumber } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(moment().format("YYYY-MM"));
  const [searchVehicleNumber, setSearchVehicleNumber] = useState("");
  const [searchByWhom, setSearchByWhom] = useState("");

  const [totalIncome, setTotalIncome] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalRecords, setTotalRecords] = useState(0);
const itemsPerPage = 10;
const isInitialMount = useRef(true);

// Reset page when filters change
useEffect(() => {
  setCurrentPage(1);
}, [gateNumber, selectedMonth, searchByWhom]);

// Fetch on page change (skip only first render)
useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
  } else {
    fetchTickets(); // Runs for ALL page changes including page 1
  }
}, [currentPage]);

// Initial fetch on mount
useEffect(() => {
  fetchTickets();
}, []);

// Client-side filtering
useEffect(() => {
  filterTickets();
}, [searchVehicleNumber, tickets]);


 const fetchTickets = async () => {
  setLoading(true);
  try {
    const startOfMonth = moment(selectedMonth).startOf("month").format("YYYY-MM-DD");
    const endOfMonth = moment(selectedMonth).endOf("month").format("YYYY-MM-DD");

    const queryParams = new URLSearchParams();
    queryParams.append("startDate", startOfMonth);
    queryParams.append("endDate", endOfMonth);
    queryParams.append("gateNumber", gateNumber);
    queryParams.append("page", currentPage);
    queryParams.append("limit", itemsPerPage); // ✅ Override backend's default limit of 10
    if (searchByWhom) queryParams.append("byWhom", searchByWhom);

    const res = await api.get(`/api/vehicle-tickets/by-date?${queryParams}`);
    
    // ✅ Backend already returns: { total: 23, page: 1, tickets: [...] }
    const ticketData = res.data.tickets || [];
    setTickets(ticketData);
    setFilteredTickets(ticketData);
    setTotalRecords(res.data.total || 0);
    setTotalPages(Math.ceil((res.data.total || 0) / itemsPerPage));

    const total = ticketData.reduce(
      (sum, t) => sum + parseFloat(t.ticketPrice || 0),
      0
    );
    setTotalIncome(total);
    setTicketCount(ticketData.length);
  } catch (err) {
    setError("Failed to fetch tickets.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const filterTickets = () => {
    const filtered = tickets.filter((ticket) =>
      ticket.vehicleNumber
        .toLowerCase()
        .includes(searchVehicleNumber.toLowerCase())
    );
    setFilteredTickets(filtered);
  };

  const handleDeleteTicket = async (id) => {
    try {
      await api.delete(`/api/vehicle-tickets/${id}`);
      setSuccessMsg("Ticket deleted successfully.");
      fetchTickets();
    } catch (err) {
      setError("Failed to delete the ticket.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/VehicleTicketDashboard")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
            >
              <FaArrowLeft /> Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              Gate {gateNumber} - Monthly Tickets
            </h2>
            <div className="w-24"></div>
          </div>

          {error && <div className="mb-4 text-red-600">{error}</div>}
          {successMsg && <div className="mb-4 text-green-600">{successMsg}</div>}

          <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Income for {moment(selectedMonth).format("MMMM YYYY")}
            </h3>
            <p className="text-3xl font-bold">
              Rs. {totalIncome.toLocaleString()}
            </p>
            <p className="text-sm mt-2">Total Tickets: {ticketCount}</p>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg"
            />
            <input
              type="text"
              placeholder="Search by Vehicle Number"
              value={searchVehicleNumber}
              onChange={(e) => setSearchVehicleNumber(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg"
            />
            <input
              type="text"
              placeholder="Search by Issuer Email"
              value={searchByWhom}
              onChange={(e) => setSearchByWhom(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">
  Tickets (Showing {filteredTickets.length} of {totalRecords} total)
</h3>
              <button
                onClick={() =>
                  exportMonthlyTicketsExcel(
                    filteredTickets,
                    gateNumber,
                    moment(selectedMonth).format("MM"),
                    moment(selectedMonth).format("YYYY")
                  )
                }
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
                disabled={filteredTickets.length === 0}
              >
                Export to Excel
              </button>
            </div>

            {loading ? (
              <p className="text-center py-8">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-3 text-left">#</th>
                      <th className="p-3 text-left">Ref ID</th>
                      <th className="p-3 text-left">Custom ID</th>
                      <th className="p-3 text-left">Vehicle Number</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Price</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Time</th>
                      <th className="p-3 text-left">By</th>
                      {(role === "admin" || role === "superadmin") && (
                        <th className="p-3 text-left">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length > 0 ? (
                      filteredTickets.map((ticket, index) => (
                        <tr key={ticket.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">{ticket.id}</td>
                          <td className="p-3 font-mono text-sm">
                            {ticket.customId}
                          </td>
                          <td className="p-3">{ticket.vehicleNumber}</td>
                          <td className="p-3">
                            {ticket.VehicleType?.name || ticket.vehicleType}
                          </td>
                          <td className="p-3">Rs. {ticket.ticketPrice}</td>
                          <td className="p-3">
                            {moment(ticket.entryTime).format("MMM DD")}
                          </td>
                          <td className="p-3">
                            {moment(ticket.entryTime).format("HH:mm")}
                          </td>
                          <td className="p-3">{ticket.byWhom}</td>
                          {(role === "admin" || role === "superadmin") && (
                            <td className="p-3">
                              <ConfirmWrapper
                                message="Are you sure you want to delete this ticket?"
                                onConfirm={() => handleDeleteTicket(ticket.id)}
                              >
                                <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
                                  <span>Delete</span>
                                  <FaTrash className="text-base" />
                                </button>
                              </ConfirmWrapper>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="p-3 text-center text-gray-500"
                          colSpan={
                            role === "admin" || role === "superadmin" ? "10" : "9"
                          }
                        >
                          No tickets found for this gate in {moment(selectedMonth).format("MMMM YYYY")}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {totalPages > 1 && (
  <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
    <div className="text-gray-600 text-sm">
      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} tickets
    </div>
    
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-lg text-sm ${
          currentPage === 1
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        First
      </button>
      
      <button
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg ${
          currentPage === 1
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Previous
      </button>
      
      <span className="text-gray-700 font-medium px-4">
        Page {currentPage} of {totalPages}
      </span>
      
      <button
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg ${
          currentPage === totalPages
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Next
      </button>
      
      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-lg text-sm ${
          currentPage === totalPages
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Last
      </button>
    </div>
  </div>
)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GateMonthlyTickets;