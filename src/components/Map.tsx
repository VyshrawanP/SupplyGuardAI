import React, { useMemo, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import {
  Ambulance,
  Building2,
  Package,
  Plane,
  Waves,
  Zap,
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useStore } from '../store/useStore';

type LatLng = { lat: number; lng: number };

const REAL_LOCALITY_COORDS: Record<string, LatLng> = {
  whitefield: { lat: 12.9698, lng: 77.7499 },
  'kr-puram': { lat: 13.0077, lng: 77.6955 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  'mg-road': { lat: 12.9756, lng: 77.6066 },
  koramangala: { lat: 12.9352, lng: 77.6245 },
  'electronic-city': { lat: 12.8456, lng: 77.6603 },
  jayanagar: { lat: 12.9299, lng: 77.5823 },
  rajarajeshwari: { lat: 12.9275, lng: 77.5155 },
  hebbal: { lat: 13.0358, lng: 77.5970 },
  yelahanka: { lat: 13.1007, lng: 77.5963 },
};

const REAL_HOSPITAL_COORDS: Record<string, LatLng> = {
  manipal: { lat: 12.9580, lng: 77.6493 },
  vydehi: { lat: 12.9850, lng: 77.7288 },
  cmh: { lat: 12.9742, lng: 77.6401 },
  'st-johns': { lat: 12.9346, lng: 77.6103 },
  apollo: { lat: 12.8891, lng: 77.5970 },
  bgs: { lat: 12.9031, lng: 77.5167 },
  aster: { lat: 13.0330, lng: 77.5947 },
  bowring: { lat: 12.9834, lng: 77.6096 },
};

const REAL_HUB_COORDS: Record<string, LatLng> = {
  peenya: { lat: 13.0288, lng: 77.5198 },
  hoskote: { lat: 13.0707, lng: 77.7981 },
  bommasandra: { lat: 12.8168, lng: 77.6896 },
};

const REAL_ROUTE_PATHS: Record<string, LatLng[]> = {
  'orr-east': [
    { lat: 12.9698, lng: 77.7499 },
    { lat: 12.9815, lng: 77.7360 },
    { lat: 12.9916, lng: 77.7207 },
    { lat: 13.0019, lng: 77.7060 },
    { lat: 13.0077, lng: 77.6955 },
  ],
  'whitefield-core': [
    { lat: 13.0077, lng: 77.6955 },
    { lat: 13.0002, lng: 77.6763 },
    { lat: 12.9947, lng: 77.6618 },
    { lat: 12.9860, lng: 77.6508 },
    { lat: 12.9784, lng: 77.6408 },
  ],
  'north-core': [
    { lat: 13.1007, lng: 77.5963 },
    { lat: 13.0759, lng: 77.5962 },
    { lat: 13.0485, lng: 77.5967 },
    { lat: 13.0358, lng: 77.5970 },
    { lat: 13.0067, lng: 77.5984 },
    { lat: 12.9893, lng: 77.6019 },
    { lat: 12.9756, lng: 77.6066 },
  ],
  'core-south': [
    { lat: 12.9756, lng: 77.6066 },
    { lat: 12.9679, lng: 77.6116 },
    { lat: 12.9578, lng: 77.6174 },
    { lat: 12.9468, lng: 77.6217 },
    { lat: 12.9352, lng: 77.6245 },
  ],
  'ecity-south': [
    { lat: 12.9352, lng: 77.6245 },
    { lat: 12.9174, lng: 77.6318 },
    { lat: 12.9007, lng: 77.6388 },
    { lat: 12.8796, lng: 77.6485 },
    { lat: 12.8604, lng: 77.6562 },
    { lat: 12.8456, lng: 77.6603 },
  ],
  'west-south': [
    { lat: 12.9275, lng: 77.5155 },
    { lat: 12.9279, lng: 77.5360 },
    { lat: 12.9287, lng: 77.5534 },
    { lat: 12.9294, lng: 77.5675 },
    { lat: 12.9299, lng: 77.5823 },
  ],
};

const servicePalette: Record<string, string> = {
  ambulance: '#f87171',
  drone: '#38bdf8',
  food: '#facc15',
  rescue: '#fb923c',
  evacuation: '#c4b5fd',
  utility: '#34d399',
};

const routeColor = (status: string) => {
  if (status === 'blocked') {
    return '#ef4444';
  }
  if (status === 'restricted') {
    return '#f97316';
  }
  if (status === 'slow') {
    return '#facc15';
  }
  return '#60a5fa';
};

const mapPointToBengaluru = (point: { lat: number; lng: number }): LatLng => {
  const lat = 13.139 - (point.lat / 100) * (13.139 - 12.835);
  const lng = 77.460 + (point.lng / 100) * (77.782 - 77.460);
  return { lat, lng };
};

const interpolatePoint = (from: LatLng, to: LatLng, t: number): LatLng => ({
  lat: from.lat + (to.lat - from.lat) * t,
  lng: from.lng + (to.lng - from.lng) * t,
});

const progressBetween = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  point: { lat: number; lng: number },
) => {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return 0;
  }

  const t = ((point.lng - start.lng) * dx + (point.lat - start.lat) * dy) / lengthSquared;
  return Math.max(0, Math.min(1, t));
};

