export type MeshAlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type MeshLatLng = { lat: number; lng: number };

export type MeshAlert = {
  id: string;
  message: string;
  location: MeshLatLng;
  timestamp: string; // ISO8601
  severity: MeshAlertSeverity;
  ttl: number; // hop-based TTL, decremented per relay
  hops: number; // number of relays applied so far
  originPeerId: string;
};

export type MeshAlertEnvelope = {
  kind: 'mesh_alert';
  alert: MeshAlert;
};

export type MeshPing = { kind: 'ping'; t: number };
export type MeshPong = { kind: 'pong'; t: number };

export type MeshWireMessage = MeshAlertEnvelope | MeshPing | MeshPong;

export const isMeshWireMessage = (value: unknown): value is MeshWireMessage => {
  if (value == null || typeof value !== 'object') return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === 'mesh_alert' || kind === 'ping' || kind === 'pong';
};

