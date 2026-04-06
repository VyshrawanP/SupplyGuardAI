import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { IntroOverlay } from './components/sections/IntroOverlay';
import { useMeshAlerts } from './store/useMeshAlerts';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const startMesh = useMeshAlerts((state) => state.start);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void startMesh();
  }, [startMesh]);

  return (
    <div className="min-h-screen bg-[#08111f] text-white">
      <Dashboard />
      <IntroOverlay visible={showIntro} />
    </div>
  );
}