const routePathFor = (routeId: string, from: LatLng, to: LatLng) => REAL_ROUTE_PATHS[routeId] ?? [from, to];

const riskRadiusMeters = (riskScore: number) => Math.max(450, riskScore * 28);

const iconForService = (service: string) => {
  switch (service) {
    case 'ambulance':
      return Ambulance;
    case 'drone':
      return Plane;
    case 'food':
      return Package;
    case 'utility':
      return Zap;
    default:
      return Waves;
  }
};

const divMarkerIcon = (html: string, className: string, size: [number, number], anchor: [number, number]) =>
  L.divIcon({
    html,
    className,
    iconSize: size,
    iconAnchor: anchor,
  });

const localityMarkerIcon = (tone: string, label: string) =>
  divMarkerIcon(
    `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;border:1px solid rgba(255,255,255,0.85);background:${tone};box-shadow:0 10px 24px rgba(2,8,23,0.35);font-size:10px;font-weight:700;color:#020617;">${label}</div>`,
    'leaflet-locality-marker',
    [32, 32],
    [16, 16],
  );

const hubMarkerIcon = () =>
  divMarkerIcon(
    '<div style="display:flex;align-items:center;justify-content:center;min-width:46px;height:28px;padding:0 10px;border-radius:14px;border:1px solid rgba(255,255,255,0.82);background:#67e8f9;color:#082f49;font-size:10px;font-weight:700;letter-spacing:0.08em;box-shadow:0 10px 24px rgba(2,8,23,0.3);">HUB</div>',
    'leaflet-hub-marker',
    [46, 28],
    [23, 14],
  );

const hospitalMarkerIcon = (color: string) =>
  divMarkerIcon(
    `<div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;border:3px solid white;background:${color};box-shadow:0 10px 24px rgba(2,8,23,0.32);"></div>`,
    'leaflet-hospital-marker',
    [22, 22],
    [11, 11],
  );

const fleetMarkerIcon = (service: string) => {
  const Icon = iconForService(service);
  return divMarkerIcon(
    renderToStaticMarkup(
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.82)',
          background: servicePalette[service] ?? '#e2e8f0',
          boxShadow: '0 10px 24px rgba(2,8,23,0.35)',
        }}
      >
        <Icon size={16} color="#020617" />
      </div>,
    ),
    'leaflet-fleet-marker',
    [32, 32],
    [16, 16],
  );
};

function MapViewport({ center }: { center: LatLng }) {
  const map = useMap();
  map.setView(center, 11.5, { animate: true });
  return null;
}

function InfoContent({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle: string;
  body: string;
}) {
  return (
    <div className="max-w-[240px] text-slate-900">
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="text-xs font-medium text-slate-600">{subtitle}</p>
      <p className="mt-1 text-xs">{body}</p>
    </div>
  );
}

