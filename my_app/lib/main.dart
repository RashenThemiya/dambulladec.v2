import 'package:flutter/material.dart';

import 'admin_dashboard.dart'; // ✅ Import this
import 'admin_login_screen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Admin Panel',
      theme: ThemeData.dark(),
      initialRoute: '/login',
      routes: {
        '/login': (context) => AdminLoginScreen(),
        '/dashboard': (context) => AdminDashboard(), // ✅ Ensure this exists
      },
    );
  }
}
