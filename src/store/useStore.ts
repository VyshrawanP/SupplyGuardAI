import { create } from 'zustand';
import { getIndiaScenarioPresetLabel, INDIA_SCENARIO_CUSTOM_ID } from './indiaScenarioPresets';

type DisasterMode = 'flood' | 'earthquake' | 'storm' | 'heatwave' | 'compound';
type ServiceType = 'ambulance' | 'drone' | 'food' | 'rescue' | 'evacuation' | 'utility';

interface Point {
  lat: number;
  lng: number;
}

interface LocalitySeed {
  id: string;
  name: string;
  zone: string;
  position: Point;
  population: number;
  elevation: number;
  hospitalIds: string[];
  corridorIds: string[];
  demandMultiplier: number;
}

interface HospitalSeed {
  id: string;
  name: string;
  position: Point;
  capacity: number;
  traumaReadiness: number;
  medicineBase: number;
}

interface ReliefHub {
  id: string;
  name: string;
  position: Point;
  stock: number;
  fleet: number;
}

interface CorridorSeed {
  id: string;
  name: string;
  from: string;
  to: string;
  importance: 'primary' | 'secondary';
}

interface FleetSeed {
  id: string;
  service: ServiceType;
  name: string;
  homeHubId: string;
  capacity: number;
  speed: number;
  readinessBase: number;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface LocalityStatus extends LocalitySeed {
  riskScore: number;
  waterDepth: number;
  quakeDamage: number;
  stormImpact: number;
  heatStress: number;
  accessibility: number;
  affectedPopulation: number;
  medicineDemand: number;
  foodDemand: number;
  rescueDemand: number;
  evacDemand: number;
  supportPressure: 'stable' | 'strained' | 'critical';
}

export interface HospitalStatus extends HospitalSeed {
  occupancy: number;
  medicineStock: number;
  powerBackup: number;
  currentPatients: number;
  incomingPatients: number;
  outgoingPatients: number;
  droneInbound: number;
  rescueTeamsAssigned: number;
  foodStock: number;
  autoOrderEtaMinutes: number | null;
  status: 'stable' | 'surge' | 'critical';
  servingLocalities: string[];
}

export interface RouteStatus {
  id: string;
  name: string;
  from: string;
  to: string;
  riskScore: number;
  travelTime: number;
  status: 'open' | 'slow' | 'restricted' | 'blocked';
}

export interface ServiceMission {
  id: string;
  service: ServiceType;
  title: string;
  localityId: string;
  originId: string;
  destinationId: string;
  units: number;
  etaMinutes: number;
  routeRisk: number;
  priority: 'routine' | 'priority' | 'critical';
  status: 'queued' | 'dispatching' | 'in-progress';
  narrative: string;
}

export interface FleetUnit {
  id: string;
  service: ServiceType;
  name: string;
  localityId: string;
  position: Point;
  readiness: number;
  batteryOrFuel: number;
  load: number;
  etaMinutes: number;
  status: 'idle' | 'assigned' | 'moving' | 'critical';
}

export interface TimelineEvent {
  id: string;
  minute: string;
  title: string;
  detail: string;
  tone: 'info' | 'watch' | 'action';
}

export interface SimulationSettings {
  localityFocus: string;
  disasterMode: DisasterMode;
  scenarioPresetId: string;
  waterLevel: number;
  earthquakeLevel: number;
  stormLevel: number;
  heatLevel: number;
  medicineBuffer: number;
}

export interface Summary {
  averageRisk: number;
  impactedPopulation: number;
  hospitalsCritical: number;
  missionsRequired: number;
  medicineCoverage: number;
  foodCoverage: number;
  autonomyScore: number;
}

export interface AIBriefing {
  title: string;
  summary: string;
  confidence: number;
  priorities: string[];
}

export interface GeminiInsight {
  id: string;
  type: 'reroute' | 'dispatch' | 'risk';
  message: string;
  isRealAI?: boolean;
}

export interface ScenarioComparison {
  label: string;
  current: number;
  delta: number;
  suffix: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  source: 'ambulance' | 'drone' | 'food' | 'rescue' | 'hospital' | 'inventory' | 'utility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in-progress' | 'completed';
}

export interface OperationsStats {
  ambulanceArrivals: number;
  ambulanceDepartures: number;
  hospitalPeopleNow: number;
  droneSorties: number;
  rescueTeamsActive: number;
  currentFoodStock: number;
  autoOrdersTriggered: number;
  completedNotifications: number;
}

export interface StressTimelineItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  localityIds: string[];
  routeIds: string[];
  hospitalIds: string[];
  notificationIds: string[];
}

export interface DecisionPoint {
  id: string;
  title: string;
  rationale: string;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  localityIds: string[];
  routeIds: string[];
  hospitalIds: string[];
  notificationIds: string[];
}

export interface StressEvaluation {
  successes: string[];
  failures: string[];
  decisionAccuracy: string;
  resilience: string;
  explainability: string;
}

export interface StressScenarioReport {
  title: string;
  conditions: string[];
  timeline: StressTimelineItem[];
  decisions: DecisionPoint[];
  evaluation: StressEvaluation;
}

interface SupplyGuardState {
  settings: SimulationSettings;
  localities: LocalityStatus[];
  hospitals: HospitalStatus[];
  hubs: ReliefHub[];
  routes: RouteStatus[];
  alerts: AlertItem[];
  missions: ServiceMission[];
  fleet: FleetUnit[];
  timeline: TimelineEvent[];
  summary: Summary;
  aiBriefing: AIBriefing;
  geminiInsights: GeminiInsight[];
  comparisons: ScenarioComparison[];
  notifications: NotificationItem[];
  operations: OperationsStats;
  stressReport: StressScenarioReport;
  selectedLocalityId: string;
  selectedHospitalId: string;
  selectedStressTimelineId: string;
  selectedStressDecisionId: string;
  isAILoading: boolean;
  lastAIRefresh: number;
  updateSimulation: (patch: Partial<SimulationSettings>) => void;
  selectLocality: (id: string) => void;
  selectHospital: (id: string) => void;
  selectStressTimeline: (id: string) => void;
  selectStressDecision: (id: string) => void;
  resetSimulation: () => void;
  fetchGeminiInsights: () => Promise<void>;
}

