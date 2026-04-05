import { create } from 'zustand';

interface Shipment {
  id: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  currentPos: { lat: number; lng: number };
  status: 'on-time' | 'delayed' | 'rerouted' | 'blocked';
  riskScore: number;
  delay: number;
  route: any;
  explanation?: string;
}

interface Event {
  id: string;
  type: string;
  location: { lat: number; lng: number };
  intensity: number;
  radius: number;
  active: boolean;
}

interface Alert {
  id: string;
  shipmentId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface SupplyGuardState {
  shipments: Shipment[];
  events: Event[];
  alerts: Alert[];
  selectedShipmentId: string | null;
  isSimulating: boolean;
  setShipments: (shipments: Shipment[]) => void;
  setEvents: (events: Event[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setSelectedShipment: (id: string | null) => void;
  setIsSimulating: (is: boolean) => void;
}

export const useStore = create<SupplyGuardState>((set) => ({
  shipments: [],
  events: [],
  alerts: [],
  selectedShipmentId: null,
  isSimulating: false,
  setShipments: (shipments) => set({ shipments }),
  setEvents: (events) => set({ events }),
  setAlerts: (alerts) => set({ alerts }),
  setSelectedShipment: (id) => set({ selectedShipmentId: id }),
  setIsSimulating: (is) => set({ isSimulating: is }),
}));
