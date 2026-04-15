import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/providers/app_providers.dart';
import 'core/theme/sg_theme.dart';
import 'core/services/firestore_service.dart';
import '../firebase_options.dart';
import 'features/alerts/alert_panel_screen.dart';
import 'features/auth/auth_gate.dart';
import 'features/inventory/inventory_dashboard_screen.dart';
import 'features/map/command_map_screen.dart';
import 'features/mesh/mesh_console_screen.dart';
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
      theme: SupplyGuardTheme.dark(),
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
    MeshConsoleScreen(),
    SimulationConsoleScreen(),
    MetricsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final offlineSync = ref.watch(offlineSyncServiceProvider);

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    SgColors.shellTop,
                    SgColors.shellMid,
                    SgColors.shellBottom,
                  ],
                ),
              ),
              child: _screens[_index],
            ),
          ),
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
                            ? SgColors.critical
                            : offlineSync.isSyncing
                                ? SgColors.warning
                                : SgColors.success,
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
                      backgroundColor: const Color(0x22FFFFFF),
                      child: IconButton(
                        icon: const Icon(Icons.logout),
                        onPressed: () async {
                          // In offline observer mode FirebaseAuth may be unavailable on web.
                          try {
                            await FirebaseAuth.instance.signOut();
                          } catch (_) {}
                          try {
                            final prefs = await SharedPreferences.getInstance();
                            await prefs.remove('sg_offline_observer_enabled_v1');
                          } catch (_) {}
                        },
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
          NavigationDestination(icon: Icon(Icons.router_outlined), label: 'Mesh'),
          NavigationDestination(icon: Icon(Icons.science_outlined), label: 'Simulation'),
          NavigationDestination(icon: Icon(Icons.query_stats_outlined), label: 'Metrics'),
        ],
      ),
    );
  }
}
