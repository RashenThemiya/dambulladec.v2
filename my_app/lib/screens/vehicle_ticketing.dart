import 'dart:convert';
import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:esc_pos_utils/esc_pos_utils.dart';
import 'package:esc_pos_printer/esc_pos_printer.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

class VehicleTicketingPage extends StatefulWidget {
  @override
  _VehicleTicketingPageState createState() => _VehicleTicketingPageState();
}

class _VehicleTicketingPageState extends State<VehicleTicketingPage> {
  int? _selectedVehicleTypeId;
  double _ticketPrice = 0.0;
  String _vehicleNumber = '';
  String? _selectedProvince;

  bool _isLoading = false;
  bool _isPrinting = false;
  String? _responseMessage;

  // Bluetooth
  final BlueThermalPrinter bluetooth = BlueThermalPrinter.instance;
  List<BluetoothDevice> _devices = [];
  BluetoothDevice? _selectedDevice;
  bool _testPrinted = false;

  // ESC/POS for USB/Built-in POS
  bool _hasPosPrinter = false;

  List<Map<String, dynamic>> _vehicleTypes = [];
  final List<String> _provinces = [
    "Central", "Eastern", "Northern", "North Central",
    "North Western", "Sabaragamuwa", "Southern", "Uva", "Western"
  ];

