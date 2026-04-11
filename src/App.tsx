import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { IntroOverlay } from './components/sections/IntroOverlay';
import { useMeshAlerts } from './store/useMeshAlerts';

const INTRO_SEEN_KEY = 'sg_intro_seen';

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
  });
  const startMesh = useMeshAlerts((state) => state.start);

  useEffect(() => {
    if (!showIntro) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
      setShowIntro(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [showIntro]);

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
