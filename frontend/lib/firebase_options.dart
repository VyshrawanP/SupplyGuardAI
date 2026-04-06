import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class DefaultFirebaseOptions {
  static const String _apiKey = String.fromEnvironment('FIREBASE_API_KEY', defaultValue: 'FIREBASE_API_KEY');
  static const String _authDomain = String.fromEnvironment('FIREBASE_AUTH_DOMAIN', defaultValue: 'FIREBASE_AUTH_DOMAIN');
  static const String _projectId = String.fromEnvironment('FIREBASE_PROJECT_ID', defaultValue: 'FIREBASE_PROJECT_ID');
  static const String _storageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET', defaultValue: 'FIREBASE_STORAGE_BUCKET');
  static const String _messagingSenderId = String.fromEnvironment(
    'FIREBASE_MESSAGING_SENDER_ID',
    defaultValue: 'FIREBASE_MESSAGING_SENDER_ID',
  );
  static const String _appId = String.fromEnvironment('FIREBASE_APP_ID', defaultValue: 'FIREBASE_APP_ID');

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return ios;
      default:
        return android;
    }
  }

  static final FirebaseOptions android = FirebaseOptions(
    apiKey: _apiKey,
    appId: _appId,
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    storageBucket: _storageBucket,
  );

  static final FirebaseOptions ios = FirebaseOptions(
    apiKey: _apiKey,
    appId: _appId,
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    storageBucket: _storageBucket,
    iosBundleId: 'ai.supplyguard.app',
  );

  static final FirebaseOptions web = FirebaseOptions(
    apiKey: _apiKey,
    appId: _appId,
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    authDomain: _authDomain,
    storageBucket: _storageBucket,
  );
}