export const Map: React.FC = () => {
  const {
    settings,
    localities,
    hospitals,
    hubs,
    routes,
    missions,
    fleet,
    selectedLocalityId,
    selectLocality,
    aiBriefing,
    stressReport,
    selectedStressTimelineId,
    selectedStressDecisionId,
  } = useStore();

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const selectedLocality = localities.find((item) => item.id === selectedLocalityId) ?? localities[0];
  const selectedMissions = missions.filter((mission) => mission.localityId === selectedLocality.id);
  const selectedFleet = fleet.filter((unit) => unit.localityId === selectedLocality.id);
  const selectedTimeline = stressReport.timeline.find((item) => item.id === selectedStressTimelineId);
  const selectedDecision = stressReport.decisions.find((item) => item.id === selectedStressDecisionId);
  const activeLocalityIds = new Set([...(selectedTimeline?.localityIds ?? []), ...(selectedDecision?.localityIds ?? [])]);
  const activeRouteIds = new Set([...(selectedTimeline?.routeIds ?? []), ...(selectedDecision?.routeIds ?? [])]);
  const activeHospitalIds = new Set([...(selectedTimeline?.hospitalIds ?? []), ...(selectedDecision?.hospitalIds ?? [])]);

  const localityLookup = useMemo(
    () => new globalThis.Map(localities.map((locality) => [locality.id, REAL_LOCALITY_COORDS[locality.id] ?? mapPointToBengaluru(locality.position)])),
    [localities],
  );
  const hospitalLookup = useMemo(
    () => new globalThis.Map(hospitals.map((hospital) => [hospital.id, REAL_HOSPITAL_COORDS[hospital.id] ?? mapPointToBengaluru(hospital.position)])),
    [hospitals],
  );
  const hubLookup = useMemo(
    () => new globalThis.Map(hubs.map((hub) => [hub.id, REAL_HUB_COORDS[hub.id] ?? mapPointToBengaluru(hub.position)])),
    [hubs],
  );

  const center = useMemo(
    () => localityLookup.get(selectedLocality.id) ?? { lat: 12.9716, lng: 77.5946 },
    [localityLookup, selectedLocality.id],
  );

  return (
    <div className="map-shell relative overflow-hidden rounded-[28px] border border-white/10 lg:rounded-[36px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.12),transparent_28%)]" />

      <div className="relative h-[420px] sm:h-[520px] lg:h-[860px]">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={11.5}
          scrollWheelZoom
          className="h-full w-full"
        >
          <MapViewport center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routes.map((route) => {
            const from = localityLookup.get(route.from);
            const to = localityLookup.get(route.to);
            if (!from || !to) {
              return null;
            }

            const routePath = routePathFor(route.id, from, to);

            return (
              <Polyline
                key={route.id}
                positions={routePath.map((point) => [point.lat, point.lng])}
                pathOptions={{
                  color: routeColor(route.status),
                  weight: activeRouteIds.has(route.id) ? 6 : route.status === 'blocked' ? 5 : 4,
                  opacity: activeRouteIds.size === 0 || activeRouteIds.has(route.id) ? 0.95 : 0.32,
                }}
              />
            );
          })}

          {missions.slice(0, 20).map((mission) => {
            const start = hubLookup.get(mission.originId);
            const end = localityLookup.get(mission.localityId);
            if (!start || !end) {
              return null;
            }

            const missionRoute = [
              start,
              interpolatePoint(start, end, 0.28),
              interpolatePoint(start, end, 0.62),
              end,
            ];

            return (
              <Polyline
                key={mission.id}
                positions={missionRoute.map((point) => [point.lat, point.lng])}
                pathOptions={{
                  color: servicePalette[mission.service] ?? '#e2e8f0',
                  weight: mission.priority === 'critical' ? 3.5 : 2,
                  opacity: mission.priority === 'critical' ? 0.95 : 0.55,
                }}
              />
            );
          })}

          {localities.map((locality) => {
            const position = localityLookup.get(locality.id);
            if (!position) {
              return null;
            }

            const tone = activeLocalityIds.has(locality.id)
              ? '#38bdf8'
              : locality.supportPressure === 'critical'
                ? '#fb7185'
                : locality.supportPressure === 'strained'
                  ? '#fb923c'
                  : '#4ade80';

            return (
              <React.Fragment key={locality.id}>
                <Circle
                  center={[position.lat, position.lng]}
                  radius={riskRadiusMeters(locality.riskScore)}
                  pathOptions={{
                    color: tone,
                    fillColor: tone,
                    fillOpacity: activeLocalityIds.has(locality.id) ? 0.2 : 0.12,
                    opacity: 0.75,
                    weight: 2,
                  }}
                />
                <Marker
                  position={[position.lat, position.lng]}
                  icon={localityMarkerIcon(tone, String(Math.round(locality.riskScore / 10)))}
                  eventHandlers={{
                    click: () => {
                      selectLocality(locality.id);
                      setActiveMarkerId(`locality-${locality.id}`);
                    },
                  }}
                >
                  {activeMarkerId === `locality-${locality.id}` ? (
                    <Popup
                      closeButton
                      eventHandlers={{
                        remove: () => setActiveMarkerId(null),
                      }}
                    >
                      <InfoContent
                        title={locality.name}
                        subtitle={`${locality.zone} Bengaluru`}
                        body={`Risk ${locality.riskScore}% • accessibility ${locality.accessibility}% • affected ${locality.affectedPopulation.toLocaleString()}`}
                      />
                    </Popup>
                  ) : null}
                </Marker>
              </React.Fragment>
            );
          })}

          {hospitals.map((hospital) => {
            const position = hospitalLookup.get(hospital.id);
            if (!position) {
              return null;
            }

            const color = activeHospitalIds.has(hospital.id)
              ? '#38bdf8'
              : hospital.status === 'critical'
                ? '#ef4444'
                : hospital.status === 'surge'
                  ? '#f97316'
                  : '#22c55e';

            return (
              <Marker
                key={hospital.id}
                position={[position.lat, position.lng]}
                icon={hospitalMarkerIcon(color)}
                eventHandlers={{
                  click: () => setActiveMarkerId(`hospital-${hospital.id}`),
                }}
              >
                {activeMarkerId === `hospital-${hospital.id}` ? (
                  <Popup eventHandlers={{ remove: () => setActiveMarkerId(null) }}>
                    <InfoContent
                      title={hospital.name}
                      subtitle={`Hospital • ${hospital.status}`}
                      body={`Occupancy ${hospital.occupancy}% • medicine ${hospital.medicineStock}% • incoming ${hospital.incomingPatients}`}
                    />
                  </Popup>
                ) : null}
              </Marker>
            );
          })}

          {hubs.map((hub) => {
            const position = hubLookup.get(hub.id);
            if (!position) {
              return null;
            }

            return (
              <Marker
                key={hub.id}
                position={[position.lat, position.lng]}
                icon={hubMarkerIcon()}
                eventHandlers={{
                  click: () => setActiveMarkerId(`hub-${hub.id}`),
                }}
              >
                {activeMarkerId === `hub-${hub.id}` ? (
                  <Popup eventHandlers={{ remove: () => setActiveMarkerId(null) }}>
                    <InfoContent
                      title={hub.name}
                      subtitle="Relief Hub"
                      body={`Stock ${hub.stock} • fleet ${hub.fleet}`}
                    />
                  </Popup>
                ) : null}
              </Marker>
            );
          })}

          {fleet.map((unit) => {
            const hub = hubs.find((item) => item.id === (missions.find((mission) => mission.service === unit.service && mission.localityId === unit.localityId)?.originId ?? ''));
            const locality = localities.find((item) => item.id === unit.localityId);
            const realHub = hub ? hubLookup.get(hub.id) : null;
            const realLocality = locality ? localityLookup.get(locality.id) : null;
            const sourceHubPoint = hub?.position;
            const sourceLocalityPoint = locality?.position;

            const position =
              realHub && realLocality && sourceHubPoint && sourceLocalityPoint
                ? interpolatePoint(
                    realHub,
                    realLocality,
                    progressBetween(sourceHubPoint, sourceLocalityPoint, unit.position),
                  )
                : mapPointToBengaluru(unit.position);

            return (
              <Marker
                key={unit.id}
                position={[position.lat, position.lng]}
                icon={fleetMarkerIcon(unit.service)}
                eventHandlers={{
                  click: () => setActiveMarkerId(`fleet-${unit.id}`),
                }}
              >
                {activeMarkerId === `fleet-${unit.id}` ? (
                  <Popup eventHandlers={{ remove: () => setActiveMarkerId(null) }}>
                    <InfoContent
                      title={unit.name}
                      subtitle={`${unit.service} • ${unit.status}`}
                      body={`Readiness ${unit.readiness}% • fuel/battery ${unit.batteryOrFuel}% • ETA ${unit.etaMinutes}m`}
                    />
                  </Popup>
                ) : null}
              </Marker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-gradient-to-b from-slate-950/70 via-slate-950/20 to-transparent p-4 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl rounded-2xl border border-white/10 bg-slate-950/78 px-4 py-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.36em] text-cyan-200/80">Live Bengaluru street map</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Disaster management simulation on OpenStreetMap</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{aiBriefing.summary}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/78 px-4 py-3 text-sm text-slate-200 backdrop-blur-xl">
                Mode: <span className="font-semibold text-white">{settings.disasterMode}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/78 px-4 py-3 text-sm text-slate-200 backdrop-blur-xl">
                Focus: <span className="font-semibold text-white">{selectedLocality.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-4 bottom-4 z-[500] hidden flex-wrap gap-3 lg:left-6 lg:bottom-6 lg:flex">
          <div className="legend-chip"><Waves className="h-4 w-4 text-cyan-300" /><span>Flood/risk radius</span></div>
          <div className="legend-chip"><Building2 className="h-4 w-4 text-emerald-300" /><span>Hospitals</span></div>
          <div className="legend-chip"><Ambulance className="h-4 w-4 text-rose-300" /><span>Ambulance flow</span></div>
          <div className="legend-chip"><Plane className="h-4 w-4 text-sky-300" /><span>Drone sorties</span></div>
          <div className="legend-chip"><Package className="h-4 w-4 text-yellow-300" /><span>Food convoys</span></div>
          <div className="legend-chip"><Zap className="h-4 w-4 text-emerald-300" /><span>Utility restore</span></div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-white/8 bg-slate-950/70 p-4 lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
        <div className="grid gap-4">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/82 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.36em] text-cyan-200/80">OpenStreetMap mode</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Bengaluru street operations</h3>
              </div>
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                {aiBriefing.confidence}% confidence
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The simulation engine still drives the scenario, but the map now runs on OpenStreetMap tiles and Leaflet overlays for a simpler, key-free local development flow.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/82 p-4 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Selected locality</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{selectedLocality.name}</h3>
            <p className="mt-1 text-sm text-slate-300">{selectedLocality.zone} Bengaluru</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Risk: <span className="font-semibold text-white">{selectedLocality.riskScore}%</span></p>
              <p>Accessibility: <span className="font-semibold text-white">{selectedLocality.accessibility}%</span></p>
              <p>Affected population: <span className="font-semibold text-white">{selectedLocality.affectedPopulation.toLocaleString()}</span></p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/82 p-4 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Active response</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{selectedMissions.length} mission threads</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Fleet units nearby: <span className="font-semibold text-white">{selectedFleet.length}</span></p>
              <p>Critical routes highlighted: <span className="font-semibold text-white">{activeRouteIds.size || routes.filter((route) => route.status !== 'open').length}</span></p>
              <p>Hospitals in focus: <span className="font-semibold text-white">{activeHospitalIds.size || selectedLocality.hospitalIds.length}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
