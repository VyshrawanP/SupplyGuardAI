import React from 'react';
import {
  Ambulance,
  Building2,
  CircleDashed,
  Package,
  Plane,
  ShieldPlus,
  TriangleAlert,
  Waves,
  Zap,
} from 'lucide-react';
import { useStore } from '../store/useStore';

const servicePalette: Record<string, string> = {
  ambulance: 'rgba(248, 113, 113, 0.95)',
  drone: 'rgba(56, 189, 248, 0.95)',
  food: 'rgba(250, 204, 21, 0.92)',
  rescue: 'rgba(251, 146, 60, 0.95)',
  evacuation: 'rgba(196, 181, 253, 0.95)',
  utility: 'rgba(52, 211, 153, 0.95)',
};

const routeColor = (status: string) => {
  if (status === 'blocked') {
    return 'rgba(248, 113, 113, 0.9)';
  }
  if (status === 'restricted') {
    return 'rgba(251, 146, 60, 0.9)';
  }
  if (status === 'slow') {
    return 'rgba(250, 204, 21, 0.85)';
  }
  return 'rgba(96, 165, 250, 0.78)';
};

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

  const selectedLocality = localities.find((item) => item.id === selectedLocalityId) ?? localities[0];
  const selectedMissions = missions.filter((mission) => mission.localityId === selectedLocality.id);
  const selectedFleet = fleet.filter((unit) => unit.localityId === selectedLocality.id);
  const selectedTimeline = stressReport.timeline.find((item) => item.id === selectedStressTimelineId);
  const selectedDecision = stressReport.decisions.find((item) => item.id === selectedStressDecisionId);
  const activeLocalityIds = new Set([...(selectedTimeline?.localityIds ?? []), ...(selectedDecision?.localityIds ?? [])]);
  const activeRouteIds = new Set([...(selectedTimeline?.routeIds ?? []), ...(selectedDecision?.routeIds ?? [])]);
  const activeHospitalIds = new Set([...(selectedTimeline?.hospitalIds ?? []), ...(selectedDecision?.hospitalIds ?? [])]);

  const findLocality = (id: string) => localities.find((item) => item.id === id);

  return (
    <div className="map-shell relative overflow-hidden rounded-[28px] border border-white/10 lg:rounded-[36px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_30%,rgba(255,255,255,0.02))]" />

      <div className="relative h-[420px] sm:h-[520px] lg:h-[860px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="cityFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,197,94,0.08)" />
            <stop offset="45%" stopColor="rgba(56,189,248,0.16)" />
            <stop offset="100%" stopColor="rgba(251,146,60,0.08)" />
          </linearGradient>
          <pattern id="map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.18" />
          </pattern>
          <pattern id="terrain" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 0 7 Q 3 4 7 7 T 14 7" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.24" />
          </pattern>
        </defs>

        <rect width="100" height="100" fill="url(#map-grid)" />
        <rect width="100" height="100" fill="url(#terrain)" />
        <path
          d="M14,18 L29,8 L53,10 L71,16 L84,29 L90,49 L83,74 L67,90 L42,93 L24,86 L12,68 L9,44 Z"
          fill="url(#cityFill)"
          stroke="rgba(125,211,252,0.4)"
          strokeWidth="0.45"
        />
        <path d="M15,18 L30,15 L46,17 L59,15 L74,20 L83,31 L86,45 L81,58 L75,69 L64,82 L47,88 L28,84 L17,73 L13,59 L12,42 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.35" />
        <path d="M22,24 L35,22 L47,25 L61,22 L73,27 L78,39 L76,51 L67,62 L54,70 L37,69 L24,62 L18,51 L19,38 Z" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.28" />
        <path d="M8,36 C18,35 25,40 32,45 C42,52 50,55 59,53 C69,50 78,54 91,63" fill="none" stroke="rgba(34,197,94,0.16)" strokeWidth="0.8" />
        <path d="M10,61 C21,57 29,62 39,68 C49,74 59,74 70,70 C79,66 86,67 92,70" fill="none" stroke="rgba(56,189,248,0.12)" strokeWidth="0.6" />
        <path d="M61,78 C66,73 68,66 66,58 C64,50 67,44 74,39 C78,36 80,30 80,24" fill="none" stroke="rgba(56,189,248,0.22)" strokeWidth="1.2" />
        <path d="M24,18 C26,27 29,33 34,39" fill="none" stroke="rgba(56,189,248,0.18)" strokeWidth="0.9" />
        <path d="M18,27 C35,30 56,30 79,22" stroke="rgba(255,255,255,0.08)" strokeWidth="0.9" fill="none" strokeDasharray="2 2" />
        <path d="M17,48 C42,41 56,48 80,59" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" strokeDasharray="2 2" />
        <path d="M28,84 C34,66 44,41 58,14" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" fill="none" strokeDasharray="2 3" />
        <path d="M18,19 L22,19 L24,17 L29,16 L33,14 L37,15 L42,15 L48,14 L55,14 L60,16 L67,17 L73,19 L78,24 L82,28 L84,33" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.25" />

        {routes.map((route) => {
          const from = findLocality(route.from);
          const to = findLocality(route.to);
          if (!from || !to) {
            return null;
          }
          return (
            <path
              key={route.id}
              d={`M ${from.position.lng} ${from.position.lat} Q ${(from.position.lng + to.position.lng) / 2} ${((from.position.lat + to.position.lat) / 2) - 4} ${to.position.lng} ${to.position.lat}`}
              stroke={routeColor(route.status)}
              strokeWidth={activeRouteIds.has(route.id) ? '2.2' : route.status === 'blocked' ? '1.8' : '1.3'}
              fill="none"
              strokeDasharray={route.status === 'open' ? '0' : '3 2'}
              strokeOpacity={activeRouteIds.size === 0 || activeRouteIds.has(route.id) ? 1 : 0.28}
            />
          );
        })}

        {missions.slice(0, 20).map((mission) => {
          const locality = findLocality(mission.localityId);
          const hub = hubs.find((item) => item.id === mission.originId);
          if (!locality || !hub) {
            return null;
          }
          const motionPath = `M ${hub.position.lng} ${hub.position.lat} C ${hub.position.lng + 8} ${hub.position.lat - 6}, ${locality.position.lng - 6} ${locality.position.lat + 6}, ${locality.position.lng} ${locality.position.lat}`;
          return (
            <g key={mission.id}>
              <path
                d={motionPath}
                stroke={servicePalette[mission.service]}
                strokeWidth="0.9"
                fill="none"
                strokeOpacity="0.72"
                strokeDasharray="2.5 2"
              />
              <circle r={mission.service === 'drone' ? '0.6' : '0.75'} fill={servicePalette[mission.service]} opacity="0.95">
                <animateMotion dur={`${Math.max(4, Math.min(14, mission.etaMinutes / 5))}s`} repeatCount="indefinite" rotate="auto">
                  <mpath href={`#motion-${mission.id}`} />
                </animateMotion>
              </circle>
              <path id={`motion-${mission.id}`} d={motionPath} fill="none" stroke="none" />
            </g>
          );
        })}

        {localities.map((locality) => (
          <g key={locality.id} onClick={() => selectLocality(locality.id)} className="cursor-pointer">
            <circle
              cx={locality.position.lng}
              cy={locality.position.lat}
              r={Math.max(4, locality.riskScore / 17)}
              fill={activeLocalityIds.has(locality.id)
                ? 'rgba(56,189,248,0.28)'
                : locality.supportPressure === 'critical'
                  ? 'rgba(248,113,113,0.24)'
                  : locality.supportPressure === 'strained'
                    ? 'rgba(251,146,60,0.18)'
                    : 'rgba(74,222,128,0.14)'}
            />
            <circle
              cx={locality.position.lng}
              cy={locality.position.lat}
              r={locality.id === selectedLocality.id ? 2.5 : 1.8}
              fill={locality.supportPressure === 'critical' ? 'rgba(251,113,133,0.95)' : locality.supportPressure === 'strained' ? 'rgba(251,146,60,0.95)' : 'rgba(74,222,128,0.95)'}
              stroke="rgba(255,255,255,0.92)"
              strokeWidth="0.35"
            />
          </g>
        ))}

        {hospitals.map((hospital) => (
          <g key={hospital.id}>
            <rect
              x={hospital.position.lng - 1.1}
              y={hospital.position.lat - 1.1}
              width="2.2"
              height="2.2"
              rx="0.48"
              fill="rgba(255,255,255,0.88)"
              opacity={activeHospitalIds.size === 0 || activeHospitalIds.has(hospital.id) ? 1 : 0.35}
            />
            <path
              d={`M ${hospital.position.lng} ${hospital.position.lat - 1.9} L ${hospital.position.lng} ${hospital.position.lat + 1.9} M ${hospital.position.lng - 1.9} ${hospital.position.lat} L ${hospital.position.lng + 1.9} ${hospital.position.lat}`}
              stroke={activeHospitalIds.has(hospital.id)
                ? 'rgba(56,189,248,0.95)'
                : hospital.status === 'critical'
                  ? 'rgba(248,113,113,0.95)'
                  : hospital.status === 'surge'
                    ? 'rgba(251,146,60,0.95)'
                    : 'rgba(74,222,128,0.92)'}
              strokeWidth={activeHospitalIds.has(hospital.id) ? '0.7' : '0.45'}
            />
          </g>
        ))}

        {hubs.map((hub) => (
          <polygon
            key={hub.id}
            points={`${hub.position.lng},${hub.position.lat - 1.8} ${hub.position.lng + 1.8},${hub.position.lat} ${hub.position.lng},${hub.position.lat + 1.8} ${hub.position.lng - 1.8},${hub.position.lat}`}
            fill="rgba(125,211,252,0.95)"
          />
        ))}

        {fleet.map((unit) => (
          <circle
            key={unit.id}
            cx={unit.position.lng}
            cy={unit.position.lat}
            r={unit.service === 'drone' ? 0.9 : 1.1}
            fill={servicePalette[unit.service]}
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="0.24"
          />
        ))}
      </svg>

      <div className="absolute left-4 bottom-4 z-20 hidden flex-wrap gap-3 lg:left-6 lg:bottom-6 lg:flex">
        <div className="legend-chip"><Waves className="h-4 w-4 text-cyan-300" /><span>Flood layer</span></div>
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
                <p className="text-[11px] uppercase tracking-[0.36em] text-cyan-200/80">NEOFETCH by Vyshrawan Abul</p>
                <h3 className="mt-2 text-xl font-semibold text-white">AI disaster command surface for Bengaluru</h3>
              </div>
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                {aiBriefing.confidence}% confidence
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{aiBriefing.summary}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="legend-chip"><Waves className="h-4 w-4 text-cyan-300" /><span>Flood layer</span></div>
              <div className="legend-chip"><Building2 className="h-4 w-4 text-emerald-300" /><span>Hospitals</span></div>
              <div className="legend-chip"><Ambulance className="h-4 w-4 text-rose-300" /><span>Ambulance flow</span></div>
              <div className="legend-chip"><Plane className="h-4 w-4 text-sky-300" /><span>Drone sorties</span></div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/82 p-4 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Selected locality</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{selectedLocality.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{selectedLocality.zone} Bengaluru</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  selectedLocality.supportPressure === 'critical'
                    ? 'bg-rose-500/15 text-rose-100'
                    : selectedLocality.supportPressure === 'strained'
                      ? 'bg-orange-500/15 text-orange-100'
                      : 'bg-emerald-500/15 text-emerald-100'
                }`}>
                  {selectedLocality.supportPressure}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="map-stat"><span>Risk</span><strong>{selectedLocality.riskScore}%</strong></div>
                <div className="map-stat"><span>Access</span><strong>{selectedLocality.accessibility}%</strong></div>
                <div className="map-stat"><span>Water</span><strong>{selectedLocality.waterDepth} cm</strong></div>
                <div className="map-stat"><span>Evac</span><strong>{selectedLocality.evacDemand}</strong></div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Street-view style preview</p>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                  Offline mock
                </span>
              </div>
              <div className="street-preview mt-4">
                <div className="street-preview__sky" />
                <div className="street-preview__buildings" />
                <div className="street-preview__road" />
                <div className="street-preview__label">{selectedLocality.name} corridor</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/82 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <ShieldPlus className="h-4 w-4 text-cyan-300" />
              Live simulation stack
            </div>
            <div className="mt-4 space-y-3">
              {selectedMissions.slice(0, 4).map((mission) => (
                <div key={mission.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{mission.title}</p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      mission.priority === 'critical'
                        ? 'bg-rose-500/15 text-rose-100'
                        : mission.priority === 'priority'
                          ? 'bg-orange-500/15 text-orange-100'
                          : 'bg-slate-500/20 text-slate-200'
                    }`}>
                      {mission.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{mission.narrative}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/82 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <CircleDashed className="h-4 w-4 text-cyan-300" />
              Assets in motion
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedFleet.slice(0, 4).map((unit) => (
                <div key={unit.id} className="map-stat">
                  <span>{unit.name}</span>
                  <strong>{unit.etaMinutes ? `${unit.etaMinutes} min` : 'Standby'}</strong>
                  <small className="text-xs text-slate-400">{unit.status}</small>
                </div>
              ))}
            </div>
            {selectedFleet.length === 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                No moving units are attached to this locality right now. Increase severity to trigger more autonomous responses.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/82 p-4 text-xs text-slate-300 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="uppercase tracking-[0.2em] text-slate-400">Map context</span>
              <span>Mode {settings.disasterMode} | Water {settings.waterLevel}% | Quake {settings.earthquakeLevel}%</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-slate-500">Scale</span>
              <span className="h-px w-12 bg-white/60" />
              <span>5 km</span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white">N</span>
              <span>Animated mission paths</span>
            </div>
            <p className="mt-3 leading-6 text-slate-400">
              Increase flood or earthquake intensity and the system will immediately shift service allocations, route health, and hospital pressure across Bengaluru localities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
