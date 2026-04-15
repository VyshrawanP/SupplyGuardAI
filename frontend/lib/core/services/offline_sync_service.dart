import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';

class OfflineSyncService extends ChangeNotifier {
  OfflineSyncService() {
    _subscription = Connectivity().onConnectivityChanged.listen(_onConnectivityChanged);
  }

  StreamSubscription<dynamic>? _subscription;
  bool _isOffline = false;
  bool _isSyncing = false;
  double _progress = 0;
  final List<String> _meshPeers = <String>[];

  bool get isOffline => _isOffline;
  bool get isSyncing => _isSyncing;
  double get progress => _progress;
  List<String> get meshPeers => List.unmodifiable(_meshPeers);

  Future<void> initialize() async {
    // Workmanager uses `dart:io Platform` internally and does not support web.
    // Keep web usable by skipping background sync setup.
    if (kIsWeb) return;

    final supported = defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
    if (!supported) return;

    try {
      await Workmanager().initialize(_backgroundCallback, isInDebugMode: kDebugMode);
      await Workmanager().registerPeriodicTask(
        'supplyguard-background-sync',
        'backgroundSync',
        frequency: const Duration(hours: 1),
      );
    } catch (_) {
      // If background registration fails (permissions/unsupported), keep foreground sync working.
    }
  }

  Future<void> _onConnectivityChanged(dynamic results) async {
    final values = results is List<ConnectivityResult>
        ? results
        : results is ConnectivityResult
            ? <ConnectivityResult>[results]
            : <ConnectivityResult>[ConnectivityResult.none];
    final offline = values.every((result) => result == ConnectivityResult.none);
    if (offline != _isOffline) {
      _isOffline = offline;
      notifyListeners();
    }

    if (offline) {
      await precacheCriticalData();
    } else {
      await syncPendingWrites();
    }
  }

  Future<void> precacheCriticalData() async {
    _isSyncing = true;
    _progress = 0.2;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_precache_at', DateTime.now().toIso8601String());

    _progress = 1;
    _isSyncing = false;
    notifyListeners();
  }

  Future<void> syncPendingWrites() async {
    _isSyncing = true;
    _progress = 0.4;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_sync_at', DateTime.now().toIso8601String());

    _progress = 1;
    _isSyncing = false;
    notifyListeners();
  }

  Future<void> downloadOfflineTiles() async {
    _isSyncing = true;
    _progress = 0.6;
    notifyListeners();
    await Future<void>.delayed(const Duration(milliseconds: 400));
    _progress = 1;
    _isSyncing = false;
    notifyListeners();
  }

  Future<void> scanMeshPeers() async {
    _meshPeers.clear();
    final devices = FlutterBluePlus.connectedDevices;
    _meshPeers.addAll(devices.map((device) => device.platformName).where((name) => name.isNotEmpty));
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

@pragma('vm:entry-point')
void _backgroundCallback() {
  Workmanager().executeTask((task, inputData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('background_sync_last_run', DateTime.now().toIso8601String());
    return true;
  });
}