const baseSettings: SimulationSettings = {
  localityFocus: 'indiranagar',
  disasterMode: 'compound',
  scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID,
  waterLevel: 46,
  earthquakeLevel: 34,
  stormLevel: 52,
  heatLevel: 28,
  medicineBuffer: 62,
};

const localitySeeds: LocalitySeed[] = [
  { id: 'whitefield', name: 'Whitefield', zone: 'East', position: { lat: 18, lng: 78 }, population: 410000, elevation: 902, hospitalIds: ['manipal', 'vydehi'], corridorIds: ['orr-east', 'whitefield-core'], demandMultiplier: 1.18 },
  { id: 'kr-puram', name: 'KR Puram', zone: 'East', position: { lat: 26, lng: 70 }, population: 280000, elevation: 888, hospitalIds: ['manipal'], corridorIds: ['orr-east', 'north-core'], demandMultiplier: 1.22 },
  { id: 'indiranagar', name: 'Indiranagar', zone: 'Central East', position: { lat: 38, lng: 58 }, population: 190000, elevation: 914, hospitalIds: ['cmh', 'manipal'], corridorIds: ['core-south', 'whitefield-core'], demandMultiplier: 1.1 },
  { id: 'mg-road', name: 'MG Road', zone: 'Core', position: { lat: 44, lng: 50 }, population: 120000, elevation: 920, hospitalIds: ['bowring', 'cmh'], corridorIds: ['core-south', 'north-core'], demandMultiplier: 0.95 },
  { id: 'koramangala', name: 'Koramangala', zone: 'South East', position: { lat: 56, lng: 56 }, population: 250000, elevation: 910, hospitalIds: ['st-johns', 'apollo'], corridorIds: ['core-south', 'ecity-south'], demandMultiplier: 1.16 },
  { id: 'electronic-city', name: 'Electronic City', zone: 'South', position: { lat: 74, lng: 58 }, population: 330000, elevation: 876, hospitalIds: ['apollo'], corridorIds: ['ecity-south'], demandMultiplier: 1.3 },
  { id: 'jayanagar', name: 'Jayanagar', zone: 'South', position: { lat: 66, lng: 42 }, population: 210000, elevation: 900, hospitalIds: ['apollo', 'st-johns'], corridorIds: ['core-south', 'west-south'], demandMultiplier: 1.04 },
  { id: 'rajarajeshwari', name: 'Rajarajeshwari Nagar', zone: 'West', position: { lat: 66, lng: 20 }, population: 260000, elevation: 909, hospitalIds: ['bgs'], corridorIds: ['west-south'], demandMultiplier: 1.14 },
  { id: 'hebbal', name: 'Hebbal', zone: 'North', position: { lat: 28, lng: 34 }, population: 240000, elevation: 915, hospitalIds: ['aster'], corridorIds: ['north-core'], demandMultiplier: 1.08 },
  { id: 'yelahanka', name: 'Yelahanka', zone: 'North', position: { lat: 16, lng: 30 }, population: 270000, elevation: 915, hospitalIds: ['aster'], corridorIds: ['north-core'], demandMultiplier: 1.02 },
  { id: 'bellandur', name: 'Bellandur', zone: 'South East', position: { lat: 52, lng: 68 }, population: 180000, elevation: 865, hospitalIds: ['st-johns', 'manipal'], corridorIds: ['orr-east', 'ecity-south'], demandMultiplier: 1.45 },
  { id: 'majestic', name: 'Majestic', zone: 'Core', position: { lat: 42, lng: 44 }, population: 150000, elevation: 918, hospitalIds: ['bowring'], corridorIds: ['north-core', 'core-south'], demandMultiplier: 1.12 },
  { id: 'malleshwaram', name: 'Malleshwaram', zone: 'West', position: { lat: 34, lng: 42 }, population: 140000, elevation: 925, hospitalIds: ['aster', 'bowring'], corridorIds: ['north-core'], demandMultiplier: 0.98 },
  { id: 'btm-layout', name: 'BTM Layout', zone: 'South', position: { lat: 68, lng: 52 }, population: 220000, elevation: 895, hospitalIds: ['apollo', 'st-johns'], corridorIds: ['core-south'], demandMultiplier: 1.25 },
  { id: 'sarjapur', name: 'Sarjapur', zone: 'East', position: { lat: 62, lng: 84 }, population: 120000, elevation: 882, hospitalIds: ['manipal'], corridorIds: ['orr-east'], demandMultiplier: 1.35 },
  { id: 'hsr-layout', name: 'HSR Layout', zone: 'South East', position: { lat: 60, lng: 64 }, population: 160000, elevation: 890, hospitalIds: ['st-johns'], corridorIds: ['ecity-south'], demandMultiplier: 1.15 },
];

const hospitalSeeds: HospitalSeed[] = [
  { id: 'manipal', name: 'Manipal Hospital', position: { lat: 34, lng: 62 }, capacity: 430, traumaReadiness: 84, medicineBase: 78 },
  { id: 'vydehi', name: 'Vydehi Hospital', position: { lat: 18, lng: 82 }, capacity: 510, traumaReadiness: 76, medicineBase: 82 },
  { id: 'cmh', name: 'CMH Hospital', position: { lat: 40, lng: 56 }, capacity: 260, traumaReadiness: 68, medicineBase: 64 },
  { id: 'st-johns', name: 'St. John\'s Medical', position: { lat: 58, lng: 52 }, capacity: 620, traumaReadiness: 88, medicineBase: 86 },
  { id: 'apollo', name: 'Apollo Bannerghatta', position: { lat: 70, lng: 50 }, capacity: 540, traumaReadiness: 82, medicineBase: 80 },
  { id: 'bgs', name: 'BGS Global', position: { lat: 68, lng: 18 }, capacity: 360, traumaReadiness: 70, medicineBase: 72 },
  { id: 'aster', name: 'Aster CMI', position: { lat: 24, lng: 34 }, capacity: 500, traumaReadiness: 78, medicineBase: 74 },
  { id: 'bowring', name: 'Bowring Hospital', position: { lat: 42, lng: 48 }, capacity: 310, traumaReadiness: 72, medicineBase: 60 },
];

