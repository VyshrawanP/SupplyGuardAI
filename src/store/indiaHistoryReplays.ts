export type HistoryMarkerType = 'impact' | 'hub' | 'hospital' | 'shelter';

export interface HistoryMarker {
  id: string;
  label: string;
  type: HistoryMarkerType;
  lat: number;
  lng: number;
}

export interface HistoryPhase {
  id: string;
  minute: string;
  title: string;
  note: string;
  severity: number; // 0..100
  aiConfidence: number; // 0..100
  autonomyScore: number; // 0..100
  avgEtaMinutes: number;
  criticalMissions: number;
  blockedRoutes: number;
  medicineCoverage: number; // 0..100
  foodCoverage: number; // 0..100
}

export interface IndiaHistoryReplayScenario {
  id: string;
  title: string;
  year: number;
  inspiredBy: string;
  judgeGoal: string;
  map: { center: { lat: number; lng: number }; zoom: number; radiusKm: number };
  markers: HistoryMarker[];
  phases: HistoryPhase[];
}

export const indiaHistoryReplayScenarios: IndiaHistoryReplayScenario[] = [
  {
    id: 'kerala-floods-2018',
    title: 'Kerala floods — access + logistics',
    year: 2018,
    inspiredBy: 'Severe monsoon flooding and access loss across Kerala.',
    judgeGoal: 'Check if ETA stays controlled and stock coverage improves as the system adapts.',
    map: { center: { lat: 10.1632, lng: 76.6413 }, zoom: 7, radiusKm: 120 },
    markers: [
      { id: 'impact-kochi', label: 'Kochi', type: 'impact', lat: 9.9312, lng: 76.2673 },
      { id: 'impact-aluva', label: 'Aluva', type: 'impact', lat: 10.1076, lng: 76.3516 },
      { id: 'hub-tvm', label: 'Thiruvananthapuram Hub', type: 'hub', lat: 8.5241, lng: 76.9366 },
      { id: 'hub-coimbatore', label: 'Coimbatore Hub', type: 'hub', lat: 11.0168, lng: 76.9558 },
    ],
    phases: [
      {
        id: 'p0',
        minute: 'T+00',
        title: 'Initial shock + road uncertainty',
        note: 'Flood depth rises; first dispatch uses partial route truth.',
        severity: 78,
        aiConfidence: 72,
        autonomyScore: 62,
        avgEtaMinutes: 54,
        criticalMissions: 9,
        blockedRoutes: 4,
        medicineCoverage: 58,
        foodCoverage: 60,
      },
      {
        id: 'p1',
        minute: 'T+08',
        title: 'Drone + rescue bias',
        note: 'Switches to airlift + rescue extraction as access collapses.',
        severity: 84,
        aiConfidence: 76,
        autonomyScore: 69,
        avgEtaMinutes: 44,
        criticalMissions: 11,
        blockedRoutes: 6,
        medicineCoverage: 64,
        foodCoverage: 66,
      },
      {
        id: 'p2',
        minute: 'T+18',
        title: 'Stock balancing + stable lanes',
        note: 'Orders stabilize; fewer corridors reopen; ETA improves.',
        severity: 70,
        aiConfidence: 82,
        autonomyScore: 78,
        avgEtaMinutes: 33,
        criticalMissions: 7,
        blockedRoutes: 3,
        medicineCoverage: 74,
        foodCoverage: 72,
      },
    ],
  },
  {
    id: 'odisha-cyclone-1999',
    title: 'Odisha Super Cyclone — storm + flood',
    year: 1999,
    inspiredBy: 'Extreme cyclone disruption and storm surge conditions in coastal Odisha.',
    judgeGoal: 'Check how the system prioritizes evacuation + supply when routes degrade.',
    map: { center: { lat: 20.2031, lng: 86.3377 }, zoom: 7, radiusKm: 160 },
    markers: [
      { id: 'impact-puri', label: 'Puri', type: 'impact', lat: 19.8135, lng: 85.8312 },
      { id: 'impact-cuttack', label: 'Cuttack', type: 'impact', lat: 20.4625, lng: 85.8830 },
      { id: 'hub-bbsr', label: 'Bhubaneswar Hub', type: 'hub', lat: 20.2961, lng: 85.8245 },
      { id: 'hub-vizag', label: 'Visakhapatnam Hub', type: 'hub', lat: 17.6868, lng: 83.2185 },
    ],
    phases: [
      {
        id: 'p0',
        minute: 'T+00',
        title: 'Cyclone landfall',
        note: 'High storm disruption; mass warnings; evacuation priorities spike.',
        severity: 90,
        aiConfidence: 70,
        autonomyScore: 60,
        avgEtaMinutes: 68,
        criticalMissions: 14,
        blockedRoutes: 7,
        medicineCoverage: 56,
        foodCoverage: 58,
      },
      {
        id: 'p1',
        minute: 'T+10',
        title: 'Corridor triage + staged supplies',
        note: 'Staging hubs closer; cuts ETA despite blocked segments.',
        severity: 86,
        aiConfidence: 78,
        autonomyScore: 71,
        avgEtaMinutes: 49,
        criticalMissions: 12,
        blockedRoutes: 6,
        medicineCoverage: 63,
        foodCoverage: 66,
      },
      {
        id: 'p2',
        minute: 'T+24',
        title: 'Post-landfall stabilization',
        note: 'Route truth improves; supply continuity strengthens.',
        severity: 74,
        aiConfidence: 84,
        autonomyScore: 80,
        avgEtaMinutes: 36,
        criticalMissions: 8,
        blockedRoutes: 3,
        medicineCoverage: 72,
        foodCoverage: 74,
      },
    ],
  },
  {
    id: 'gujarat-earthquake-2001',
    title: 'Gujarat earthquake — hospital surge',
    year: 2001,
    inspiredBy: 'Major earthquake damage and urgent trauma load.',
    judgeGoal: 'Check hospital surge response, medicine coverage, and mission prioritization.',
    map: { center: { lat: 23.3500, lng: 70.1000 }, zoom: 7, radiusKm: 220 },
    markers: [
      { id: 'impact-bhuj', label: 'Bhuj', type: 'impact', lat: 23.2420, lng: 69.6669 },
      { id: 'impact-ahmedabad', label: 'Ahmedabad', type: 'impact', lat: 23.0225, lng: 72.5714 },
      { id: 'hub-rajkot', label: 'Rajkot Hub', type: 'hub', lat: 22.3039, lng: 70.8022 },
      { id: 'hub-jaipur', label: 'Jaipur Hub', type: 'hub', lat: 26.9124, lng: 75.7873 },
    ],
    phases: [
      {
        id: 'p0',
        minute: 'T+00',
        title: 'Trauma spike',
        note: 'Hospitals overload; highest critical mission count.',
        severity: 92,
        aiConfidence: 74,
        autonomyScore: 58,
        avgEtaMinutes: 62,
        criticalMissions: 16,
        blockedRoutes: 5,
        medicineCoverage: 52,
        foodCoverage: 61,
      },
      {
        id: 'p1',
        minute: 'T+06',
        title: 'Stock + triage coordination',
        note: 'Auto-orders and triage lower critical backlog.',
        severity: 86,
        aiConfidence: 80,
        autonomyScore: 70,
        avgEtaMinutes: 48,
        criticalMissions: 11,
        blockedRoutes: 4,
        medicineCoverage: 64,
        foodCoverage: 68,
      },
      {
        id: 'p2',
        minute: 'T+16',
        title: 'Stabilization',
        note: 'Demand normalizes; coverage climbs.',
        severity: 72,
        aiConfidence: 86,
        autonomyScore: 82,
        avgEtaMinutes: 34,
        criticalMissions: 7,
        blockedRoutes: 2,
        medicineCoverage: 76,
        foodCoverage: 74,
      },
    ],
  },
  {
    id: 'uttarakhand-floods-2013',
    title: 'Uttarakhand floods — last-mile access',
    year: 2013,
    inspiredBy: 'Flash floods/landslides and difficult last-mile access in mountainous terrain.',
    judgeGoal: 'Check if the system switches to rescue + airlift when roads fail.',
    map: { center: { lat: 30.2846, lng: 79.0669 }, zoom: 8, radiusKm: 110 },
    markers: [
      { id: 'impact-kedarnath', label: 'Kedarnath', type: 'impact', lat: 30.7346, lng: 79.0669 },
      { id: 'impact-rishikesh', label: 'Rishikesh', type: 'impact', lat: 30.0869, lng: 78.2676 },
      { id: 'hub-dehradun', label: 'Dehradun Hub', type: 'hub', lat: 30.3165, lng: 78.0322 },
      { id: 'hub-delhi', label: 'Delhi Hub', type: 'hub', lat: 28.6139, lng: 77.2090 },
    ],
    phases: [
      {
        id: 'p0',
        minute: 'T+00',
        title: 'Road collapse',
        note: 'Access fails quickly; ETAs spike.',
        severity: 88,
        aiConfidence: 68,
        autonomyScore: 57,
        avgEtaMinutes: 74,
        criticalMissions: 13,
        blockedRoutes: 8,
        medicineCoverage: 55,
        foodCoverage: 57,
      },
      {
        id: 'p1',
        minute: 'T+09',
        title: 'Air + rescue focus',
        note: 'High-priority extraction replaces road-first routing.',
        severity: 84,
        aiConfidence: 76,
        autonomyScore: 69,
        avgEtaMinutes: 52,
        criticalMissions: 12,
        blockedRoutes: 7,
        medicineCoverage: 62,
        foodCoverage: 64,
      },
      {
        id: 'p2',
        minute: 'T+22',
        title: 'Relief lanes re-open',
        note: 'Staging improves; critical mission count drops.',
        severity: 72,
        aiConfidence: 84,
        autonomyScore: 79,
        avgEtaMinutes: 38,
        criticalMissions: 8,
        blockedRoutes: 4,
        medicineCoverage: 72,
        foodCoverage: 70,
      },
    ],
  },
  {
    id: 'heatwave',
    title: 'Heatwave — health load',
    year: 2022,
    inspiredBy: 'Heat stress and health-system pressure during extreme heat.',
    judgeGoal: 'Check if hospital load stays stable and medicine coverage holds.',
    map: { center: { lat: 28.6139, lng: 77.2090 }, zoom: 6, radiusKm: 220 },
    markers: [
      { id: 'impact-delhi', label: 'Delhi', type: 'impact', lat: 28.6139, lng: 77.2090 },
      { id: 'impact-jaipur', label: 'Jaipur', type: 'impact', lat: 26.9124, lng: 75.7873 },
      { id: 'impact-lucknow', label: 'Lucknow', type: 'impact', lat: 26.8467, lng: 80.9462 },
      { id: 'hub-gurgaon', label: 'Gurgaon Hub', type: 'hub', lat: 28.4595, lng: 77.0266 },
    ],
    phases: [
      {
        id: 'p0',
        minute: 'T+00',
        title: 'Heat advisory to ER influx',
        note: 'Hospitals start to surge; routing remains mostly open.',
        severity: 72,
        aiConfidence: 78,
        autonomyScore: 70,
        avgEtaMinutes: 32,
        criticalMissions: 6,
        blockedRoutes: 1,
        medicineCoverage: 62,
        foodCoverage: 70,
      },
      {
        id: 'p1',
        minute: 'T+12',
        title: 'Peak load',
        note: 'Medicine usage spikes; confidence depends on reporting quality.',
        severity: 80,
        aiConfidence: 74,
        autonomyScore: 68,
        avgEtaMinutes: 34,
        criticalMissions: 8,
        blockedRoutes: 1,
        medicineCoverage: 58,
        foodCoverage: 68,
      },
      {
        id: 'p2',
        minute: 'T+24',
        title: 'Stabilized operations',
        note: 'Stock balancing and load distribution improves.',
        severity: 64,
        aiConfidence: 82,
        autonomyScore: 79,
        avgEtaMinutes: 28,
        criticalMissions: 5,
        blockedRoutes: 0,
        medicineCoverage: 70,
        foodCoverage: 74,
      },
    ],
  },
];

