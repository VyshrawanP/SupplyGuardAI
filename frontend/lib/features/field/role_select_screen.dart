import 'package:flutter/material.dart';

import '../../core/config/app_mode.dart';
import '../../core/theme/sg_theme.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({
    super.key,
    required this.onSelect,
  });

  final void Function(AppMode mode) onSelect;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
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
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'SUPPLYGUARD AI',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            letterSpacing: 4.2,
                            color: SgColors.cyanKicker.withOpacity(0.85),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text('Choose app mode', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 10),
                    Text(
                      'This phone app is for field use. Pick the role for this device.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: SgColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    _ModeCard(
                      title: 'Victim App',
                      subtitle: 'Send SOS, receive broadcast updates',
                      icon: Icons.sos_outlined,
                      onTap: () => onSelect(AppMode.victim),
                    ),
                    const SizedBox(height: 10),
                    _ModeCard(
                      title: 'Rescue Team App',
                      subtitle: 'Receive SOS, acknowledge and coordinate',
                      icon: Icons.health_and_safety_outlined,
                      onTap: () => onSelect(AppMode.rescueTeam),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0x22FFFFFF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: SgColors.textSecondary)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}

