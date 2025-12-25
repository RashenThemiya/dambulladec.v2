import 'dart:convert';

import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

class VehicleTicketingPage extends StatefulWidget {
  @override
  _VehicleTicketingPageState createState() => _VehicleTicketingPageState();
}

class _VehicleTicketingPageState extends State<VehicleTicketingPage> {
  final _vehicleNumberController = TextEditingController();
  String _selectedVehicleType = 'Car';
  bool _isLoading = false;
  bool _isPrinting = false;
  String? _responseMessage;
  double _ticketPrice = 50.0;

  final BlueThermalPrinter bluetooth = BlueThermalPrinter.instance;
  List<BluetoothDevice> _devices = [];
  BluetoothDevice? _selectedDevice;
  bool _testPrinted = false;

  final List<Map<String, dynamic>> _vehicleTypes = [
    {'label': 'Lorry', 'icon': Icons.local_shipping},
    {'label': 'Van', 'icon': Icons.airport_shuttle},
    {'label': 'Three-Wheeler', 'icon': Icons.electric_rickshaw},
    {'label': 'Motorbike', 'icon': Icons.motorcycle},
    {'label': 'Car', 'icon': Icons.directions_car},
  ];

  @override
  void initState() {
    super.initState();
    _loadTicketPrice();
    _initBluetooth();
  }

