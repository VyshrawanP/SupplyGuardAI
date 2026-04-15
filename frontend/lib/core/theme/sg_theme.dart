import 'package:flutter/material.dart';

class SgColors {
  static const bg = Color(0xFF0F1215);
  static const surface = Color(0xFF1A1D21);
  static const surface2 = Color(0xFF16181C);
  static const surfaceHover = Color(0xFF22262B);
  static const border = Color(0xFF2A2E35);

  static const textPrimary = Color(0xFFF9FAFB);
  static const textSecondary = Color(0xFF9CA3AF);
  static const textTertiary = Color(0xFF6B7280);

  static const critical = Color(0xFFDC2626);
  static const warning = Color(0xFFF59E0B);
  static const success = Color(0xFF16A34A);
  static const info = Color(0xFF3B82F6);

  // Dashboard shell gradient from the web UI.
  static const shellTop = Color(0xFF040B14);
  static const shellMid = Color(0xFF071220);
  static const shellBottom = Color(0xFF0A1520);

  // Accent used for kickers/badges in the web UI.
  static const cyanKicker = Color(0xFF67E8F9);
}

class SupplyGuardTheme {
  static ThemeData dark() {
    final scheme = const ColorScheme.dark(
      primary: Color(0xFF67E8F9),
      onPrimary: Color(0xFF061018),
      secondary: Color(0xFF34D399),
      onSecondary: Color(0xFF061018),
      surface: SgColors.surface,
      onSurface: SgColors.textPrimary,
      error: SgColors.critical,
      onError: SgColors.textPrimary,
      outline: SgColors.border,
    );

    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: SgColors.bg,
      dividerColor: SgColors.border,
    );

    return base.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: SgColors.textPrimary,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: SgColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: SgColors.border),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: SgColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: SgColors.border),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: SgColors.surface,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: SgColors.surface2,
        selectedColor: const Color(0xFF0B2531),
        disabledColor: SgColors.surface2,
        side: const BorderSide(color: SgColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: const TextStyle(color: SgColors.textPrimary, fontSize: 12),
        secondaryLabelStyle: const TextStyle(color: SgColors.textPrimary, fontSize: 12),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: SgColors.bg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: SgColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: SgColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: SgColors.info),
        ),
        labelStyle: const TextStyle(color: SgColors.textSecondary),
        hintStyle: const TextStyle(color: SgColors.textTertiary),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: const Color(0xCC050B12),
        surfaceTintColor: Colors.transparent,
        indicatorColor: const Color(0x22FFFFFF),
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? SgColors.textPrimary : SgColors.textSecondary,
            size: 22,
          );
        }),
      ),
      textTheme: base.textTheme.copyWith(
        bodyMedium: base.textTheme.bodyMedium?.copyWith(color: SgColors.textPrimary),
        bodySmall: base.textTheme.bodySmall?.copyWith(color: SgColors.textSecondary),
        titleMedium: base.textTheme.titleMedium?.copyWith(color: SgColors.textPrimary, fontWeight: FontWeight.w600),
      ),
    );
  }
}
