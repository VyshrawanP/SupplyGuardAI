import type { SimulationSettings } from './useStore';

export const INDIA_SCENARIO_CUSTOM_ID = 'custom';

export type IndiaScenarioPresetId =
  | typeof INDIA_SCENARIO_CUSTOM_ID
  | 'kerala-floods-2018'
  | 'odisha-cyclone-1999'
  | 'gujarat-earthquake-2001'
  | 'uttarakhand-floods-2013'
  | 'north-india-heatwave';

export interface IndiaScenarioPreset {
  id: Exclude<IndiaScenarioPresetId, typeof INDIA_SCENARIO_CUSTOM_ID>;
  title: string;
  inspiredBy: string;
  judgeNote: string;
  patch: Pick<
    SimulationSettings,
    'localityFocus' | 'disasterMode' | 'waterLevel' | 'earthquakeLevel' | 'stormLevel' | 'heatLevel' | 'medicineBuffer'
  >;
}

// These are intentionally "inspired by" historic events (not a reconstruction).
// They exist to give judges a consistent, repeatable stress test for the demo.
export const indiaScenarioPresets: IndiaScenarioPreset[] = [
  {
    id: 'kerala-floods-2018',
    title: 'Kerala floods (2018) — flood logistics',
    inspiredBy: 'Severe flooding and access loss across Kerala (2018 monsoon).',
    judgeNote: 'Tests water depth + corridor accessibility; watch ETA and autonomy.',
    patch: {
      localityFocus: 'electronic-city',
      disasterMode: 'flood',
      waterLevel: 86,
      earthquakeLevel: 12,
      stormLevel: 62,
      heatLevel: 24,
      medicineBuffer: 68,
    },
  },
  {
    id: 'odisha-cyclone-1999',
    title: 'Odisha Super Cyclone (1999) — storm + flood',
    inspiredBy: 'Category-5 cyclone impact and coastal disruption in Odisha (1999).',
    judgeNote: 'Tests storm disruption, route warnings, and supply continuity.',
    patch: {
      localityFocus: 'whitefield',
      disasterMode: 'storm',
      waterLevel: 70,
      earthquakeLevel: 10,
      stormLevel: 92,
      heatLevel: 28,
      medicineBuffer: 72,
    },
  },
  {
    id: 'gujarat-earthquake-2001',
    title: 'Gujarat earthquake (2001) — hospital surge',
    inspiredBy: 'Major earthquake shock and structural damage (2001).',
    judgeNote: 'Tests trauma routing and hospital stock balancing under quake stress.',
    patch: {
      localityFocus: 'mg-road',
      disasterMode: 'earthquake',
      waterLevel: 18,
      earthquakeLevel: 90,
      stormLevel: 22,
      heatLevel: 30,
      medicineBuffer: 76,
    },
  },
  {
    id: 'uttarakhand-floods-2013',
    title: 'Uttarakhand floods (2013) — compound access loss',
    inspiredBy: 'Flash floods/landslides and difficult last-mile access (2013).',
    judgeNote: 'Tests multi-service dispatch (drone + rescue) under high route risk.',
    patch: {
      localityFocus: 'rajarajeshwari',
      disasterMode: 'compound',
      waterLevel: 80,
      earthquakeLevel: 28,
      stormLevel: 74,
      heatLevel: 24,
      medicineBuffer: 66,
    },
  },
  {
    id: 'north-india-heatwave',
    title: 'North India heatwave — heat + health load',
    inspiredBy: 'Heat stress and health-system pressure during extreme heat.',
    judgeNote: 'Tests hospital overload + medicine coverage; watch autonomy stability.',
    patch: {
      localityFocus: 'hebbal',
      disasterMode: 'heatwave',
      waterLevel: 22,
      earthquakeLevel: 14,
      stormLevel: 26,
      heatLevel: 92,
      medicineBuffer: 74,
    },
  },
];

export function getIndiaScenarioPreset(id: string): IndiaScenarioPreset | null {
  return indiaScenarioPresets.find((preset) => preset.id === id) ?? null;
}

export function getIndiaScenarioPresetLabel(id: string): string | null {
  if (!id || id === INDIA_SCENARIO_CUSTOM_ID) return null;
  return getIndiaScenarioPreset(id)?.title ?? null;
}

