import type { ReactNode } from 'react';
import { Building2, Plane, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { HospitalStatus } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';

export function HospitalOperationsView({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}: {
  hospitals: HospitalStatus[];
  selectedHospitalId: string;
  onSelectHospital: (id: string) => void;
}) {
  const selected = hospitals.find((item) => item.id === selectedHospitalId) ?? hospitals[0];

  return (
    <GlassCard className="panel-surface rounded-[30px] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-emerald-300" />
        <h3 className="text-xl font-semibold">Hospital operations view</h3>
      </div>

      <label className="field-label mt-3" htmlFor="hospital-view">View hospital</label>
      <select
        id="hospital-view"
        className="input-surface"
        value={selected.id}
        onChange={(event) => onSelectHospital(event.target.value)}
      >
        {hospitals.map((hospital) => (
          <option key={hospital.id} value={hospital.id}>
            {hospital.name}
          </option>
        ))}
      </select>

      <div className="mt-3 rounded-[24px] border border-white/10 bg-white/5 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-white">{selected.name}</h4>
            <p className="mt-0.5 text-sm text-slate-300">{selected.currentPatients} people currently inside care flow</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
            selected.status === 'critical'
              ? 'bg-rose-500/15 text-rose-100'
              : selected.status === 'surge'
                ? 'bg-orange-500/15 text-orange-100'
                : 'bg-emerald-500/15 text-emerald-100'
          }`}>
            {selected.status}
          </span>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          <MiniStat icon={<Users className="h-4 w-4 text-cyan-300" />} label="Incoming people" value={String(selected.incomingPatients)} />
          <MiniStat icon={<Users className="h-4 w-4 text-slate-300" />} label="Outgoing people" value={String(selected.outgoingPatients)} />
          <MiniStat icon={<Plane className="h-4 w-4 text-sky-300" />} label="Drone inbound" value={String(selected.droneInbound)} />
          <MiniStat icon={<Building2 className="h-4 w-4 text-emerald-300" />} label="Food stock" value={`${selected.foodStock}%`} />
          <MiniStat icon={<Building2 className="h-4 w-4 text-amber-300" />} label="Medicine stock" value={`${selected.medicineStock}%`} />
          <MiniStat icon={<Building2 className="h-4 w-4 text-rose-300" />} label="Rescue assigned" value={String(selected.rescueTeamsAssigned)} />
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
          {selected.autoOrderEtaMinutes !== null ? (
            <p>Automatic ordering is active. Replenishment ETA is {selected.autoOrderEtaMinutes} minutes.</p>
          ) : (
            <p>Automatic ordering is on standby. Current stock levels are above the emergency reorder threshold.</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-slate-950/50 p-2.5">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
