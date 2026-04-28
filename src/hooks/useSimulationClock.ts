import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

export type SimSpeed = 1 | 2 | 5;
export type SimPhase = 'Calm' | 'Escalation' | 'Peak' | 'Recovery';

const TICK_INTERVAL_MS = 2000; // base tick = 2 seconds real time

function formatSimTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `T+${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getPhase(elapsedMinutes: number): SimPhase {
  if (elapsedMinutes < 5) return 'Calm';
  if (elapsedMinutes < 20) return 'Escalation';
  if (elapsedMinutes < 40) return 'Peak';
  return 'Recovery';
}

export interface SimClockEvent {
  id: string;
  time: string;
  wallClock: string;
  emoji: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Live simulation clock that auto-ticks and evolves state.
 * Each tick applies small perturbations to the simulation,
 * making the dashboard feel alive without manual intervention.
 */
export function useSimulationClock() {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<SimSpeed>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [events, setEvents] = useState<SimClockEvent[]>([]);
  const tickCountRef = useRef(0);
  const updateSimulation = useStore((s) => s.updateSimulation);
  const settings = useStore((s) => s.settings);

  const wallClock = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const addEvent = useCallback((emoji: string, message: string, severity: SimClockEvent['severity'] = 'info') => {
    setEvents(prev => {
      const next = [
        ...prev,
        {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: formatSimTime(tickCountRef.current * 2),
          wallClock: wallClock(),
          emoji,
          message,
          severity,
        },
      ];
      // Keep last 50 events
      return next.slice(-50);
    });
  }, []);

  const tick = useCallback(() => {
    tickCountRef.current += 1;
    const count = tickCountRef.current;
    const elapsedMin = Math.floor((count * 2) / 60);
    const phase = getPhase(elapsedMin);

    setElapsedSeconds(count * 2);

    // Apply small random perturbations based on phase
    const drift = (base: number, range: number) =>
      Math.max(0, Math.min(100, base + (Math.random() - 0.45) * range));

    let waterDelta = 0;
    let quakeDelta = 0;
    let stormDelta = 0;

    if (phase === 'Escalation') {
      waterDelta = (Math.random() - 0.3) * 3; // tends to rise
      quakeDelta = (Math.random() - 0.4) * 2;
      stormDelta = (Math.random() - 0.3) * 2.5;
    } else if (phase === 'Peak') {
      waterDelta = (Math.random() - 0.35) * 4;
      quakeDelta = (Math.random() - 0.35) * 3;
      stormDelta = (Math.random() - 0.35) * 3;
    } else if (phase === 'Recovery') {
      waterDelta = (Math.random() - 0.7) * 3; // tends to fall
      quakeDelta = (Math.random() - 0.6) * 2;
      stormDelta = (Math.random() - 0.7) * 2;
    } else {
      waterDelta = (Math.random() - 0.5) * 1;
      quakeDelta = (Math.random() - 0.5) * 0.5;
      stormDelta = (Math.random() - 0.5) * 0.8;
    }

    const newWater = Math.max(0, Math.min(100, settings.waterLevel + waterDelta));
    const newQuake = Math.max(0, Math.min(100, settings.earthquakeLevel + quakeDelta));
    const newStorm = Math.max(0, Math.min(100, settings.stormLevel + stormDelta));

    updateSimulation({
      waterLevel: Math.round(newWater * 10) / 10,
      earthquakeLevel: Math.round(newQuake * 10) / 10,
      stormLevel: Math.round(newStorm * 10) / 10,
    });

    // Generate contextual events every few ticks
    if (count % 3 === 0) {
      const localities = ['Indiranagar', 'Whitefield', 'Koramangala', 'KR Puram', 'Hebbal', 'Electronic City', 'Bellandur', 'Majestic', 'Sarjapur', 'Malleshwaram'];
      const hospitals = ['Manipal Hospital', 'St. John\'s Medical', 'Apollo Bannerghatta', 'Aster CMI', 'Vydehi Hospital', 'Bowring Hospital'];
      const loc = localities[Math.floor(Math.random() * localities.length)];
      const hosp = hospitals[Math.floor(Math.random() * hospitals.length)];

      const eventPool: Array<[string, string, SimClockEvent['severity']]> = [
        ['🚑', `Ambulance dispatched to ${loc} via alternate corridor`, 'info'],
        ['🏥', `${hosp} occupancy updated — ${60 + Math.floor(Math.random() * 35)}% capacity`, newWater > 60 ? 'warning' : 'info'],
        ['🛩️', `Drone medicine drop en route to ${loc}`, 'info'],
        ['📦', `Food convoy reached staging point near ${loc}`, 'info'],
        ['⚡', `Power backup status checked at ${hosp}`, 'info'],
        ['🔄', `Route optimizer recalculated — ${1 + Math.floor(Math.random() * 3)} corridors rerouted`, 'warning'],
        ['🛰️', `Satellite imagery confirms road collapse near ${loc}`, 'critical'],
        ['📡', `Mesh network nodes reporting high density in ${loc}`, 'info'],
        ['🚒', `Rescue teams coordinating structural sweep in ${loc}`, 'warning'],
        ['🩺', `Triage backlog at ${hosp} exceeds 15 minutes`, 'warning'],
      ];

      if (newWater > 70) {
        eventPool.push(['⚠️', `Flood depth critical near ${loc} — ${(newWater * 0.12).toFixed(1)}cm`, 'critical']);
      }
      if (newQuake > 65) {
        eventPool.push(['🔴', `Structural damage reported in ${loc} zone`, 'critical']);
      }
      if (settings.stormLevel > 75) {
        eventPool.push(['🚫', `Drone grounding order active due to ${settings.stormLevel} knots wind in ${loc}`, 'critical']);
      }

      const [emoji, msg, sev] = eventPool[Math.floor(Math.random() * eventPool.length)];
      addEvent(emoji, msg, sev);
    }

    // Phase transition events
    if (count === Math.ceil(5 * 60 / 2)) {
      addEvent('📈', 'Disaster phase transition: CALM → ESCALATION', 'warning');
    }
    if (count === Math.ceil(20 * 60 / 2)) {
      addEvent('🔴', 'Disaster phase transition: ESCALATION → PEAK', 'critical');
    }
    if (count === Math.ceil(40 * 60 / 2)) {
      addEvent('📉', 'Disaster phase transition: PEAK → RECOVERY', 'info');
    }
  }, [settings, updateSimulation, addEvent]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(tick, TICK_INTERVAL_MS / speed);
    return () => clearInterval(interval);
  }, [running, speed, tick]);

  const toggleRunning = useCallback(() => setRunning(r => !r), []);
  const cycleSpeed = useCallback(() => {
    setSpeed(s => (s === 1 ? 2 : s === 2 ? 5 : 1));
  }, []);
  const reset = useCallback(() => {
    setRunning(false);
    setElapsedSeconds(0);
    tickCountRef.current = 0;
    setEvents([]);
  }, []);

  return {
    running,
    speed,
    elapsedSeconds,
    simTime: formatSimTime(elapsedSeconds),
    phase: getPhase(Math.floor(elapsedSeconds / 60)),
    events,
    toggleRunning,
    cycleSpeed,
    reset,
  };
}
