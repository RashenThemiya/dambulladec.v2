import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/axiosInstance";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const exportVehicleTicketsExcel = async (tickets) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Vehicle Tickets");

  worksheet.columns = [
    { header: "#", key: "index", width: 8 },
    { header: "Ref ID", key: "id", width: 12 },
    { header: "Vehicle Number", key: "vehicleNumber", width: 18 },
    { header: "Type", key: "vehicleType", width: 14 },
    { header: "Price", key: "ticketPrice", width: 12 },
    { header: "Time", key: "time", width: 20 },
    { header: "By", key: "byWhom", width: 25 },
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

  tickets.forEach((ticket, idx) => {
    worksheet.addRow({
      index: idx + 1,
      id: ticket.id,
      vehicleNumber: ticket.vehicleNumber,
      vehicleType: ticket.vehicleType,
      ticketPrice: Number(ticket.ticketPrice).toFixed(2),
      time: ticket.time,
      byWhom: ticket.byWhom,
    });
  });

  const total = tickets.reduce((sum, t) => sum + parseFloat(t.ticketPrice), 0);

  // Add the total row
  const totalRow = worksheet.addRow({
    index: '', // Empty for index
    id: 'Total', // "Total" in the leftmost cell
    vehicleNumber: '',
    vehicleType: '',
    ticketPrice: total.toFixed(2), // Always two decimals
    time: '',
    byWhom: '',
  });

  // Make the total row bold for emphasis
  totalRow.font = { bold: true };

  // Set number format for the Price column (including the total row)
  worksheet.getColumn('ticketPrice').numFmt = '0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `VehicleTickets_${new Date().toISOString()}.xlsx`);
};


const VehicleTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Lorry");
  const [ticketPrice, setTicketPrice] = useState("");
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");
  const [searchVehicleNumber, setSearchVehicleNumber] = useState("");
  const [searchByWhom, setSearchByWhom] = useState(""); // ✅ New
  const [dailyIncome, setDailyIncome] = useState({ totalIncome: 0, ticketCount: 0 });
  const [monthlyIncome, setMonthlyIncome] = useState({ totalIncome: 0, ticketCount: 0 });

  const vehicleTypes = ["Lorry", "Van", "Three-Wheeler", "Motorbike", "Car"];
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  useEffect(() => {
    fetchTickets();
    fetchDailyIncome();
  }, [searchDate, searchByWhom]); // ✅ Watch searchByWhom

  useEffect(() => {
    filterTickets();
  }, [searchVehicleNumber, tickets]);

  useEffect(() => {
    fetchMonthlyIncome();
  }, [searchByWhom]); // ✅ Watch searchByWhom

  const fetchTickets = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchDate) queryParams.append("date", searchDate);
      if (searchByWhom) queryParams.append("byWhom", searchByWhom);
      const res = await api.get(`/api/vehicle-tickets/by-date?${queryParams}`);
      setTickets(res.data.tickets || []);
      setFilteredTickets(res.data.tickets || []);
    } catch (err) {
      setError("Failed to fetch tickets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyIncome = async () => {
    try {
      const res = await api.get("/api/vehicle-tickets/daily-income");
      const targetDate = searchDate || new Date().toISOString().split("T")[0];
      let dateData = res.data.find(entry => entry.date === targetDate);

      if (searchByWhom) {
        // Filter manually by 'byWhom'
        const filtered = tickets.filter(t => t.date === targetDate && t.byWhom.includes(searchByWhom));
        const totalIncome = filtered.reduce((acc, curr) => acc + parseFloat(curr.ticketPrice), 0);
        dateData = { totalIncome, ticketCount: filtered.length };
      }

      setDailyIncome(dateData || { totalIncome: 0, ticketCount: 0 });
    } catch (err) {
      console.error("Failed to fetch daily income:", err);
    }
  };

  const fetchMonthlyIncome = async () => {
    try {
      const res = await api.get("/api/vehicle-tickets/monthly-income");
      const now = new Date();
      const monthData = res.data.find(entry =>
        parseInt(entry.month) === now.getMonth() + 1 &&
        parseInt(entry.year) === now.getFullYear()
      );

      if (searchByWhom) {
        const filtered = tickets.filter(t => {
          const dateObj = new Date(t.date);
          return (
            dateObj.getMonth() === now.getMonth() &&
            dateObj.getFullYear() === now.getFullYear() &&
            t.byWhom.includes(searchByWhom)
          );
        });

        const totalIncome = filtered.reduce((acc, curr) => acc + parseFloat(curr.ticketPrice), 0);
        setMonthlyIncome({ totalIncome, ticketCount: filtered.length });
      } else {
        setMonthlyIncome(monthData || { totalIncome: 0, ticketCount: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch monthly income:", err);
    }
  };

  const filterTickets = () => {
    const filtered = tickets.filter(ticket =>
      ticket.vehicleNumber.toLowerCase().includes(searchVehicleNumber.toLowerCase())
    );
    setFilteredTickets(filtered);
  };

  const handleIssueTicket = async () => {
    setError(null);
    setSuccessMsg("");
    if (!vehicleNumber || !vehicleType || !ticketPrice) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const response = await api.post("/api/vehicle-tickets", {
        vehicleNumber,
        vehicleType,
        ticketPrice,
      });

      setSuccessMsg(`Ticket issued with ID: ${response.data.ticket.id}`);
      setVehicleNumber("");
      setTicketPrice("");
      fetchTickets();
      fetchDailyIncome();
      fetchMonthlyIncome();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to issue ticket.");
    }
  };

  const handleDeleteTicket = async (id) => {

    try {
      await api.delete(`/api/vehicle-tickets/${id}`);
      setSuccessMsg("Ticket deleted successfully.");
      fetchTickets(); // Refresh the list
      fetchDailyIncome();
      fetchMonthlyIncome();
    } catch (err) {
      setError("Failed to delete the ticket.");
    }
  };


  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Vehicle Ticket Management
          </h2>

          {/* Issue Ticket Form */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Vehicle Number"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg"
            />
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg"
            >
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Ticket Price"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg"
            />
          </div>

          <button
            onClick={handleIssueTicket}
            className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-6 rounded-lg transition"
          >
            Issue Ticket
          </button>

          {error && <div className="mt-4 text-red-600">{error}</div>}
          {successMsg && <div className="mt-4 text-green-600">{successMsg}</div>}

          {/* Daily and Monthly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 mb-8">
            <div className="bg-white rounded-lg shadow p-4 border border-teal-100">
              <h4 className="text-lg font-semibold text-gray-700">
                {searchDate ? `Income on ${searchDate}` : "Today's Income"}
              </h4>
              <p className="text-teal-700 font-bold text-2xl">
                Rs. {parseFloat(dailyIncome?.totalIncome).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Tickets issued: {dailyIncome?.ticketCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-teal-100">
              <h4 className="text-lg font-semibold text-gray-700">This Month's Income</h4>
              <p className="text-teal-700 font-bold text-2xl">
                Rs. {parseFloat(monthlyIncome?.totalIncome).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Tickets issued: {monthlyIncome?.ticketCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
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

          {/* Ticket Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
  <h3 className="text-xl font-semibold text-gray-700">Filtered Tickets</h3>
  <button
    onClick={() => exportVehicleTicketsExcel(filteredTickets)}
    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
    disabled={filteredTickets.length === 0}
    title={filteredTickets.length === 0 ? "No tickets to export" : "Export tickets to Excel"}
  >
    Export to Excel
  </button>
</div>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="w-full table-auto border-collapse">
                <thead className="bg-teal-600 text-white">
                  <tr>
                    <th className="p-3 text-left">#</th> 
                    <th className="p-3 text-left">Ref ID</th >

                    <th className="p-3 text-left">Vehicle Number</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Time</th>
                    <th className="p-3 text-left">By</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                 {filteredTickets.length > 0 ? (
  filteredTickets.map((ticket, index) => (
    <tr key={ticket.id} className="border-b hover:bg-gray-50">
      <td className="p-3">{index + 1}</td>  {/* Chronological ID */}
      <td className="p-3">{ticket.id}</td>  {/* Reference ID */}
      <td className="p-3">{ticket.vehicleNumber}</td>
      <td className="p-3">{ticket.vehicleType}</td>
      <td className="p-3">Rs. {ticket.ticketPrice}</td>
      <td className="p-3">{ticket.time}</td>
      <td className="p-3">{ticket.byWhom}</td>
      <td className="p-3">
        <ConfirmWrapper
          message="Are you sure you want to delete this ticket?"
          onConfirm={() => handleDeleteTicket(ticket.id)}
        >
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto justify-center">
            <span>Delete</span>
            <FaTrash className="text-base" />
          </button>
        </ConfirmWrapper>
      </td>
    </tr>
  ))
) : (
  <tr>
    <td className="p-3 text-center text-gray-500" colSpan="8">
      No tickets found.
    </td>
  </tr>
)}

                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleTickets;
