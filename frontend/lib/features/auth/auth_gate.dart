import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/theme/sg_theme.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: _OfflineObserverSession.enabled,
      builder: (context, offlineEnabled, _) {
        if (offlineEnabled) return child;

        Stream<User?>? authStream;
        try {
          authStream = FirebaseAuth.instance.authStateChanges();
        } catch (e) {
          return _SignInScreen(
            firebaseError: e.toString(),
            onContinueOffline: () => _OfflineObserverSession.enable(),
          );
        }

        return StreamBuilder<User?>(
          stream: authStream,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }

            if (snapshot.hasError) {
            return _SignInScreen(
              firebaseError: snapshot.error.toString(),
              onContinueOffline: () => _OfflineObserverSession.enable(),
            );
          }

            if (snapshot.data != null) {
              return child;
            }

            return _SignInScreen(
              onContinueOffline: () => _OfflineObserverSession.enable(),
            );
          },
        );
      },
    );
  }
}

class _SignInScreen extends StatefulWidget {
  const _SignInScreen({
    this.firebaseError,
    required this.onContinueOffline,
  });

  final String? firebaseError;
  final Future<void> Function() onContinueOffline;

  @override
  State<_SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<_SignInScreen> {
  bool _loading = false;
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  Future<void> _signInAnonymously() async {
    setState(() => _loading = true);
    try {
      await widget.onContinueOffline();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _signInWithEmail() async {
    setState(() => _loading = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Card(
            margin: const EdgeInsets.all(24),
            child: Padding(
              padding: const EdgeInsets.all(24),
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
                  Text('Bengaluru Command Console', style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 10),
                  Text('Command access for coordinators, operators, and responders.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: SgColors.textSecondary)),
                  if (widget.firebaseError != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.errorContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Firebase Auth unavailable on this build.\n${widget.firebaseError}',
                        style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _loading ? null : _signInWithEmail,
                    child: Text(_loading ? 'Signing in...' : 'Sign in'),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: _loading ? null : _signInAnonymously,
                    child: const Text('Continue as offline observer'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OfflineObserverSession {
  static const _key = 'sg_offline_observer_enabled_v1';
  static final ValueNotifier<bool> enabled = ValueNotifier<bool>(false);
  static bool _loaded = false;

  static Future<void> _ensureLoaded() async {
    if (_loaded) return;
    _loaded = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      enabled.value = prefs.getBool(_key) ?? false;
    } catch (_) {
      enabled.value = false;
    }
  }

  static Future<void> enable() async {
    await _ensureLoaded();
    enabled.value = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_key, true);
    } catch (_) {}
  }

  static Future<void> disable() async {
    await _ensureLoaded();
    enabled.value = false;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
    } catch (_) {}
  }
}
