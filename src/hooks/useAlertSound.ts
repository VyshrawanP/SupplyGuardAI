import { useEffect, useRef } from 'react';

/**
 * Plays a subtle notification tone when critical state is detected.
 * Uses Web Audio API — no external audio files needed.
 */
export function useAlertSound(criticalCount: number) {
  const prevCount = useRef(criticalCount);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (criticalCount > prevCount.current) {
      playTone();
    }
    prevCount.current = criticalCount;
  }, [criticalCount]);

  function playTone() {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15); // slide down

      gain.gain.setValueAtTime(0.08, ctx.currentTime); // very subtle
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available — silent fallback
    }
  }
}
