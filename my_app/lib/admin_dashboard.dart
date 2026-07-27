import 'package:flutter/material.dart';

import '../components/custom_navbar.dart';
import '../screens/sanitation_ticketing.dart';
import '../screens/vehicle_ticketing.dart';

class AdminDashboard extends StatefulWidget {
  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
    VehicleTicketingPage(),
    SanitationTicketingPage(),
    Container(), // Logout placeholder
  ];

  void _onItemTapped(int index) {
    if (index == 2) {
      // Handle logout
      Navigator.pushReplacementNamed(context, '/login');
    } else {
      setState(() {
        _selectedIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // ❌ AppBar removed

      body: Column(
        children: [
          // 🔝 Top Navigation Bar
          SafeArea(
            top: true,
            bottom: false, // prevent extra padding
            child: SizedBox(
              height: 48,
              child: ClipRect(
                child: CustomNavBar(
                  currentIndex: _selectedIndex,
                  onTap: _onItemTapped,
                ),
              ),
            ),
          ),

          // 📄 Page content
          Expanded(
            child: _pages[_selectedIndex],
          ),
        ],
      ),
    );
  }
}
