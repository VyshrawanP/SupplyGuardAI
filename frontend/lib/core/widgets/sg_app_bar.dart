import 'package:flutter/material.dart';

import '../theme/sg_theme.dart';

class SgAppBar extends StatelessWidget implements PreferredSizeWidget {
  const SgAppBar({
    super.key,
    required this.title,
    this.kicker = 'SupplyGuard AI',
    this.actions,
    this.bottom,
  });

  final String title;
  final String kicker;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;

  @override
  Size get preferredSize => Size.fromHeight(bottom == null ? kToolbarHeight + 6 : kToolbarHeight + 52);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      actions: actions,
      bottom: bottom,
      titleSpacing: 16,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            kicker.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 11,
              letterSpacing: 3.6,
              color: Color(0xCC67E8F9),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: SgColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

