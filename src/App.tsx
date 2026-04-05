import React, { useEffect } from 'react';
import { onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useStore } from './store/useStore';
import { Dashboard } from './components/Dashboard';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const { setShipments, setEvents, setAlerts } = useStore();

  useEffect(() => {
    // 1. Auth Setup (Anonymous for Demo)
    signInAnonymously(auth).catch(err => console.error("Auth failed:", err));

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Authenticated as:", user.uid);
      }
    });

    // 2. Real-time Firestore Listeners
    const unsubscribeShipments = onSnapshot(collection(db, 'shipments'), (snapshot) => {
      const shipmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // If empty, provide mock data for demo
      if (shipmentsData.length === 0) {
        setShipments([
          {
            id: 'SG-9021',
            origin: { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
            destination: { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
            currentPos: { lat: 23.2599, lng: 77.4126 }, // Near Bhopal
            status: 'on-time',
            riskScore: 12,
            delay: 0,
            route: {}
          },
          {
            id: 'SG-4412',
            origin: { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
            destination: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' },
            currentPos: { lat: 13.0000, lng: 79.0000 },
            status: 'delayed',
            riskScore: 68,
            delay: 45,
            route: {}
          }
        ]);
      } else {
        setShipments(shipmentsData);
      }
    });

    const unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (eventsData.length === 0) {
        setEvents([
          {
            id: 'EV-1',
            type: 'flood',
            location: { lat: 19.0760, lng: 72.8777 },
            intensity: 85,
            radius: 50,
            active: true
          }
        ]);
      } else {
        setEvents(eventsData);
      }
    });

    const unsubscribeAlerts = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (alertsData.length === 0) {
        setAlerts([
          {
            id: 'AL-1',
            shipmentId: 'SG-4412',
            message: 'High flood risk detected on NH-48. Rerouting recommended.',
            severity: 'high',
            timestamp: '2 mins ago'
          }
        ]);
      } else {
        setAlerts(alertsData);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeShipments();
      unsubscribeEvents();
      unsubscribeAlerts();
    };
  }, [setShipments, setEvents, setAlerts]);

  return (
    <div className="w-full h-screen">
      <Dashboard />
    </div>
  );
}
