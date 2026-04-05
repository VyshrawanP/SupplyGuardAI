import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/providers/app_providers.dart';
import 'core/services/firestore_service.dart';
import 'features/alerts/alert_panel_screen.dart';
import 'features/inventory/inventory_dashboard_screen.dart';
import 'features/map/command_map_screen.dart';
import 'features/metrics/metrics_screen.dart';
import 'features/simulation/simulation_console_screen.dart';
import 'features/survivor_report/survivor_report_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await FirestoreService.initializeOffline();
  runApp(const ProviderScope(child: SupplyGuardApp()));
}

class SupplyGuardApp extends ConsumerStatefulWidget {
  const SupplyGuardApp({super.key});

  @override
  ConsumerState<SupplyGuardApp> createState() => _SupplyGuardAppState();
}

class _SupplyGuardAppState extends ConsumerState<SupplyGuardApp> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() => ref.read(offlineSyncServiceProvider).initialize());
  }

  @override
  Widget build(BuildContext context) {

    return MaterialApp(
      title: 'SupplyGuard AI',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF005F73)),
        useMaterial3: true,
      ),
      routes: {
        '/report': (_) => const SurvivorReportScreen(),
      },
      home: const AppShell(),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _screens = [
    CommandMapScreen(),
    AlertPanelScreen(),
    InventoryDashboardScreen(),
    SimulationConsoleScreen(),
    MetricsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.map_outlined), label: 'Map'),
          NavigationDestination(icon: Icon(Icons.warning_amber_outlined), label: 'Alerts'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), label: 'Inventory'),
          NavigationDestination(icon: Icon(Icons.science_outlined), label: 'Simulation'),
          NavigationDestination(icon: Icon(Icons.query_stats_outlined), label: 'Metrics'),
        ],
      ),
    );
  }
}
