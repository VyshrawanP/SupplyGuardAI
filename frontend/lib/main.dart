import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/providers/app_providers.dart';
import 'core/services/firestore_service.dart';
import '../firebase_options.dart';
import 'features/alerts/alert_panel_screen.dart';
import 'features/auth/auth_gate.dart';
import 'features/inventory/inventory_dashboard_screen.dart';
import 'features/map/command_map_screen.dart';
import 'features/metrics/metrics_screen.dart';
import 'features/simulation/simulation_console_screen.dart';
import 'features/survivor_report/survivor_report_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
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
      home: const AuthGate(child: AppShell()),
    );
  }
}

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
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
    final offlineSync = ref.watch(offlineSyncServiceProvider);

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(child: _screens[_index]),
          Positioned(
            top: 16,
            right: 16,
            child: SafeArea(
              child: Material(
                color: Colors.transparent,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DecoratedBox(
                      decoration: BoxDecoration(
                        color: offlineSync.isOffline
                            ? Colors.red.shade700
                            : offlineSync.isSyncing
                                ? Colors.amber.shade700
                                : Colors.green.shade700,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        child: Text(
                          offlineSync.isOffline
                              ? 'Offline'
                              : offlineSync.isSyncing
                                  ? 'Syncing ${(offlineSync.progress * 100).round()}%'
                                  : 'Online',
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    CircleAvatar(
                      child: IconButton(
                        icon: const Icon(Icons.logout),
                        onPressed: () => FirebaseAuth.instance.signOut(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
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