  @override
  void initState() {
    super.initState();
    _fetchVehicleTypes();
    _initPrinters();
  }

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
        setState(() => _responseMessage = data['message'] ?? 'Failed to fetch vehicle types.');
      }
    } catch (e) {
      setState(() => _responseMessage = 'Error fetching vehicle types: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _initPrinters() async {
    // 1. Check built-in POS/USB printer (ESC/POS)
    try {
      final profile = await CapabilityProfile.load();
      final printer = NetworkPrinter(PaperSize.mm58, profile);

      // Test connection to 127.0.0.1 (some POS devices expose a local port)
      final res = await printer.connect('127.0.0.1', port: 9100);
      if (res == PosPrintResult.success) {
        _hasPosPrinter = true;
        setState(() => _responseMessage = '✅ Built-in POS printer detected');
        printer.disconnect();
        return; // POS printer found, no need to init Bluetooth
      }
    } catch (e) {
      print("No POS printer detected: $e");
    }

    // 2. Init Bluetooth as fallback
    try {
      List<BluetoothDevice> devices = await bluetooth.getBondedDevices();
      BluetoothDevice? pt210Device;

      for (var device in devices) {
        if ((device.name?.toLowerCase().contains('pt') ?? false) ||
            (device.name?.toLowerCase().contains('printer') ?? false)) {
          pt210Device = device;
          break;
        }
      }

      setState(() {
        _devices = devices;
        _selectedDevice = pt210Device;
      });

      if (pt210Device != null) {
        bool? connected = await bluetooth.isConnected;
        if (connected != true) await bluetooth.connect(pt210Device);
        if (!_testPrinted) {
          await _printTestLabel();
          _testPrinted = true;
        }
        setState(() => _responseMessage = '✅ Connected to PT210 Bluetooth printer');
      } else {
        setState(() => _responseMessage = '❌ PT210 Bluetooth printer not found. Pair it first.');
      }
    } catch (e) {
      setState(() => _responseMessage = 'Bluetooth error: $e');
    }
  }

  Future<void> _printTestLabel() async {
    if (_hasPosPrinter) {
      try {
        final profile = await CapabilityProfile.load();
        final printer = NetworkPrinter(PaperSize.mm58, profile);
        await printer.connect('127.0.0.1', port: 9100);
        printer.text('===== TEST PRINT =====');
        printer.cut();
        printer.disconnect();
      } catch (e) {
        print("POS test print failed: $e");
      }
    } else if (_selectedDevice != null) {
      bluetooth.write("\n\n====== TEST PRINT ======\nPrinter connected ✅\n========================\n\n\n");
    }
  }

  Future<void> _issueTicket() async {
    if (_selectedVehicleTypeId == null) {
      setState(() => _responseMessage = 'Please select vehicle type.');
      return;
    }
    if (_selectedProvince == null) {
      setState(() => _responseMessage = 'Please select a province.');
      return;
    }
    if (!_hasPosPrinter && _selectedDevice == null) {
      setState(() => _responseMessage = 'No printer detected.');
      return;
    }

    setState(() {
      _isLoading = true;
      _responseMessage = null;
    });

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final vehicleNumber = _vehicleNumber.isEmpty ? "ABC-1234" : _vehicleNumber;

    final url = Uri.parse('https://api.dambulladec.com/api/vehicle-tickets/');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'vehicleNumber': vehicleNumber,
          'vehicleTypeId': _selectedVehicleTypeId,
          'ticketPrice': _ticketPrice,
          'fromLocation': _selectedProvince,
          'gateNumber': 'GATE1',
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {
        await _printTicket(data['ticket'], ticketId: data['ticketId'].toString());
        setState(() {
          _responseMessage = '✅ Ticket issued and printed: ID ${data['ticketId']}';
          _vehicleNumber = '';
          _selectedVehicleTypeId = null;
          _ticketPrice = 0.0;
          _selectedProvince = null;
        });
      } else {
        setState(() => _responseMessage = data['message'] ?? 'Ticket issue failed.');
      }
    } catch (e) {
      setState(() => _responseMessage = 'Error issuing ticket: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _printTicket(Map<String, dynamic> ticket, {String? ticketId}) async {
    setState(() => _isPrinting = true);
    try {
      final now = DateTime.now().toUtc().add(Duration(hours: 5, minutes: 30));
      final formattedDate = DateFormat('yyyy-MM-dd').format(now);
      final formattedTime = DateFormat('HH:mm').format(now);

      String centerText(String text, int lineWidth) {
        int padding = ((lineWidth - text.length) / 2).floor();
        return ' ' * padding + text;
      }

      if (_hasPosPrinter) {
        // Use ESC/POS USB/Built-in printer
        final profile = await CapabilityProfile.load();
        final printer = NetworkPrinter(PaperSize.mm58, profile);
        await printer.connect('127.0.0.1', port: 9100);
        printer.text(centerText("Dambulla Dedicated", 32));
        printer.text(centerText("Economic Center", 32));
        printer.text(centerText("Tel- 066 2285181", 32));
        printer.text(centerText("Web - dambulladec.com", 32));
        printer.text(centerText("====== VEHICLE TICKET ======", 32));
        printer.text("Ticket ID  : ${ticketId ?? ''}");
        printer.text("Vehicle No : ${ticket['vehicleNumber'] ?? ''}");
        printer.text("Type       : ${ticket['vehicleType'] ?? ''}");
        printer.text("Price      : Rs. ${ticket['ticketPrice'] ?? ''}");
        printer.text("Location   : ${ticket['fromLocation'] ?? ''}");
        printer.text("Date       : $formattedDate");
        printer.text("Time       : $formattedTime");
        printer.text("Issued By  : ${ticket['byWhom'] ?? ''}");
        printer.text("============================");
        printer.cut();
        printer.disconnect();
      } else if (_selectedDevice != null) {
        // Use Bluetooth
        bool? connected = await bluetooth.isConnected;
        if (connected != true) await bluetooth.connect(_selectedDevice!);

        bluetooth.write("\n\n");
        bluetooth.write(centerText("Dambulla Dedicated", 32) + '\n');
        bluetooth.write(centerText("Economic Center", 32) + '\n');
        bluetooth.write(centerText("Tel- 066 2285181", 32) + '\n');
        bluetooth.write(centerText("Web - dambulladec.com", 32) + '\n\n');
        bluetooth.write(centerText("====== VEHICLE TICKET ======", 32) + '\n');
        bluetooth.write("Ticket ID  : ${ticketId ?? ''}\n");
        bluetooth.write("Vehicle No : ${ticket['vehicleNumber'] ?? ''}\n");
        bluetooth.write("Type       : ${ticket['vehicleType'] ?? ''}\n");
        bluetooth.write("Price      : Rs. ${ticket['ticketPrice'] ?? ''}\n");
        bluetooth.write("Location   : ${ticket['fromLocation'] ?? ''}\n");
        bluetooth.write("Date       : $formattedDate\n");
        bluetooth.write("Time       : $formattedTime\n");
        bluetooth.write("Issued By  : ${ticket['byWhom'] ?? ''}\n");
        bluetooth.write("============================\n\n\n");
      }
    } catch (e) {
      setState(() => _responseMessage = '❌ Printing failed: $e');
    } finally {
      setState(() => _isPrinting = false);
    }
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
                  TextField(
                    autofocus: true,
                    onChanged: (val) => _vehicleNumber = val.toUpperCase(),
                    decoration: InputDecoration(
                      labelText: 'Vehicle Number (optional)',
                      hintText: 'e.g., ABC-1234',
                    ),
                    keyboardType: TextInputType.text,
                    textCapitalization: TextCapitalization.characters,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9-]')),
                    ],
                  ),
                  const SizedBox(height: 16),

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
                  _isLoading
                      ? Center(child: CircularProgressIndicator())
                      : ElevatedButton(
                          onPressed: _isPrinting ? null : _issueTicket,
                          child: Text('Issue Ticket (Rs. ${_ticketPrice.toStringAsFixed(2)})'),
                        ),

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
