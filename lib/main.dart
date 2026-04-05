import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:supply_guard_ai/services/logistics_service.dart';
import 'package:supply_guard_ai/screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // In a real app, initialize Firebase here
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LogisticsService()),
      ],
      child: const SupplyGuardApp(),
    ),
  );
}

class SupplyGuardApp extends StatelessWidget {
  const SupplyGuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SupplyGuard AI',
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: const Color(0xFF0A0A0C),
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}
