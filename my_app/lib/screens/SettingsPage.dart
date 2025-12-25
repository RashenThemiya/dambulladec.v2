import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsPage extends StatefulWidget {
  @override
  _SettingsPageState createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _priceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCurrentPrice();
  }

  Future<void> _loadCurrentPrice() async {
    final prefs = await SharedPreferences.getInstance();
    final price = prefs.getDouble('ticketPrice') ?? 50.0;
    _priceController.text = price.toStringAsFixed(2);
  }

  Future<void> _savePrice() async {
    final price = double.tryParse(_priceController.text);
    if (price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please enter a valid ticket price.')),
      );
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('ticketPrice', price);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('✅ Ticket price updated')),
    );

    Navigator.pop(context); // Go back to the previous page
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Settings'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _priceController,
              keyboardType: TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Default Ticket Price',
                prefixText: 'Rs ',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _savePrice,
              icon: Icon(Icons.save),
              label: Text('Save Ticket Price'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
                minimumSize: Size.fromHeight(50),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
