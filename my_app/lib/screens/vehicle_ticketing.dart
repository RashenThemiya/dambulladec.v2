import 'dart:convert';
import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:esc_pos_utils/esc_pos_utils.dart';
import 'package:esc_pos_printer/esc_pos_printer.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart'; // <-- needed for input formatters


class VehicleTicketingPage extends StatefulWidget {
  @override
  _VehicleTicketingPageState createState() => _VehicleTicketingPageState();
}

class _VehicleTicketingPageState extends State<VehicleTicketingPage> {
  int? _selectedVehicleTypeId;
  double _ticketPrice = 0.0;
  String _vehicleNumber = '';
  String? _selectedProvince;
bool get _isPrinterReady {
  if (_hasPosPrinter) return true;
  if (_selectedDevice != null) return true;
  return false;
}

String centerText(String text, int lineWidth) {
  if (text.length >= lineWidth) return text;

  int spaces = ((lineWidth - text.length) / 2).floor();
  return ' ' * spaces + text;
}
final TextEditingController _vehicleNumberController =
    TextEditingController();

  bool _isLoading = false;
  bool _isPrinting = false;
  String? _responseMessage;

  // ================= GATE FEATURE =================
  final List<String> _gates = ['GATE1', 'GATE2', 'GATE3', 'GATE4', 'GATE5'];
  String? _selectedGate;

  // ================= PRINTERS =================
  final BlueThermalPrinter bluetooth = BlueThermalPrinter.instance;
  List<BluetoothDevice> _devices = [];
  BluetoothDevice? _selectedDevice;
  bool _hasPosPrinter = false;

  List<Map<String, dynamic>> _vehicleTypes = [];
  final List<String> _provinces = [
    "Central",
    "Eastern",
    "Northern",
    "North Central",
    "North Western",
    "Sabaragamuwa",
    "Southern",
    "Uva",
    "Western"
  ];

  @override
  void initState() {
    super.initState();
    _fetchVehicleTypes();
    _initPrinters();
    _loadDefaultGate();
  }

