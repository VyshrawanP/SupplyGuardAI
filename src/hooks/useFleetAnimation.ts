import { useEffect, useRef, useState } from 'react';

type LatLng = { lat: number; lng: number };

/**
 * Animate fleet positions along their route paths.
 * Returns a map of fleet unit IDs → animated lat/lng positions.
 * Positions smoothly interpolate along the route at a speed
 * proportional to the simulation clock.
 */
export function useFleetAnimation(
  running: boolean,
  speed: number,
  routeMap: Record<string, LatLng[]>,
  fleetRouteAssignments: Array<{ unitId: string; routeKey: string }>,
): Record<string, LatLng> {
  const [positions, setPositions] = useState<Record<string, LatLng>>({});
  const progressRef = useRef<Record<string, number>>({});
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const SPEED_FACTOR = 0.00004 * speed; // how fast vehicles move per ms

    const animate = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const nextPositions: Record<string, LatLng> = {};
      let anyChanged = false;

      for (const { unitId, routeKey } of fleetRouteAssignments) {
        const route = routeMap[routeKey];
        if (!route || route.length < 2) continue;

        // Advance progress
        const prevProgress = progressRef.current[unitId] ?? Math.random() * 0.3; // stagger starts
        let nextProgress = prevProgress + dt * SPEED_FACTOR;

        // Ping-pong: reverse when reaching end
        if (nextProgress > 1) nextProgress = nextProgress % 1;

        progressRef.current[unitId] = nextProgress;

        // Interpolate position along route
        const pos = positionAlongRoute(route, nextProgress);
        nextPositions[unitId] = pos;
        anyChanged = true;
      }

      if (anyChanged) {
        setPositions(prev => ({ ...prev, ...nextPositions }));
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, speed, routeMap, fleetRouteAssignments]);

  return positions;
}

function positionAlongRoute(points: LatLng[], progress: number): LatLng {
  if (points.length === 0) return { lat: 12.9716, lng: 77.5946 };
  if (points.length === 1) return points[0];

  const bounded = Math.max(0, Math.min(1, progress));
  const totalLen = routeLength(points);
  if (totalLen === 0) return points[0];

  const targetLen = totalLen * bounded;
  let traversed = 0;

  for (let i = 1; i < points.length; i++) {
    const segLen = dist(points[i - 1], points[i]);
    if (traversed + segLen >= targetLen) {
      const t = segLen === 0 ? 0 : (targetLen - traversed) / segLen;
      return {
        lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * t,
        lng: points[i - 1].lng + (points[i].lng - points[i - 1].lng) * t,
      };
    }
    traversed += segLen;
  }

  return points[points.length - 1];
}

function dist(a: LatLng, b: LatLng) {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}

function routeLength(points: LatLng[]) {
  return points.slice(1).reduce((sum, p, i) => sum + dist(points[i], p), 0);
}
