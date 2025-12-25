import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AdminLoginScreen extends StatefulWidget {
  @override
  _AdminLoginScreenState createState() => _AdminLoginScreenState();
}

class _AdminLoginScreenState extends State<AdminLoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  String? _responseMessage;
  bool _isLoading = false;

  Future<void> loginAdmin() async {
    final String email = _emailController.text.trim();
    final String password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _responseMessage = 'Please fill all fields';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _responseMessage = null;
    });

    final url = Uri.parse('https://api.dambulladec.com/api/admin/login');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();

        await prefs.setString('token', data['token'] ?? '');
        await prefs.setString('role', data['role'] ?? '');
        await prefs.setString('name', data['name']?.toString() ?? '');
        await prefs.setString('email', data['email'] ?? '');

        Navigator.pushReplacementNamed(context, '/dashboard');
      } else {
        setState(() {
          _responseMessage = data['message'] ?? 'Login failed. Check credentials';
        });
      }
    } catch (e) {
      print('Login Error: $e');
      setState(() {
        _responseMessage = 'Something went wrong. Please try again.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Admin Login')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            SizedBox(height: 20),
            _isLoading
                ? CircularProgressIndicator()
                : ElevatedButton(
                    onPressed: loginAdmin,
                    child: Text('Login'),
                  ),
            if (_responseMessage != null) ...[
              SizedBox(height: 20),
              Text(_responseMessage!, style: TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
    );
  }
}