  // ================= LOAD / SAVE DEFAULT GATE =================
  Future<void> _loadDefaultGate() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _selectedGate = prefs.getString('default_gate');
    });
  }

  Future<void> _saveDefaultGate(String gate) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('default_gate', gate);
  }

  // ================= FETCH VEHICLE TYPES =================
  Future<void> _fetchVehicleTypes() async {
    setState(() => _isLoading = true);
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    try {
      final response = await http.get(
        Uri.parse('https://api.dambulladec.com/api/vehicle-tickets/vehicle-types'),
        headers: {'Authorization': 'Bearer $token'},
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        setState(() => _vehicleTypes = List<Map<String, dynamic>>.from(data));
      } else {
        setState(() =>
            _responseMessage = data['message'] ?? 'Failed to fetch vehicle types.');
      }
    } catch (e) {
      setState(() => _responseMessage = 'Error fetching vehicle types: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // ================= INIT PRINTERS =================
  Future<void> _initPrinters() async {
    try {
      final profile = await CapabilityProfile.load();
      final printer = NetworkPrinter(PaperSize.mm58, profile);
      final res = await printer.connect('127.0.0.1', port: 9100);
      if (res == PosPrintResult.success) {
        _hasPosPrinter = true;
        printer.disconnect();
      }
    } catch (_) {}

    try {
      List<BluetoothDevice> devices = await bluetooth.getBondedDevices();
      setState(() => _devices = devices);
    } catch (e) {
      setState(() => _responseMessage = 'Bluetooth error: $e');
    }
  }

  // ================= ISSUE TICKET =================
  Future<void> _issueTicket() async {

    if (!_isPrinterReady) {
      setState(() => _responseMessage = 'Printer not detected.');
      return;
    }
    if (_selectedGate == null) {
      setState(() => _responseMessage = 'Please select gate.');
      return;
    }
    if (_selectedVehicleTypeId == null) {
      setState(() => _responseMessage = 'Please select vehicle type.');
      return;
    }
    if (_selectedProvince == null) {
      setState(() => _responseMessage = 'Please select a province.');
      return;
    }

    setState(() {
      _isLoading = true;
      _responseMessage = null;
    });

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    final response = await http.post(
      Uri.parse('https://api.dambulladec.com/api/vehicle-tickets/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'vehicleNumber': _vehicleNumber.isEmpty ? "ABC-1234" : _vehicleNumber,
        'vehicleTypeId': _selectedVehicleTypeId,
        'ticketPrice': _ticketPrice,
        'fromLocation': _selectedProvince,
        'gateNumber': _selectedGate,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 201) {
      await _printTicket(data['ticket'], ticketId: data['ticketId'].toString());
      setState(() {
        _responseMessage = '✅ Ticket issued and printed';
        _vehicleNumber = '';
        _selectedVehicleTypeId = null;
        _ticketPrice = 0.0;
        _selectedProvince = null;
        _vehicleNumberController.clear();
      });
      
    } else {
      setState(() => _responseMessage = data['message']);
    }

    setState(() => _isLoading = false);
  }

  // ================= PRINT TICKET =================
  Future<void> _printTicket(Map<String, dynamic> ticket, {String? ticketId}) async {
    setState(() => _isPrinting = true);

    final now = DateTime.now();
    final date = DateFormat('yyyy-MM-dd').format(now);
    final time = DateFormat('HH:mm').format(now);
final customId = ticket['customId'] ?? ticketId ?? '';
final byWhom = ticket['byWhom'] ?? '';


    if (_hasPosPrinter) {
      final profile = await CapabilityProfile.load();
      final printer = NetworkPrinter(PaperSize.mm58, profile);
      await printer.connect('127.0.0.1', port: 9100);
      printer.text(centerText("Dambulla Dedicated", 32) + '\n');
      printer.text(centerText("Economic Center", 32) + '\n');
      printer.text(centerText("Tel- 066 2285181", 32) + '\n');
      printer.text(centerText("Web - dambulladec.com", 32) + '\n');
      printer.text("ID       : $customId");
      printer.text("Vehicle No : ${_vehicleNumber.isEmpty ? 'not include' : _vehicleNumber}");
      printer.text("Gate       : $_selectedGate");
      printer.text("Date       : $date");
      printer.text("Time       : $time");
      printer.text("Price       : $_ticketPrice");
      printer.text("Issued By  : $byWhom");
      printer.text("============================\n\n");
      printer.cut();
      printer.disconnect();
    } else if (_selectedDevice != null) {
      bool? connected = await bluetooth.isConnected;
      if (connected != true) await bluetooth.connect(_selectedDevice!);
      bluetooth.write(centerText("Dambulla Dedicated", 32) + '\n');
      bluetooth.write(centerText("Economic Center", 32) + '\n');
      bluetooth.write(centerText("Tel- 066 2285181", 32) + '\n');
      bluetooth.write(centerText("Web - dambulladec.com", 32) + '\n');
      bluetooth.write("ID       : $customId\n");
      bluetooth.write("Vehicle No : ${_vehicleNumber.isEmpty ? 'notinclude' : _vehicleNumber}\n");
      bluetooth.write("Gate       : $_selectedGate\n");
      bluetooth.write("Date       : $date\n");
      bluetooth.write("Time       : $time\n");
      bluetooth.write("Price      : Rs. $_ticketPrice\n");
      bluetooth.write("Issued By  : $byWhom\n");
      bluetooth.write("============================\n\n");

    }
    setState(() => _isPrinting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Issue Vehicle Ticket')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: _isLoading && _vehicleTypes.isEmpty
            ? Center(child: CircularProgressIndicator())
            : ListView(
                children: [

                  
                  // ================= GATE SELECTION =================
                  Text("Select Gate", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedGate,
                    hint: Text("Select Gate"),
                    items: _gates
                        .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                        .toList(),
                    onChanged: (g) {
                      setState(() => _selectedGate = g);
                      _saveDefaultGate(g!);
                    },
                  ),
                  const SizedBox(height: 16),
                  // ================= VEHICLE NUMBER INPUT =================
                  Text("Vehicle Number", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                      controller: _vehicleNumberController,
                      keyboardType: TextInputType.text, // standard text keyboard
                      textCapitalization: TextCapitalization.characters, // auto-uppercase
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9 \-]')), // only A-Z, 0-9, space, -
                        LengthLimitingTextInputFormatter(10), // optional max length
                      ],
                      decoration: InputDecoration(
                        border: OutlineInputBorder(),
                        hintText: "Enter Vehicle Number",
                      ),
                      onChanged: (v) => _vehicleNumber = v.toUpperCase(),
                    ),
                  const SizedBox(height: 16),


                  // ================= VEHICLE TYPE =================
                  Text("Select Vehicle Type", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  _vehicleTypes.isEmpty
                      ? Text("Loading vehicle types...")
                      : Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _vehicleTypes.map((v) {
                            final isSelected = _selectedVehicleTypeId == v['id'];
                            return ChoiceChip(
                              label: Text("${v['name']} (Rs. ${v['defaultPrice'] ?? '0.0'})"),
                              selected: isSelected,
                              onSelected: (_) {
                                setState(() {
                                  _selectedVehicleTypeId = v['id'];
                                  _ticketPrice = double.tryParse(
                                          v['defaultPrice'].toString()) ?? 0.0;
                                });
                              },
                            );
                          }).toList(),
                        ),
                  const SizedBox(height: 16),

                  // ================= PROVINCE =================
                  Text("Select Province", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _provinces.map((p) {
                      final isSelected = _selectedProvince == p;
                      return ChoiceChip(
                        label: Text(p),
                        selected: isSelected,
                        onSelected: (_) => setState(() => _selectedProvince = p),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),

                  // ================= PRINTER SELECTION =================
                  if (!_hasPosPrinter)
                    DropdownButton<BluetoothDevice>(
                      value: _selectedDevice,
                      hint: Text("Select Printer"),
                      items: _devices
                          .map((d) => DropdownMenuItem(
                                value: d,
                                child: Text(d.name ?? 'Unknown'),
                              ))
                          .toList(),
                      onChanged: (d) => setState(() => _selectedDevice = d),
                    ),
                  const SizedBox(height: 24),

                  // ================= ISSUE TICKET BUTTON =================
                            _isLoading
                        ? Center(child: CircularProgressIndicator())
                        : ElevatedButton(
                            onPressed: (!_isPrinterReady || _isLoading || _isPrinting)
                                ? null
                                : _issueTicket,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.yellow[300], // ✅ light yellow
                              foregroundColor: Colors.black,       // text color
                              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                            ),
                            child: Text(
                              _isPrinterReady
                                  ? 'Issue Ticket (Rs. ${_ticketPrice.toStringAsFixed(2)})'
                                  : 'Waiting for printer...',
                              style: const TextStyle(fontSize: 16),
                            ),
                          ),


                  // ================= RESPONSE MESSAGE =================
                  if (_responseMessage != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      _responseMessage!,
                      style: TextStyle(
                          color: _responseMessage!.contains('✅') ? Colors.green : Colors.red),
                    ),
                  ]
                ],
              ),
      ),
    );
  }
}
