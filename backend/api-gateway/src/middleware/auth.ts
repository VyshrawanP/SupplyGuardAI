import admin from 'firebase-admin';
import { LRUCache } from 'lru-cache';
import type { NextFunction, Request, Response } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    role: string;
    token: admin.auth.DecodedIdToken;
  };
}

const roleCache = new LRUCache<string, string>({
  max: 1000,
  ttl: 5 * 60 * 1000,
});

function initializeFirebase(): admin.app.App {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.app();
}

/**
 * Retrieves the cached role for a Firebase user, refreshing from Firestore when needed.
 */
export async function getUserRole(uid: string): Promise<string> {
  const cachedRole = roleCache.get(uid);
  if (cachedRole) {
    return cachedRole;
  }

  initializeFirebase();
  const snapshot = await admin.firestore().collection('users').doc(uid).get();
  const role = snapshot.exists ? String(snapshot.get('role') || 'observer') : 'observer';
  roleCache.set(uid, role);
  return role;
}

/**
 * Verifies the Firebase ID token for incoming API requests.
 */
export async function verifyFirebaseToken(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorizationHeader = request.header('Authorization');
    if (!authorizationHeader?.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Missing Bearer token.' });
      return;
    }

    initializeFirebase();
    const token = authorizationHeader.replace('Bearer ', '').trim();
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    const role = await getUserRole(decodedToken.uid);

    request.user = {
      uid: decodedToken.uid,
      role,
      token: decodedToken,
    };

    next();
  } catch (error) {
    response.status(401).json({
      error: 'Invalid Firebase ID token.',
      details: error instanceof Error ? error.message : 'unknown_error',
    });
  }
}
