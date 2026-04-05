import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class DefaultFirebaseOptions {
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

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'FIREBASE_API_KEY',
    appId: 'FIREBASE_APP_ID',
    messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
    projectId: 'FIREBASE_PROJECT_ID',
    storageBucket: 'FIREBASE_STORAGE_BUCKET',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'FIREBASE_API_KEY',
    appId: 'FIREBASE_APP_ID',
    messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
    projectId: 'FIREBASE_PROJECT_ID',
    storageBucket: 'FIREBASE_STORAGE_BUCKET',
    iosBundleId: 'ai.supplyguard.app',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'FIREBASE_API_KEY',
    appId: 'FIREBASE_APP_ID',
    messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
    projectId: 'FIREBASE_PROJECT_ID',
    authDomain: 'FIREBASE_AUTH_DOMAIN',
    storageBucket: 'FIREBASE_STORAGE_BUCKET',
  );
}
