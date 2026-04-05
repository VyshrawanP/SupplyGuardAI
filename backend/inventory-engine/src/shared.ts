import admin from 'firebase-admin';

export interface InventoryMetrics {
  item_name: string;
  current_quantity: number;
  unit: string;
  minimum_threshold: number;
  days_remaining: number;
  depletion_rate_per_day: number;
  status: 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'DEPLETED';
  last_restocked_at: string;
}

export interface PurchaseOrder {
  po_id: string;
  warehouse_id: string;
  supplier_id: string;
  items: { item_name: string; quantity: number; unit: string; urgency: 'STANDARD' | 'URGENT' | 'EMERGENCY' }[];
  delivery_address: string;
  created_at: string;
  required_by: string;
  estimated_cost_inr: number;
}

export function getFirestore(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return admin.firestore();
}
