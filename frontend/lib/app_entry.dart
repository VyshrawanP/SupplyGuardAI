import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/services/firestore_service.dart';
import 'firebase_options.dart';

class SupplyGuardAppHost extends StatefulWidget {
  const SupplyGuardAppHost({super.key});

  @override
  State<SupplyGuardAppHost> createState() => _SupplyGuardAppHostState();
}

class _SupplyGuardAppHostState extends State<SupplyGuardAppHost> {
  late final Future<void> _init = _initialize();

  Future<void> _initialize() async {
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    } catch (_) {
      // Firebase may be misconfigured on some builds. Offline observer mode still works.
    }

    try {
      await FirestoreService.initializeOffline();
    } catch (_) {
      // Firestore persistence unsupported/misconfigured. Keep UI usable.
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _init,
      builder: (context, snapshot) {
        // Always allow the UI to render, even if initialization failed.
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const MaterialApp(
            debugShowCheckedModeBanner: false,
            home: Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
          );
        }
        return const ProviderScope(child: SupplyGuardApp());
      },
    );
  }
}
