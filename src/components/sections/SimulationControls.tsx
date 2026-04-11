import { Activity, Flame, Orbit, Package, RotateCcw, Waves } from 'lucide-react';
import { SimulationSettings } from '../../store/useStore';
import { INDIA_SCENARIO_CUSTOM_ID, getIndiaScenarioPreset, indiaScenarioPresets } from '../../store/indiaScenarioPresets';
import { GlassCard } from '../ui/GlassCard';
import { SliderControl } from '../ui/SliderControl';

export function SimulationControls({
  settings,
  localityOptions,
  onReset,
  onLocalityChange,
  onModeChange,
  onSimulationChange,
}: {
  settings: SimulationSettings;
  localityOptions: Array<{ id: string; name: string }>;
  onReset: () => void;
  onLocalityChange: (value: string) => void;
  onModeChange: (value: SimulationSettings['disasterMode']) => void;
  onSimulationChange: (patch: Partial<SimulationSettings>) => void;
}) {
  const activePreset = getIndiaScenarioPreset(settings.scenarioPresetId);

  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Simulation controls</p>
          <h2 className="mt-1 text-lg font-semibold">Area-wise calamity tuning</h2>
        </div>
        <button onClick={onReset} className="ghost-button">
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      <label className="field-label" htmlFor="locality-focus">Bengaluru locality</label>
      <select
        id="locality-focus"
        className="input-surface"
        value={settings.localityFocus}
        onChange={(event) => onLocalityChange(event.target.value)}
      >
        {localityOptions.map((locality) => (
          <option key={locality.id} value={locality.id}>{locality.name}</option>
        ))}
      </select>

      <label className="field-label mt-4" htmlFor="mode">Natural calamity mode</label>
      <select
        id="mode"
        className="input-surface"
        value={settings.disasterMode}
        onChange={(event) => onModeChange(event.target.value as SimulationSettings['disasterMode'])}
      >
        <option value="compound">Compound AI response</option>
        <option value="flood">Flood</option>
        <option value="earthquake">Earthquake</option>
        <option value="storm">Storm</option>
        <option value="heatwave">Heatwave</option>
      </select>

      <label className="field-label mt-4" htmlFor="india-preset">India past-disaster preset (inspired)</label>
      <select
        id="india-preset"
        className="input-surface"
        value={settings.scenarioPresetId}
        onChange={(event) => {
          const presetId = event.target.value;
          if (presetId === INDIA_SCENARIO_CUSTOM_ID) {
            onSimulationChange({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID });
            return;
          }

          const preset = getIndiaScenarioPreset(presetId);
          if (!preset) {
            onSimulationChange({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID });
            return;
          }

          onSimulationChange({ scenarioPresetId: preset.id, ...preset.patch });
        }}
      >
        <option value={INDIA_SCENARIO_CUSTOM_ID}>Custom (manual sliders)</option>
        {indiaScenarioPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>{preset.title}</option>
        ))}
      </select>
      {activePreset && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
          <p className="font-semibold text-slate-200">{activePreset.judgeNote}</p>
          <p className="mt-1">{activePreset.inspiredBy}</p>
          <p className="mt-1 text-xs text-slate-400">Note: This is a demo stress test, not an event reconstruction.</p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <SliderControl icon={<Waves className="h-4 w-4 text-cyan-300" />} label="Flood / water level" value={settings.waterLevel} onChange={(value) => onSimulationChange({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, waterLevel: value })} />
        <SliderControl icon={<Orbit className="h-4 w-4 text-orange-300" />} label="Earthquake intensity" value={settings.earthquakeLevel} onChange={(value) => onSimulationChange({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, earthquakeLevel: value })} />
        <SliderControl icon={<Activity className="h-4 w-4 text-sky-300" />} label="Storm disruption" value={settings.stormLevel} onChange={(value) => onSimulationChange({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, stormLevel: value })} />
        <SliderControl icon={<Flame className="h-4 w-4 text-amber-300" />} label="Heat pressure" value={settings.heatLevel} onChange={(value) => onSimulationChange({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, heatLevel: value })} />
        <SliderControl icon={<Package className="h-4 w-4 text-emerald-300" />} label="Reserve inventory" value={settings.medicineBuffer} onChange={(value) => onSimulationChange({ scenarioPresetId: INDIA_SCENARIO_CUSTOM_ID, medicineBuffer: value })} />
      </div>
    </GlassCard>
  );
}
