import admin from 'firebase-admin';
import type { GeoPoint, SurvivorCluster } from './types';

function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}

type ReportRecord = {
  id: string;
  coordinates: GeoPoint;
  severity: number;
  count: number;
  timestamp: Date;
};

function cellKey(point: GeoPoint, minLat: number, minLng: number): string {
  const cellX = Math.floor((point.lng - minLng) / 0.005);
  const cellY = Math.floor((point.lat - minLat) / 0.0045);
  return `${cellX}:${cellY}`;
}

function parseCell(key: string): { x: number; y: number } {
  const [x, y] = key.split(':').map(Number);
  return { x, y };
}

function adjacent(left: string, right: string): boolean {
  const a = parseCell(left);
  const b = parseCell(right);
  return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
}

/**
 * Runs deterministic grid clustering over recent unprocessed survivor reports.
 */
export async function detectSurvivorClusters(): Promise<SurvivorCluster[]> {
  const firestore = getFirestore();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const snapshot = await firestore
    .collection('survivor-reports')
    .where('cluster_id', '==', null)
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(cutoff))
    .get();

  const reports: ReportRecord[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    coordinates: doc.get('coordinates') as GeoPoint,
    severity: Number(doc.get('severity') || 1),
    count: Number(doc.get('count') || 1),
    timestamp: (doc.get('timestamp') as admin.firestore.Timestamp | undefined)?.toDate() || new Date(),
  }));

  if (reports.length === 0) {
    return [];
  }

  const minLat = Math.min(...reports.map((report) => report.coordinates.lat));
  const minLng = Math.min(...reports.map((report) => report.coordinates.lng));

  const grouped = new Map<string, ReportRecord[]>();
  for (const report of reports) {
    const key = cellKey(report.coordinates, minLat, minLng);
    grouped.set(key, [...(grouped.get(key) || []), report]);
  }

  const visited = new Set<string>();
  const clusters: SurvivorCluster[] = [];

  for (const [key] of grouped.entries()) {
    if (visited.has(key)) {
      continue;
    }

    const queue = [key];
    const mergedReports: ReportRecord[] = [];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift() as string;
      const currentReports = grouped.get(current) || [];
      mergedReports.push(...currentReports);

      for (const neighbor of grouped.keys()) {
        if (!visited.has(neighbor) && adjacent(current, neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    const center = {
      lat: mergedReports.reduce((sum, report) => sum + report.coordinates.lat, 0) / mergedReports.length,
      lng: mergedReports.reduce((sum, report) => sum + report.coordinates.lng, 0) / mergedReports.length,
    };
    const clusterId = firestore.collection('survivor-clusters').doc().id;

    const cluster: SurvivorCluster = {
      cluster_id: clusterId,
      center,
      estimated_population: mergedReports.reduce((sum, report) => sum + report.count, 0),
      severity: Math.min(5, Math.max(...mergedReports.map((report) => report.severity))) as SurvivorCluster['severity'],
      report_count: mergedReports.length,
      created_at: new Date().toISOString(),
      status: 'UNASSIGNED',
    };

    const clusterRef = firestore.collection('survivor-clusters').doc(clusterId);
    await clusterRef.set({
      ...cluster,
      earliest_report_timestamp: admin.firestore.Timestamp.fromDate(
        new Date(Math.min(...mergedReports.map((report) => report.timestamp.getTime()))),
      ),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    await Promise.all(mergedReports.map((report) =>
      firestore.collection('survivor-reports').doc(report.id).set({
        cluster_id: clusterId,
        processed_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }),
    ));

    clusters.push(cluster);
  }

  return clusters;
}
