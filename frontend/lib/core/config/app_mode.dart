import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppMode {
  commandCenter,
  victim,
  rescueTeam,
}

class AppModeConfig {
  static const _prefsKey = 'sg_app_mode_v1';

  /// Compile-time override:
  /// `--dart-define=APP_MODE=command|victim|rescue`
  static const String _compileTime = String.fromEnvironment('APP_MODE', defaultValue: 'auto');

  static AppMode? _parse(String raw) {
    final v = raw.trim().toLowerCase();
    if (v == 'command' || v == 'commandcenter' || v == 'command_center') return AppMode.commandCenter;
    if (v == 'victim') return AppMode.victim;
    if (v == 'rescue' || v == 'rescueteam' || v == 'rescue_team') return AppMode.rescueTeam;
    return null;
  }

  /// Resolve app mode. Returns `null` if the user must choose a mode (mobile first run).
  static Future<AppMode?> resolve() async {
    if (_compileTime != 'auto') {
      return _parse(_compileTime) ?? AppMode.commandCenter;
    }

    // Web is always the command center UI.
    if (kIsWeb) return AppMode.commandCenter;

    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_prefsKey);
    if (stored == null || stored.trim().isEmpty) return null;
    return _parse(stored) ?? AppMode.victim;
  }

  static Future<void> persist(AppMode mode) async {
    final prefs = await SharedPreferences.getInstance();
    final value = switch (mode) {
      AppMode.commandCenter => 'command',
      AppMode.victim => 'victim',
      AppMode.rescueTeam => 'rescue',
    };
    await prefs.setString(_prefsKey, value);
  }
}