const reliefHubs: ReliefHub[] = [
  { id: 'peenya', name: 'Peenya Relief Hub', position: { lat: 34, lng: 16 }, stock: 820, fleet: 12 },
  { id: 'hoskote', name: 'Hoskote Medical Depot', position: { lat: 24, lng: 90 }, stock: 760, fleet: 10 },
  { id: 'bommasandra', name: 'Bommasandra Logistics Yard', position: { lat: 84, lng: 62 }, stock: 940, fleet: 14 },
];

const corridorSeeds: CorridorSeed[] = [
  { id: 'orr-east', name: 'Outer Ring East', from: 'whitefield', to: 'kr-puram', importance: 'primary' },
  { id: 'whitefield-core', name: 'Whitefield Core Link', from: 'kr-puram', to: 'indiranagar', importance: 'primary' },
  { id: 'north-core', name: 'Hebbal Core Corridor', from: 'yelahanka', to: 'mg-road', importance: 'primary' },
  { id: 'core-south', name: 'Core South Connector', from: 'mg-road', to: 'koramangala', importance: 'primary' },
  { id: 'ecity-south', name: 'Electronic City Expressway', from: 'koramangala', to: 'electronic-city', importance: 'primary' },
  { id: 'west-south', name: 'West South Relief Link', from: 'rajarajeshwari', to: 'jayanagar', importance: 'secondary' },
];

const fleetSeeds: FleetSeed[] = [
  { id: 'amb-01', service: 'ambulance', name: 'ALS Ambulance Alpha', homeHubId: 'peenya', capacity: 4, speed: 52, readinessBase: 86 },
  { id: 'amb-02', service: 'ambulance', name: 'Trauma Ambulance Bravo', homeHubId: 'bommasandra', capacity: 4, speed: 58, readinessBase: 80 },
  { id: 'drn-11', service: 'drone', name: 'Relief Drone Falcon', homeHubId: 'hoskote', capacity: 28, speed: 76, readinessBase: 90 },
  { id: 'drn-12', service: 'drone', name: 'Med Drone Swift', homeHubId: 'peenya', capacity: 18, speed: 82, readinessBase: 93 },
  { id: 'fd-21', service: 'food', name: 'Food Convoy Delta', homeHubId: 'bommasandra', capacity: 180, speed: 40, readinessBase: 78 },
  { id: 'rs-31', service: 'rescue', name: 'Urban Rescue Team 7', homeHubId: 'peenya', capacity: 36, speed: 44, readinessBase: 84 },
  { id: 'ev-41', service: 'evacuation', name: 'Shelter Bus Vector', homeHubId: 'hoskote', capacity: 52, speed: 38, readinessBase: 74 },
  { id: 'ut-51', service: 'utility', name: 'Water and Power Rig', homeHubId: 'peenya', capacity: 70, speed: 34, readinessBase: 72 },
];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const distance = (a: Point, b: Point) => Math.hypot(a.lat - b.lat, a.lng - b.lng);

