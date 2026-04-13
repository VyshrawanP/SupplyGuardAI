import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface HospitalCapacity {
  beds_total: number;
  beds_available: number;
  icu_total: number;
  icu_available: number;
  updated_at?: Date | null;
}

type CapacityMap = Record<string, HospitalCapacity | null | undefined>;

const toNumber = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

export function useHospitalCapacities(hospitalIds: string[]) {
  const stableIds = useMemo(() => Array.from(new Set(hospitalIds)).sort(), [hospitalIds.join('|')]);
  const [capacities, setCapacities] = useState<CapacityMap>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stableIds.length === 0) {
      setCapacities({});
      return;
    }

    if (!db || import.meta.env.VITE_OFFLINE_MODE === 'true') {
      setError(null);
      setCapacities(
        Object.fromEntries(
          stableIds.map((hospitalId, index) => [
            hospitalId,
            {
              beds_total: 300 + index * 40,
              beds_available: 40 + (index % 3) * 12,
              icu_total: 40 + (index % 4) * 6,
              icu_available: 6 + (index % 3) * 3,
              updated_at: null,
            } satisfies HospitalCapacity,
          ]),
        ),
      );
      return;
    }

    setError(null);
    setCapacities((current) => {
      const next: CapacityMap = { ...current };
      for (const id of stableIds) {
        if (!(id in next)) next[id] = undefined;
      }
      return next;
    });

    const unsubscribes = stableIds.map((hospitalId) => {
      const ref = doc(db, 'hospitals', hospitalId, 'capacity', 'current');
      return onSnapshot(
        ref,
        (snapshot) => {
          const data = snapshot.data();
          if (!data) {
            setCapacities((current) => ({ ...current, [hospitalId]: null }));
            return;
          }

          const updatedAtRaw = data.updated_at;
          const updatedAt =
            updatedAtRaw && typeof updatedAtRaw === 'object' && typeof (updatedAtRaw as { toDate?: () => Date }).toDate === 'function'
              ? (updatedAtRaw as { toDate: () => Date }).toDate()
              : null;

          setCapacities((current) => ({
            ...current,
            [hospitalId]: {
              beds_total: toNumber(data.beds_total),
              beds_available: toNumber(data.beds_available),
              icu_total: toNumber(data.icu_total),
              icu_available: toNumber(data.icu_available),
              updated_at: updatedAt,
            },
          }));
        },
        (snapshotError) => {
          setError(snapshotError?.message ?? 'Failed to read hospital capacity');
          setCapacities((current) => ({ ...current, [hospitalId]: undefined }));
        },
      );
    });

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [stableIds.join('|')]);

  return { capacities, error };
}
