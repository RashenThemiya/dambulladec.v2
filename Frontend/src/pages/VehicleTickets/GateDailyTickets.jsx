import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import Sidebar from "../../components/Sidebar";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const exportGateTicketsExcel = async (tickets, gateNumber, date) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Gate ${gateNumber} - ${date}`);

  worksheet.columns = [
    { header: "#", key: "index", width: 8 },
    { header: "Custom ID", key: "customId", width: 15 },
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
      customId: ticket.customId,
      vehicleNumber: ticket.vehicleNumber,
      vehicleType: ticket.VehicleType?.name || ticket.vehicleType,
      ticketPrice: Number(ticket.ticketPrice).toFixed(2),
      time: moment.utc(ticket.entryTime).format("YYYY-MM-DD HH:mm:ss"),
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
    time: "",
    byWhom: "",
  });

  totalRow.font = { bold: true };
  worksheet.getColumn("ticketPrice").numFmt = "0.00";

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Gate_${gateNumber}_Daily_${date}.xlsx`
  );
};

const GateDailyTickets = () => {
  const { gateNumber } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [searchDate, setSearchDate] = useState(moment().format("YYYY-MM-DD"));
  const [searchVehicleNumber, setSearchVehicleNumber] = useState("");
  const [searchByWhom, setSearchByWhom] = useState("");

  const [totalIncome, setTotalIncome] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    fetchTickets();
  }, [gateNumber, searchDate, searchByWhom, searchVehicleNumber]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("startDate", searchDate);
      queryParams.append("endDate", searchDate);
      queryParams.append("gateNumber", gateNumber);
      if (searchByWhom) queryParams.append("byWhom", searchByWhom);
      if (searchVehicleNumber)
        queryParams.append("vehicleNumber", searchVehicleNumber);

      const res = await api.get(`/api/vehicle-tickets/by-date?${queryParams}`);
      const ticketData = res.data.tickets || [];
      setTickets(ticketData);

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
              className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-semibold"
            >
              <FaArrowLeft /> Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              Gate {gateNumber} - Daily Tickets
            </h2>
            <div className="w-24"></div>
          </div>

          {error && <div className="mb-4 text-red-600">{error}</div>}
          {successMsg && (
            <div className="mb-4 text-green-600">{successMsg}</div>
          )}

          <div className="bg-gradient-to-r from-green-700 to-green-900 text-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Income for {moment(searchDate).format("MMMM DD, YYYY")}
            </h3>
            <p className="text-3xl font-bold">
              Rs. {totalIncome.toLocaleString()}
            </p>
            <p className="text-sm mt-2">Total Tickets: {ticketCount}</p>
          </div>

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

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">
                Tickets ({tickets.length})
              </h3>
              <button
                onClick={() =>
                  exportGateTicketsExcel(tickets, gateNumber, searchDate)
                }
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
                disabled={tickets.length === 0}
              >
                Export to Excel
              </button>
            </div>

            {loading ? (
              <p className="text-center py-8">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead className="bg-teal-600 text-white">
                    <tr>
                      <th className="p-3 text-left">#</th>
                      <th className="p-3 text-left">Custom ID</th>
                      <th className="p-3 text-left">Vehicle Number</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Price</th>
                      <th className="p-3 text-left">Time</th>
                      <th className="p-3 text-left">By</th>
                      {(role === "admin" || role === "superadmin") && (
                        <th className="p-3 text-left">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length > 0 ? (
                      tickets.map((ticket, index) => (
                        <tr
                          key={ticket.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 font-mono text-sm">
                            {ticket.customId}
                          </td>
                          <td className="p-3">{ticket.vehicleNumber}</td>
                          <td className="p-3">
                            {ticket.VehicleType?.name || ticket.vehicleType}
                          </td>
                          <td className="p-3">Rs. {ticket.ticketPrice}</td>
                          <td className="p-3">
                            {moment.utc(ticket.entryTime).format("HH:mm:ss")}
                          </td>
                          <td className="p-3">{ticket.byWhom}</td>
                          {(role === "admin" || role === "superadmin") && (
                            <td className="p-3">
                              {index === 0 ? (
                                <ConfirmWrapper
                                  message="Are you sure you want to delete this ticket?"
                                  onConfirm={() =>
                                    handleDeleteTicket(ticket.id)
                                  }
                                >
                                  <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
                                    <span>Delete</span>
                                    <FaTrash className="text-base" />
                                  </button>
                                </ConfirmWrapper>
                              ) : null}
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="p-3 text-center text-gray-500"
                          colSpan={
                            role === "admin" || role === "superadmin"
                              ? "9"
                              : "8"
                          }
                        >
                          No tickets found for this gate on {searchDate}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GateDailyTickets;
