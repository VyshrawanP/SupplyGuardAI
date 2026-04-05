import React from 'react';
import { APIProvider, Map as GoogleMap, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { useStore } from '../store/useStore';
import { Navigation, Activity, ShieldAlert } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export const Map: React.FC = () => {
  const { shipments, events, selectedShipmentId, setSelectedShipment } = useStore();
  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'MY_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="w-full h-full bg-[#1a1a1e] rounded-xl flex flex-col items-center justify-center p-8 text-center border border-white/5">
        <div className="p-4 bg-blue-500/10 rounded-full mb-4">
          <Navigation className="w-12 h-12 text-blue-500 opacity-50" />
        </div>
        <h3 className="text-xl font-bold mb-2">Map Engine: Demo Mode</h3>
        <p className="text-sm text-gray-400 max-w-md">
          Google Maps API key is not configured. The system is running in simulation mode. 
          Configure your key in the Secrets panel to enable live spatial tracking.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase">Active Shipments</p>
            <p className="text-xl font-bold">{shipments.length}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase">Disaster Zones</p>
            <p className="text-xl font-bold text-red-500">{events.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          defaultCenter={{ lat: 20.5937, lng: 78.9629 }} // Center of India
          defaultZoom={5}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId="supplyguard_map"
        >
          {/* Shipments */}
          {shipments.map((shipment) => (
            <Marker
              key={shipment.id}
              position={shipment.currentPos}
              onClick={() => setSelectedShipment(shipment.id)}
              title={shipment.id}
              // Custom icon logic based on status
              // For now, standard markers
            />
          ))}

          {/* Disaster Events */}
          {events.map((event) => (
            <Marker
              key={event.id}
              position={event.location}
              // Red circle or icon for disasters
              title={event.type}
            />
          ))}

          {selectedShipment && (
            <InfoWindow
              position={selectedShipment.currentPos}
              onCloseClick={() => setSelectedShipment(null)}
            >
              <div className="p-2 text-gray-900">
                <h3 className="font-bold text-sm">{selectedShipment.id}</h3>
                <p className="text-xs">Status: <span className="capitalize">{selectedShipment.status}</span></p>
                <p className="text-xs">Risk: {selectedShipment.riskScore}%</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </APIProvider>
    </div>
  );
};