const computeScenario = (settings: SimulationSettings) => {
  const scenarioLabel = getIndiaScenarioPresetLabel(settings.scenarioPresetId);
  const scenarioTag = scenarioLabel ? `${scenarioLabel} • ` : '';
  const focus = localitySeeds.find((item) => item.id === settings.localityFocus) ?? localitySeeds[0];

  const localities = localitySeeds.map((seed) => {
    const focusDistance = distance(seed.position, focus.position);
    const focusFactor = clamp(100 - focusDistance * 1.35) / 100;
    
    // Low elevation areas like Bellandur flood significantly faster
    const elevationImpact = Math.max(0, (910 - seed.elevation) * 1.5);
    const floodBase = clamp(settings.waterLevel * 0.8 + elevationImpact + focusFactor * 25);
    
    const quakeBase = clamp(settings.earthquakeLevel * 1.2 + focusFactor * 30 + seed.demandMultiplier * 10);
    const stormBase = clamp(settings.stormLevel * 1.1 + focusFactor * 20);
    const heatBase = clamp(settings.heatLevel * 1.15 + seed.demandMultiplier * 12);
    
    const modeBoost = settings.disasterMode === 'compound'
      ? 15
      : settings.disasterMode === 'flood'
        ? floodBase * 0.2
        : settings.disasterMode === 'earthquake'
          ? quakeBase * 0.22
          : settings.disasterMode === 'storm'
            ? stormBase * 0.18
            : heatBase * 0.16;

    const riskScore = clamp(
      floodBase * 0.35 +
      quakeBase * 0.30 +
      stormBase * 0.20 +
      heatBase * 0.15 +
      modeBoost
    );
    
    // Accessibility is killed by flood and quake damage
    const accessibility = clamp(100 - (floodBase * 0.5 + quakeBase * 0.35 + stormBase * 0.15));
    const affectedPopulation = Math.round(seed.population * (riskScore / 100) * 0.65);
    
    // Inventory slider (medicineBuffer) directly affects how much demand can be "seen" or "met"
    const medicineDemand = Math.round((affectedPopulation / 1000) * (2.2 + seed.demandMultiplier) * (1 + (100 - settings.medicineBuffer) / 200));
    const foodDemand = Math.round((affectedPopulation / 1000) * (3.1 + focusFactor));
    const rescueDemand = Math.round((quakeBase * 0.5 + stormBase * 0.3 + focusFactor * 20) / 2);
    const evacDemand = Math.round((floodBase * 0.6 + riskScore * 0.25) * 20);
    
    const supportPressure = riskScore > 75 || accessibility < 30
      ? 'critical'
      : riskScore > 50 || accessibility < 50
        ? 'strained'
        : 'stable';

    return {
      ...seed,
      riskScore: Math.round(riskScore),
      waterDepth: Math.round(floodBase * 0.12 * 10) / 10,
      quakeDamage: Math.round(quakeBase),
      stormImpact: Math.round(stormBase),
      heatStress: Math.round(heatBase),
      accessibility: Math.round(accessibility),
      affectedPopulation,
      medicineDemand,
      foodDemand,
      rescueDemand,
      evacDemand,
      supportPressure,
    } satisfies LocalityStatus;
  });

  const hospitals = hospitalSeeds.map((seed) => {
    const servingLocalities = localities
      .filter((locality) => locality.hospitalIds.includes(seed.id))
      .map((locality) => locality.id);
    const stressLoad = servingLocalities
      .map((id) => localities.find((locality) => locality.id === id)!)
      .reduce((sum, locality) => sum + locality.riskScore * locality.demandMultiplier, 0);
    const occupancy = clamp((stressLoad / Math.max(servingLocalities.length, 1)) * 0.82 + 18);
    const medicineStock = clamp(seed.medicineBase + settings.medicineBuffer * 0.42 - occupancy * 0.38);
    const currentPatients = Math.round((seed.capacity * occupancy) / 100);
    const incomingPatients = Math.round(servingLocalities.length * 5 + occupancy * 0.22);
    const outgoingPatients = Math.max(2, Math.round(incomingPatients * 0.45));
    const droneInbound = Math.max(0, Math.round((100 - medicineStock) / 18));
    const rescueTeamsAssigned = Math.max(1, Math.round(stressLoad / 95));
    const foodStock = Math.round(clamp(92 - occupancy * 0.42 + settings.medicineBuffer * 0.18));
    const autoOrderEtaMinutes = medicineStock < 46 ? Math.round(28 + (46 - medicineStock) * 1.7) : null;
    const powerBackup = clamp(100 - settings.stormLevel * 0.4 - settings.earthquakeLevel * 0.25 + seed.traumaReadiness * 0.12);
    const status = occupancy > 88 || medicineStock < 32 || powerBackup < 35
      ? 'critical'
      : occupancy > 68 || medicineStock < 50
        ? 'surge'
        : 'stable';

    return {
      ...seed,
      occupancy: Math.round(occupancy),
      medicineStock: Math.round(medicineStock),
      powerBackup: Math.round(powerBackup),
      currentPatients,
      incomingPatients,
      outgoingPatients,
      droneInbound,
      rescueTeamsAssigned,
      foodStock,
      autoOrderEtaMinutes,
      status,
      servingLocalities,
    } satisfies HospitalStatus;
  });

  const routes = corridorSeeds.map((corridor) => {
    const from = localities.find((item) => item.id === corridor.from)!;
    const to = localities.find((item) => item.id === corridor.to)!;
    const riskScore = Math.round(clamp((from.riskScore + to.riskScore) / 2 + (100 - Math.min(from.accessibility, to.accessibility)) * 0.35));
    const travelTime = Math.round(distance(from.position, to.position) * (corridor.importance === 'primary' ? 2.8 : 3.7) + riskScore * 0.4);
    const status = riskScore > 84 ? 'blocked' : riskScore > 68 ? 'restricted' : riskScore > 52 ? 'slow' : 'open';

    return {
      id: corridor.id,
      name: corridor.name,
      from: corridor.from,
      to: corridor.to,
      riskScore,
      travelTime,
      status,
    } satisfies RouteStatus;
  });

  const strainedLocalities = localities
    .filter((locality) => locality.supportPressure !== 'stable')
    .sort((a, b) => b.riskScore - a.riskScore);

  const missions = strainedLocalities.flatMap((locality) => {
    const localityHospitals = hospitals.filter((hospital) => locality.hospitalIds.includes(hospital.id));
    const targetHospital = [...localityHospitals].sort((a, b) => a.medicineStock - b.medicineStock)[0];
    const nearestHub = [...reliefHubs].sort((a, b) => distance(a.position, locality.position) - distance(b.position, locality.position))[0];
    const routeRisk = Math.round(clamp((100 - locality.accessibility) * 0.7 + locality.riskScore * 0.3));
    const hospitalName = targetHospital?.name ?? 'nearest hospital';

    const servicePlan: Array<Pick<ServiceMission, 'service' | 'title' | 'units' | 'narrative'>> = [
      {
        service: 'ambulance',
        title: `Ambulance surge for ${locality.name}`,
        units: Math.max(1, Math.round(locality.rescueDemand / 12)),
        narrative: `ALS ambulances are moving trauma cases from ${locality.name} toward ${hospitalName}.`,
      },
      {
        service: 'drone',
        title: `Drone medicine lift for ${locality.name}`,
        units: Math.max(1, Math.round(locality.medicineDemand / 130)),
        narrative: `Drone sorties are bypassing road damage to drop essential medicines above the flood and debris line.`,
      },
      {
        service: 'food',
        title: `Food convoy staging for ${locality.name}`,
        units: Math.max(1, Math.round(locality.foodDemand / 220)),
        narrative: `Meal packets and bottled water are routed to temporary shelter clusters near ${locality.name}.`,
      },
      {
        service: 'rescue',
        title: `Rescue extraction around ${locality.name}`,
        units: Math.max(1, Math.round(locality.rescueDemand / 9)),
        narrative: `Urban search teams are sweeping collapsed or inaccessible blocks and syncing with casualty triage.`,
      },
      {
        service: 'evacuation',
        title: `Evacuation buses for ${locality.name}`,
        units: Math.max(1, Math.round(locality.evacDemand / 380)),
        narrative: `Buses are preparing a phased evacuation from low-lying streets and high-vulnerability homes.`,
      },
      {
        service: 'utility',
        title: `Utility restore package for ${locality.name}`,
        units: Math.max(1, Math.round((locality.waterDepth * 3 + locality.stormImpact) / 60)),
        narrative: `Utility crews are carrying portable pumps, generators, and communications recovery kits.`,
      },
    ];

    return servicePlan.map((plan) => {
      const isDroneStormGrounded = plan.service === 'drone' && settings.stormLevel > 75;
      const serviceBias = plan.service === 'drone' ? 0.75 : plan.service === 'ambulance' ? 0.95 : 1.15;
      const etaMinutes = isDroneStormGrounded ? 0 : Math.round(distance(nearestHub.position, locality.position) * (2.8 * serviceBias) + routeRisk * (plan.service === 'drone' ? 0.35 : 0.6));
      const priority = (locality.supportPressure === 'critical' || routeRisk > 78) && !isDroneStormGrounded ? 'critical' : locality.riskScore > 65 ? 'priority' : 'routine';
      const destinationId = targetHospital?.id ?? locality.id;

      let status: ServiceMission['status'] = priority === 'critical' ? 'in-progress' : routeRisk > 60 ? 'dispatching' : 'queued';
      let narrative = plan.narrative;

      if (isDroneStormGrounded) {
        status = 'queued';
        narrative = `Grounded: High wind speeds (${settings.stormLevel} knots) prevent safe drone flight to ${locality.name}. Missions will resume when storm clears.`;
      }

      return {
        id: `${plan.service}-${locality.id}`,
        service: plan.service,
        title: plan.title,
        localityId: locality.id,
        originId: nearestHub.id,
        destinationId,
        units: isDroneStormGrounded ? 0 : plan.units,
        etaMinutes,
        routeRisk,
        priority,
        status,
        narrative,
      } satisfies ServiceMission;
    });
  });

  const fleet = fleetSeeds.map((seed, index) => {
    const relatedMission = missions.filter((mission) => mission.service === seed.service).sort((a, b) => b.routeRisk - a.routeRisk)[index % Math.max(missions.filter((mission) => mission.service === seed.service).length, 1)];
    const homeHub = reliefHubs.find((hub) => hub.id === seed.homeHubId)!;
    const locality = relatedMission ? localities.find((item) => item.id === relatedMission.localityId)! : focus;
    const drift = 0.18 + index * 0.04;
    const position = relatedMission
      ? {
          lat: homeHub.position.lat + (locality.position.lat - homeHub.position.lat) * drift,
          lng: homeHub.position.lng + (locality.position.lng - homeHub.position.lng) * drift,
        }
      : homeHub.position;
    const readiness = Math.round(clamp(seed.readinessBase - (relatedMission?.routeRisk ?? 18) * 0.22));
    const batteryOrFuel = Math.round(clamp(88 - (relatedMission?.etaMinutes ?? 12) * 0.55 + (seed.service === 'drone' ? 6 : 0)));
    const load = Math.round(clamp((relatedMission?.units ?? 0) * (seed.service === 'food' ? 8 : seed.service === 'drone' ? 14 : 18), 0, 100));
    const status = !relatedMission ? 'idle' : relatedMission.priority === 'critical' ? 'critical' : relatedMission.status === 'in-progress' ? 'moving' : 'assigned';

    return {
      id: seed.id,
      service: seed.service,
      name: seed.name,
      localityId: locality.id,
      position,
      readiness,
      batteryOrFuel,
      load,
      etaMinutes: relatedMission?.etaMinutes ?? 0,
      status,
    } satisfies FleetUnit;
  });

  const topLocality = strainedLocalities[0] ?? localities.find((locality) => locality.id === focus.id) ?? localities[0];
  const topRoute = routes.sort((a, b) => b.riskScore - a.riskScore)[0];
  const coverageBase = hospitals.reduce((sum, hospital) => sum + hospital.medicineStock, 0) / hospitals.length;
  const foodCoverage = Math.round(clamp((settings.medicineBuffer * 0.75 + reliefHubs.reduce((sum, hub) => sum + hub.stock, 0) / 80) - strainedLocalities.length * 2.6));
  const autonomyScore = Math.round(clamp(
    78 +
    fleet.filter((unit) => unit.status !== 'critical').length * 2 -
    routes.filter((route) => route.status === 'blocked').length * 6 -
    hospitals.filter((hospital) => hospital.status === 'critical').length * 5
  ));

  const summary = {
    averageRisk: Math.round(localities.reduce((sum, locality) => sum + locality.riskScore, 0) / localities.length),
    impactedPopulation: localities.reduce((sum, locality) => sum + locality.affectedPopulation, 0),
    hospitalsCritical: hospitals.filter((hospital) => hospital.status === 'critical').length,
    missionsRequired: missions.length,
    medicineCoverage: Math.round(coverageBase),
    foodCoverage,
    autonomyScore,
  } satisfies Summary;

  const alerts: AlertItem[] = [
    {
      id: 'alert-0',
      title: `${topLocality.name} enters AI priority band`,
      message: `${topLocality.waterDepth} cm flooding with ${topLocality.quakeDamage}% structural stress. Autonomous dispatch stack is escalating multi-service support.`,
      severity: topLocality.supportPressure === 'critical' ? 'critical' : 'high',
    },
    {
      id: 'alert-1',
      title: `${topRoute.name} route health degraded`,
      message: `${topRoute.status.toUpperCase()} corridor, predicted ${topRoute.travelTime} minute movement time. Drone and ambulance routing now split across alternate lanes.`,
      severity: topRoute.status === 'blocked' ? 'critical' : topRoute.status === 'restricted' ? 'high' : 'medium',
    },
    {
      id: 'alert-2',
      title: `Hospital surge load shifting`,
      message: `${hospitals.filter((hospital) => hospital.status !== 'stable').length} hospitals are under surge conditions. Medicine reserve balancing is active.`,
      severity: hospitals.some((hospital) => hospital.status === 'critical') ? 'high' : 'medium',
    },
  ];

  const aiBriefing = {
    title: `AI Scenario Copilot: ${scenarioTag}${topLocality.name} response`,
    summary: `If water rises another 10%, ${topLocality.name} and its connected corridors tip into restricted access. The system is pre-positioning ambulance, drone, food, evacuation, rescue, and utility services so operations still feel live even in offline mode.`,
    confidence: Math.round(clamp(86 - routes.filter((route) => route.status === 'blocked').length * 4 + settings.medicineBuffer * 0.05)),
    priorities: [
      `Protect ${topLocality.name} hospital intake and keep ${hospitals.find((hospital) => topLocality.hospitalIds.includes(hospital.id))?.name ?? 'nearest hospital'} above 45% medicine stock.`,
      `Hold drone sorties on ${topRoute.name} to preserve critical deliveries while surface access is unstable.`,
      `Shift food and evacuation staging toward ${reliefHubs.sort((a, b) => distance(a.position, topLocality.position) - distance(b.position, topLocality.position))[0].name}.`,
    ],
  } satisfies AIBriefing;

  const geminiInsights: GeminiInsight[] = [
    {
      id: 'ins-1',
      type: 'reroute',
      message: topRoute.status === 'blocked' || topRoute.status === 'restricted'
        ? `I've rerouted heavy convoys away from ${topRoute.name} due to ${topRoute.riskScore}% risk. Moving them via secondary corridors to ensure medicine flow.`
        : `Primary corridors like ${topRoute.name} are currently stable. I'm keeping ambulances on these main routes for maximum speed.`,
    },
    {
      id: 'ins-2',
      type: 'dispatch',
      message: settings.waterLevel > 60
        ? `Water levels at ${settings.waterLevel}cm are making road transport inefficient for ${topLocality.name}. I'm escalating drone sorties to 85% of total med-delivery load.`
        : `Road access to ${topLocality.name} remains viable. I'm prioritizing ALS ambulances for trauma cases while using drones for high-speed vaccine delivery.`,
    },
    {
      id: 'ins-3',
      type: 'risk',
      message: summary.averageRisk > 60
        ? `Critical risk detected in ${strainedLocalities.length} zones. I'm deploying autonomous "mesh-repeaters" to ${strainedLocalities[0]?.name ?? 'impacted areas'} to maintain communication.`
        : `Overall city risk is manageable. I'm focusing my attention on hospital supply chains to prevent any surge-related stockouts.`,
    },
  ];

  const nominalRisk = 22;
  const nominalMissions = 6;
  const nominalCritical = 0;
  const escalationWater = Math.min(100, settings.waterLevel + 10);
  const escalationImpact = Math.round((escalationWater - settings.waterLevel) * 0.85 + settings.earthquakeLevel * 0.18);

  const comparisons: ScenarioComparison[] = [
    {
      label: 'Risk vs nominal',
      current: summary.averageRisk,
      delta: summary.averageRisk - nominalRisk,
      suffix: '%',
    },
    {
      label: 'Missions vs nominal',
      current: summary.missionsRequired,
      delta: summary.missionsRequired - nominalMissions,
      suffix: '',
    },
    {
      label: 'Critical hospitals',
      current: summary.hospitalsCritical,
      delta: summary.hospitalsCritical - nominalCritical,
      suffix: '',
    },
    {
      label: 'If water +10%',
      current: escalationWater,
      delta: escalationImpact,
      suffix: '%',
    },
  ];

  const notifications: NotificationItem[] = [
    ...hospitals
      .filter((hospital) => hospital.autoOrderEtaMinutes !== null)
      .map<NotificationItem>((hospital) => ({
        id: `order-${hospital.id}`,
        title: `Auto-order placed for ${hospital.name}`,
        detail: `Medicine stock dropped to ${hospital.medicineStock}%. Replenishment convoy and drone reserve ETA ${hospital.autoOrderEtaMinutes} mins.`,
        source: 'inventory',
        severity: hospital.medicineStock < 32 ? 'critical' : 'high',
        status: 'in-progress',
      })),
    ...missions.slice(0, 8).map<NotificationItem>((mission) => ({
      id: `mission-note-${mission.id}`,
      title: mission.title,
      detail: `${mission.units} units by ${mission.service} toward ${localities.find((item) => item.id === mission.localityId)?.name ?? 'target locality'} with route risk ${mission.routeRisk}%.`,
      source: mission.service === 'evacuation' ? 'utility' : mission.service,
      severity: mission.priority === 'critical' ? 'critical' : mission.priority === 'priority' ? 'high' : 'medium',
      status: mission.status === 'queued' ? 'new' : mission.status === 'dispatching' ? 'in-progress' : 'completed',
    })),
    ...hospitals.slice(0, 4).map<NotificationItem>((hospital) => ({
      id: `hospital-note-${hospital.id}`,
      title: `${hospital.name} intake update`,
      detail: `${hospital.currentPatients} patients active, ${hospital.incomingPatients} inbound, ${hospital.droneInbound} drone drops pending.`,
      source: 'hospital',
      severity: hospital.status === 'critical' ? 'critical' : hospital.status === 'surge' ? 'high' : 'medium',
      status: hospital.status === 'stable' ? 'completed' : 'in-progress',
    })),
  ].slice(0, 14);

  const operations = {
    ambulanceArrivals: missions.filter((mission) => mission.service === 'ambulance').reduce((sum, mission) => sum + mission.units, 0),
    ambulanceDepartures: hospitals.reduce((sum, hospital) => sum + hospital.outgoingPatients, 0),
    hospitalPeopleNow: hospitals.reduce((sum, hospital) => sum + hospital.currentPatients, 0),
    droneSorties: missions.filter((mission) => mission.service === 'drone').reduce((sum, mission) => sum + mission.units, 0),
    rescueTeamsActive: hospitals.reduce((sum, hospital) => sum + hospital.rescueTeamsAssigned, 0),
    currentFoodStock: Math.round(hospitals.reduce((sum, hospital) => sum + hospital.foodStock, 0) / hospitals.length),
    autoOrdersTriggered: hospitals.filter((hospital) => hospital.autoOrderEtaMinutes !== null).length,
    completedNotifications: notifications.filter((item) => item.status === 'completed').length,
  } satisfies OperationsStats;

  const stressReport = {
    title: 'Urban flood with hospital overload under uncertain field data',
    conditions: [
      'Urban flood with hospital overload',
      '100+ concurrent survivor reports',
      'Rapidly changing road conditions',
    ],
    timeline: [
      {
        id: 'stress-tl-0',
        time: 'T+00',
        title: 'Flood stress enters the city core',
        detail: `${topLocality.name} and linked corridors begin flooding while hospital intake surges and route truth becomes inconsistent.`,
        localityIds: [topLocality.id],
        routeIds: [topRoute.id],
        hospitalIds: topLocality.hospitalIds,
        notificationIds: ['hospital-note-apollo', 'hospital-note-manipal'].filter((id) => notifications.some((item) => item.id === id)),
      },
      {
        id: 'stress-tl-1',
        time: 'T+05',
        title: 'Survivor report spike',
        detail: 'The system absorbs 100+ concurrent survivor reports and starts confidence-weighted clustering to remove duplicates.',
        localityIds: strainedLocalities.slice(0, 2).map((item) => item.id),
        routeIds: routes.filter((route) => route.status !== 'open').slice(0, 2).map((route) => route.id),
        hospitalIds: hospitals.slice(0, 2).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'rescue').slice(0, 2).map((item) => item.id),
      },
      {
        id: 'stress-tl-2',
        time: 'T+12',
        title: 'Hospital overload threshold reached',
        detail: `${hospitals.filter((hospital) => hospital.status !== 'stable').length} hospitals enter surge mode, forcing ambulance and drone coordination.`,
        localityIds: strainedLocalities.slice(0, 2).map((item) => item.id),
        routeIds: routes.filter((route) => route.status !== 'open').slice(0, 2).map((route) => route.id),
        hospitalIds: hospitals.filter((hospital) => hospital.status !== 'stable').slice(0, 3).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'hospital' || item.source === 'ambulance').slice(0, 4).map((item) => item.id),
      },
      {
        id: 'stress-tl-3',
        time: 'T+20',
        title: 'Road status decays faster than validation',
        detail: `${routes.filter((route) => route.status !== 'open').length} corridors degrade, so the system shifts to mixed road-air response.`,
        localityIds: strainedLocalities.slice(0, 3).map((item) => item.id),
        routeIds: routes.filter((route) => route.status !== 'open').slice(0, 3).map((route) => route.id),
        hospitalIds: hospitals.slice(0, 2).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'drone' || item.source === 'ambulance').slice(0, 4).map((item) => item.id),
      },
      {
        id: 'stress-tl-4',
        time: 'T+34',
        title: 'Auto-order and food balancing activate',
        detail: `${operations.autoOrdersTriggered} automatic supply orders trigger while food reserves rebalance across hospital catchments.`,
        localityIds: strainedLocalities.slice(0, 2).map((item) => item.id),
        routeIds: routes.slice(0, 2).map((route) => route.id),
        hospitalIds: hospitals.filter((hospital) => hospital.autoOrderEtaMinutes !== null).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'inventory' || item.source === 'food').slice(0, 4).map((item) => item.id),
      },
      {
        id: 'stress-tl-5',
        time: 'T+48',
        title: 'Uncertainty-driven triage',
        detail: 'Rescue teams are reassigned toward higher-confidence clusters while lower-confidence reports remain under monitoring.',
        localityIds: strainedLocalities.slice(0, 2).map((item) => item.id),
        routeIds: routes.filter((route) => route.status !== 'open').slice(0, 2).map((route) => route.id),
        hospitalIds: hospitals.slice(0, 2).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'rescue').slice(0, 3).map((item) => item.id),
      },
      {
        id: 'stress-tl-6',
        time: 'T+60',
        title: 'Partial stabilization',
        detail: 'The system remains operational, but some survivor requests are delayed due to noisy inputs and corridor collapse.',
        localityIds: strainedLocalities.slice(0, 3).map((item) => item.id),
        routeIds: routes.filter((route) => route.status !== 'open').slice(0, 3).map((route) => route.id),
        hospitalIds: hospitals.filter((hospital) => hospital.status !== 'stable').slice(0, 3).map((hospital) => hospital.id),
        notificationIds: notifications.slice(0, 4).map((item) => item.id),
      },
    ],
    decisions: [
      {
        id: 'stress-dc-0',
        title: 'Prioritize hospital-linked corridors first',
        rationale: 'This protects medical throughput and reduces near-term mortality, but leaves some edge localities waiting longer.',
        risk: 'High',
        localityIds: [topLocality.id],
        routeIds: [topRoute.id],
        hospitalIds: topLocality.hospitalIds,
        notificationIds: notifications.filter((item) => item.source === 'hospital' || item.source === 'ambulance').slice(0, 3).map((item) => item.id),
      },
      {
        id: 'stress-dc-1',
        title: 'Convert survivor reports into confidence-weighted clusters',
        rationale: 'This improves speed under heavy volume, but risks merging unrelated emergencies.',
        risk: 'Medium',
        localityIds: strainedLocalities.slice(0, 2).map((item) => item.id),
        routeIds: routes.slice(0, 2).map((route) => route.id),
        hospitalIds: hospitals.slice(0, 2).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'rescue').slice(0, 3).map((item) => item.id),
      },
      {
        id: 'stress-dc-2',
        title: 'Escalate from ambulance-first to ambulance + drone delivery',
        rationale: 'Mixed-mode transport offsets road instability and preserves medicine flow.',
        risk: 'Low',
        localityIds: strainedLocalities.slice(0, 3).map((item) => item.id),
        routeIds: routes.filter((route) => route.status !== 'open').slice(0, 2).map((route) => route.id),
        hospitalIds: hospitals.filter((hospital) => hospital.status !== 'stable').slice(0, 2).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'drone' || item.source === 'ambulance').slice(0, 4).map((item) => item.id),
      },
      {
        id: 'stress-dc-3',
        title: 'Trigger auto-ordering before total stock depletion',
        rationale: 'Automatic procurement prevents cascading inventory failure during peak uncertainty.',
        risk: 'Low',
        localityIds: strainedLocalities.slice(0, 2).map((item) => item.id),
        routeIds: routes.slice(0, 2).map((route) => route.id),
        hospitalIds: hospitals.filter((hospital) => hospital.autoOrderEtaMinutes !== null).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'inventory').map((item) => item.id),
      },
      {
        id: 'stress-dc-4',
        title: 'Reassign rescue teams away from low-confidence signals',
        rationale: 'Improves resource concentration but can miss genuine emergencies buried in noisy data.',
        risk: 'High',
        localityIds: strainedLocalities.slice(0, 2).map((item) => item.id),
        routeIds: routes.filter((route) => route.status !== 'open').slice(0, 2).map((route) => route.id),
        hospitalIds: hospitals.slice(0, 2).map((hospital) => hospital.id),
        notificationIds: notifications.filter((item) => item.source === 'rescue' || item.source === 'ambulance').slice(0, 4).map((item) => item.id),
      },
      {
        id: 'stress-dc-5',
        title: 'Act on stale road truth instead of waiting for certainty',
        rationale: 'Delaying action would worsen hospital overload, but acting early increases wrong-route risk.',
        risk: 'Critical',
        localityIds: strainedLocalities.slice(0, 3).map((item) => item.id),
        routeIds: routes.filter((route) => route.status !== 'open').slice(0, 3).map((route) => route.id),
        hospitalIds: hospitals.filter((hospital) => hospital.status !== 'stable').slice(0, 3).map((hospital) => hospital.id),
        notificationIds: notifications.slice(0, 5).map((item) => item.id),
      },
    ],
    evaluation: {
      successes: [
        'The system avoided total medical collapse by splitting response across ambulances, drones, rescue, food, and utility layers.',
        'Automatic ordering reduced the chance of medicine and food stockout before failure became irreversible.',
        'Confidence-based triage kept the system moving despite bad incoming data.',
      ],
      failures: [
        'Duplicate or low-confidence survivor reports still reduced rescue precision.',
        'Some ambulance decisions were likely made on route conditions that changed before vehicles arrived.',
        'Peripheral localities were deprioritized while high-load hospitals absorbed most resources.',
      ],
      decisionAccuracy: 'High for hospital and inventory decisions, medium for routing, and medium-low for rescue prioritization under noisy reports.',
      resilience: 'Moderately strong. The system resists cascading failure because transport modes, stock ordering, and priority logic diversify response.',
      explainability: 'Reasoning stays visible, but confidence drops when route truth and survivor reports conflict. The system can explain the logic path, not guarantee correctness.',
    },
  } satisfies StressScenarioReport;

  const timeline: TimelineEvent[] = [
    {
      id: 'tl-1',
      minute: 'T+03',
      title: 'Sensor twin refreshed',
      detail: `Offline map weights updated for ${scenarioTag}${settings.disasterMode} stress around ${focus.name}.`,
      tone: 'info',
    },
    {
      id: 'tl-2',
      minute: 'T+07',
      title: 'Corridor risk recomputed',
      detail: `${topRoute.name} moved to ${topRoute.status}; reroute logic favors drones and medical priority assets.`,
      tone: 'watch',
    },
    {
      id: 'tl-3',
      minute: 'T+11',
      title: 'Field services auto-assigned',
      detail: `${missions.filter((mission) => mission.priority === 'critical').length} critical missions are already in motion across ambulance, rescue, and supply layers.`,
      tone: 'action',
    },
  ];

  return {
    settings,
    localities,
    hospitals,
    hubs: reliefHubs,
    routes,
    alerts,
    missions: missions.sort((a, b) => b.routeRisk - a.routeRisk || b.units - a.units),
    fleet,
    timeline,
    summary,
    aiBriefing,
    geminiInsights,
    comparisons,
    notifications,
    operations,
    stressReport,
    selectedLocalityId: settings.localityFocus,
    selectedHospitalId: hospitals.find((hospital) => focus.hospitalIds.includes(hospital.id))?.id ?? hospitals[0].id,
    selectedStressTimelineId: 'stress-tl-0',
    selectedStressDecisionId: 'stress-dc-0',
  };
};

