import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:latlong2/latlong.dart';

class Shipment {
  final String id;
  final LatLng currentPos;
  final int riskScore;
  final int delay;
  final String status;

  Shipment({required this.id, required this.currentPos, required this.riskScore, required this.delay, required this.status});
}

class LogisticsService extends ChangeNotifier {
  List<Shipment> shipments = [];
  Shipment? selectedShipment;
  String? aiExplanation;

  LogisticsService() {
    _loadInitialData();
  }

  void _loadInitialData() {
    // Mock data for demo
    shipments = [
      Shipment(id: 'SG-9021', currentPos: const LatLng(23.2599, 77.4126), riskScore: 12, delay: 0, status: 'on-time'),
      Shipment(id: 'SG-4412', currentPos: const LatLng(13.0000, 79.0000), riskScore: 68, delay: 45, status: 'delayed'),
    ];
  }

  void selectShipment(Shipment shipment) {
    selectedShipment = shipment;
    notifyListeners();
  }

  Future<void> generateAIExplanation() async {
    if (selectedShipment == null) return;
    aiExplanation = "Analyzing disaster impact for ${selectedShipment!.id}...";
    notifyListeners();

    // In a real app, call Gemini API here
    await Future.delayed(const Duration(seconds: 2));
    aiExplanation = "[DEMO] High flood risk detected on NH-48. The system recommends rerouting via the Northern Corridor to avoid disruption.";
    notifyListeners();
  }

  Future<void> triggerSimulation(String type) async {
    // Call backend API
    await http.post(
      Uri.parse('/api/simulate'),
      body: jsonEncode({'eventType': type, 'intensity': 80}),
      headers: {'Content-Type': 'application/json'},
    );
    // Handle response and update state
  }
}