  Future<void> _loadTicketPrice() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _ticketPrice = prefs.getDouble('ticketPrice') ?? 50.0;
    });
  }

  Future<void> _initBluetooth() async {
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
        if (connected != true) {
          await bluetooth.connect(pt210Device);
          await Future.delayed(Duration(seconds: 1));
        }

        if (!_testPrinted) {
          await _printTestLabel();
          _testPrinted = true;
        }

        setState(() {
          _responseMessage = '✅ Connected to ${pt210Device?.name ?? 'PT210'}';
        });
      } else {
        setState(() {
          _responseMessage = '❌ PT210 printer not found. Pair it in Bluetooth settings.';
        });
      }
    } catch (e) {
      setState(() {
        _responseMessage = 'Bluetooth error: $e';
      });
    }
  }

  /// Modified to optionally accept a ticketId to print on the test label
  Future<void> _printTestLabel({String? ticketId}) async {
    try {
      bluetooth.write("\n\n");
      bluetooth.write("====== TEST PRINT ======\n");
      bluetooth.write("Printer connected ✅\n");
      if (ticketId != null) {
        bluetooth.write("Ticket ID: $ticketId\n");
      }
      bluetooth.write("========================\n\n\n");
    } catch (e) {
      setState(() {
        _responseMessage = '❌ Test print failed: $e';
      });
    }
  }

  Future<void> issueTicket() async {
    final vehicleNumber = _vehicleNumberController.text.trim();

    if (vehicleNumber.isEmpty) {
      setState(() => _responseMessage = 'Vehicle number is required.');
      return;
    }

    if (_selectedDevice == null) {
      setState(() => _responseMessage = 'Please select a Bluetooth printer.');
      return;
    }

    setState(() {
      _isLoading = true;
      _responseMessage = null;
    });

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final url = Uri.parse('https://api.dambulladec.com/api/vehicle-tickets/');

    try {
      
final nowUtc = DateTime.now().toUtc();
final now = nowUtc.add(Duration(hours: 5, minutes: 30)); // Sri Lanka time

final formattedTime = DateFormat('HH:mm').format(now);
final formattedDate = DateFormat('yyyy-MM-dd').format(now);


      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'vehicleNumber': vehicleNumber,
          'vehicleType': _selectedVehicleType,
          'ticketPrice': _ticketPrice,
          'date': formattedDate,
          'time': formattedTime,// ⬅️ Send this to backend
        }),
      );


      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {
        // Print test label with ticket ID first time only (optional)
        if (!_testPrinted) {
          await _printTestLabel(ticketId: data['ticketId'].toString());
          _testPrinted = true;
        }

        await _printTicket(data['ticket'], ticketId: data['ticketId'].toString());

        setState(() {
          _responseMessage = '✅ Ticket printed: ID ${data['ticketId']}';
          _vehicleNumberController.clear();
          _selectedVehicleType = 'Car';
        });
      } else {
        setState(() {
          _responseMessage = data['message'] ?? 'Ticket issue failed.';
        });
      }
    } catch (e) {
      setState(() {
        _responseMessage = 'Something went wrong while issuing the ticket.';
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

    Future<void> _printTicket(Map<String, dynamic> ticket, {String? ticketId}) async {    setState(() {
      _isPrinting = true;
      _responseMessage = '🖨️ Printing ticket...';
    });

    try {
      bool? connected = await bluetooth.isConnected;
      if (connected != true && _selectedDevice != null) {
        await bluetooth.connect(_selectedDevice!);
        await Future.delayed(Duration(seconds: 1));
      }
final nowUtc = DateTime.now().toUtc();
final now = nowUtc.add(Duration(hours: 5, minutes: 30)); // Sri Lanka time
final formattedDate = DateFormat('yyyy-MM-dd').format(now);
final formattedTime = DateFormat('HH:mm').format(now);
String centerText(String text, int lineWidth) {
  int padding = ((lineWidth - text.length) / 2).floor();
  return ' ' * padding + text;
}
      bluetooth.write("\n\n");
     bluetooth.write(centerText("Dambulla Dedicated", 32) + '\n');
    bluetooth.write(centerText("Economic Center", 32) + '\n');
      bluetooth.write(centerText("Tel- 066 2285181", 32) + '\n');
      bluetooth.write(centerText("Web - dambulladec.com", 32) + '\n');
      bluetooth.write('\n');
      bluetooth.write(centerText("====== VEHICLE TICKET ======", 32) + '\n');
      bluetooth.write("Ticket ID  : ${ticketId ?? ''}\n");
        bluetooth.write("Vehicle No : ${ticket['vehicleNumber'] ?? ''}\n");
      bluetooth.write("Type       : ${ticket['vehicleType'] ?? ''}\n");
      bluetooth.write("Price      : Rs. ${ticket['ticketPrice'] ?? ''}\n");
      bluetooth.write("Date       : ${formattedDate ?? ''}\n");
      bluetooth.write("Time       : ${formattedTime ?? ''}\n");
      bluetooth.write("Issued By  : ${ticket['byWhom'] ?? ''}\n");
      bluetooth.write("============================\n\n\n");
    } catch (e) {
      setState(() {
        _responseMessage = '❌ Printing failed: $e';
      });
    } finally {
      setState(() {
        _isPrinting = false;
      });
    }
  }

  @override
  void dispose() {
    _vehicleNumberController.dispose();
    bluetooth.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
  return Scaffold(
    appBar: AppBar(
      title: Text(
        'Issue Vehicle Ticket',
        style: TextStyle(fontSize: 22), // 🔹 Larger app bar title
      ),
    ),
    body: Padding(
      padding: const EdgeInsets.all(16.0),
      child: ListView(
        children: [
          TextField(
            controller: _vehicleNumberController,
            decoration: InputDecoration(
              labelText: 'Vehicle Number',
              labelStyle: TextStyle(fontSize: 18), // 🔹 Larger label
            ),
            textCapitalization: TextCapitalization.characters,
            style: TextStyle(fontSize: 18), // 🔹 Larger input text
          ),
          const SizedBox(height: 24),
          Text(
            'Select Vehicle Type',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18), // 🔹 Larger section title
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            children: _vehicleTypes.map((type) {
              final isSelected = _selectedVehicleType == type['label'];
              return ChoiceChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(type['icon'], size: 20),
                    const SizedBox(width: 6),
                    Text(type['label'], style: TextStyle(fontSize: 16)), // 🔹 Larger chip text
                  ],
                ),
                selected: isSelected,
                onSelected: (_) {
                  setState(() {
                    _selectedVehicleType = type['label'];
                  });
                },
                selectedColor: Colors.blue.shade100,
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10), // 🔹 Larger chip
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          DropdownButton<BluetoothDevice>(
            value: _selectedDevice,
            hint: Text("Select Printer", style: TextStyle(fontSize: 18)),
            items: _devices.map((device) {
              return DropdownMenuItem(
                value: device,
                child: Text(
                  device.name ?? device.address ?? 'Unknown Device',
                  style: TextStyle(fontSize: 16), // 🔹 Larger dropdown text
                ),
              );
            }).toList(),
            onChanged: (device) {
              setState(() => _selectedDevice = device);
            },
            isExpanded: true,
          ),
          const SizedBox(height: 24),
          _isLoading
              ? Center(child: CircularProgressIndicator())
              : ElevatedButton.icon(
                  onPressed: _isPrinting ? null : issueTicket,
                  icon: Icon(Icons.local_parking, size: 28), // 🔹 Larger icon
                  label: Text(
                    'Issue Ticket (LKR ${_ticketPrice.toStringAsFixed(2)})',
                    style: TextStyle(fontSize: 20), // 🔹 Larger button text
                  ),
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 20, horizontal: 24), // 🔹 Bigger button
                    minimumSize: Size(double.infinity, 64), // 🔹 Full width, taller
                  ),
                ),
          if (_responseMessage != null) ...[
            const SizedBox(height: 24),
            Row(
              children: [
                if (_isPrinting) CircularProgressIndicator(),
                if (_isPrinting) const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _responseMessage!,
                    style: TextStyle(
                      fontSize: 16,
                      color: _responseMessage!.contains('✅')
                          ? Colors.green
                          : (_isPrinting ? Colors.orange : Colors.red),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    ),
  );
}
}