const initialState = computeScenario(baseSettings);

export const useStore = create<SupplyGuardState>((set, get) => ({
  ...initialState,
  updateSimulation: (patch) => {
    const newSettings = { ...get().settings, ...patch };
    set({
      settings: newSettings,
      ...computeScenario(newSettings),
    });
    
    if (Math.random() < 0.4) {
      get().fetchGeminiInsights();
    }
  },
  selectLocality: (id) =>
    set((state) => {
      const exists = state.localities.some((locality) => locality.id === id);
      if (!exists) {
        return state;
      }
      const locality = state.localities.find((item) => item.id === id);
      const selectedHospitalId = locality?.hospitalIds[0] ?? state.selectedHospitalId;
      return { selectedLocalityId: id, selectedHospitalId };
    }),
  selectHospital: (id) =>
    set((state) => {
      const exists = state.hospitals.some((hospital) => hospital.id === id);
      return exists ? { selectedHospitalId: id } : state;
    }),
  selectStressTimeline: (id) =>
    set((state) => {
      const exists = state.stressReport.timeline.some((item) => item.id === id);
      return exists ? { selectedStressTimelineId: id } : state;
    }),
  selectStressDecision: (id) =>
    set((state) => {
      const exists = state.stressReport.decisions.some((item) => item.id === id);
      return exists ? { selectedStressDecisionId: id } : state;
    }),
  resetSimulation: () => set(() => computeScenario(baseSettings)),
  isAILoading: false,
  lastAIRefresh: 0,
  fetchGeminiInsights: async () => {
    if (get().isAILoading) return;
    set({ isAILoading: true });
    try {
      const state = get();
      const payload = {
        summary: state.summary,
        topLocality: state.localities.find(l => l.id === state.settings.localityFocus),
        topRoute: state.routes.sort((a, b) => b.riskScore - a.riskScore)[0],
        strainedZones: state.localities.filter(l => l.supportPressure !== 'stable').length,
        disasterMode: state.settings.disasterMode,
      };

      const response = await fetch('/api/gemini-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      
      if (data.insights && Array.isArray(data.insights)) {
        set({ 
          geminiInsights: data.insights.map((ins: any, i: number) => ({
            ...ins,
            id: `ai-ins-${i}-${Date.now()}`,
            isRealAI: data.isRealAI,
          })),
          lastAIRefresh: Date.now()
        });
      }
    } catch (err) {
      console.error('Gemini fetch failed:', err);
    } finally {
      set({ isAILoading: false });
    }
  },
}));
