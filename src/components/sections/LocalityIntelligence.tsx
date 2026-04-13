import { Ambulance, Building2, LocateFixed, Orbit, Package, Plane, Shield, Waves, Zap } from 'lucide-react';
import { FleetUnit, HospitalStatus, LocalityStatus, RouteStatus, TimelineEvent } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';
import { InfoTile } from '../ui/InfoTile';
import { Timeline } from '../ui/Timeline';

export function LocalityIntelligence({
  locality,
  hospitals,
  fleet,
  routes,
  timeline,
}: {
  locality: LocalityStatus;
  hospitals: HospitalStatus[];
  fleet: FleetUnit[];
  routes: RouteStatus[];
  timeline: TimelineEvent[];
}) {
  return (
    <div className="space-y-4">
      <section>
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Locality command brief</p>
        <h2 className="mt-2 text-[30px] font-semibold">{locality.name}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The AI layer estimates {Intl.NumberFormat('en-IN').format(locality.affectedPopulation)} people under pressure, with hospital intake, food support, and evacuation planning recalculated every time the disaster controls move.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <InfoTile icon={<LocateFixed className="h-4 w-4 text-cyan-300" />} label="Zone" value={locality.zone} />
        <InfoTile icon={<Waves className="h-4 w-4 text-cyan-300" />} label="Water" value={`${locality.waterDepth} cm`} />
        <InfoTile icon={<Orbit className="h-4 w-4 text-orange-300" />} label="Quake" value={`${locality.quakeDamage}%`} />
        <InfoTile icon={<Package className="h-4 w-4 text-yellow-300" />} label="Food demand" value={`${locality.foodDemand}`} />
        <InfoTile icon={<Ambulance className="h-4 w-4 text-rose-300" />} label="Rescue demand" value={`${locality.rescueDemand}`} />
        <InfoTile icon={<Shield className="h-4 w-4 text-emerald-300" />} label="Evac load" value={`${locality.evacDemand}`} />
      </section>

      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <h3 className="text-lg font-semibold">Hospital network</h3>
        </div>
        <div className="mt-3 space-y-3">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="sub-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{hospital.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{hospital.capacity} beds</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  hospital.status === 'critical'
                    ? 'bg-rose-500/15 text-rose-100'
                    : hospital.status === 'surge'
                      ? 'bg-orange-500/15 text-orange-100'
                      : 'bg-emerald-500/15 text-emerald-100'
                }`}>
                  {hospital.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
                <span>Occ {hospital.occupancy}%</span>
                <span>Med {hospital.medicineStock}%</span>
                <span>Power {hospital.powerBackup}%</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-slate-400" />
          <h3 className="text-lg font-semibold">Fleet and route intelligence</h3>
        </div>
        <div className="mt-3 space-y-3">
          {fleet.map((unit) => (
            <div key={unit.id} className="sub-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{unit.name}</p>
                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  unit.status === 'critical'
                    ? 'bg-rose-500/15 text-rose-100'
                    : unit.status === 'moving'
                      ? 'bg-sky-500/15 text-sky-100'
                      : 'bg-slate-500/20 text-slate-200'
                }`}>
                  {unit.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
                <span>Ready {unit.readiness}%</span>
                <span>Fuel {unit.batteryOrFuel}%</span>
                <span>ETA {unit.etaMinutes || 0}m</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {routes.map((route) => (
            <div key={route.id} className="sub-surface px-4 py-3 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3">
                <span>{route.name}</span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                  route.status === 'blocked'
                    ? 'bg-rose-500/15 text-rose-100'
                    : route.status === 'restricted'
                      ? 'bg-orange-500/15 text-orange-100'
                      : route.status === 'slow'
                        ? 'bg-yellow-500/15 text-yellow-100'
                        : 'bg-emerald-500/15 text-emerald-100'
                }`}>
                  {route.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-slate-400" />
          <h3 className="text-lg font-semibold">Command timeline</h3>
        </div>
        <div className="mt-3">
          <Timeline items={timeline} />
        </div>
      </GlassCard>
    </div>
  );
}
