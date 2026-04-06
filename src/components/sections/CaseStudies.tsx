import { GlassCard } from '../ui/GlassCard';

const caseStudies = [
  {
    year: '2018',
    title: 'Kerala Floods',
    headline: 'Submerged Supply Chains: Coordinating 2,400+ Relief Missions',
    metrics: '89% faster dispatch, 34% lower delivery time',
    insight: 'Predictive flooding models highlighted the highest-risk logistics corridors well before major isolation.',
  },
  {
    year: '2020',
    title: 'Bangalore Civil Unrest',
    headline: 'Urban Lockdown: Maintaining Critical Medical Supply Lines',
    metrics: 'Zero hospital stockouts, 156 alternate routes',
    insight: 'Dynamic rerouting kept medicine and trauma support flowing around disruption hotspots.',
  },
  {
    year: '2021',
    title: 'Cyclone Tauktae',
    headline: 'Eye of the Storm: Drone Operations in Category 4 Conditions',
    metrics: '47 drone drops, 100% payload integrity',
    insight: 'Autonomous path adjustments preserved medical deliveries through extreme wind corridors.',
  },
  {
    year: '2023',
    title: 'Chennai Floods',
    headline: '72 Hours Ahead: Predictive Resource Prepositioning',
    metrics: '62% inventory pre-staged, major loss prevention',
    insight: 'Scenario modeling pinpointed high-risk localities before field saturation began.',
  },
];

export function CaseStudies() {
  return (
    <GlassCard className="panel-surface rounded-[30px] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Proven Impact</p>
          <h3 className="mt-2 text-xl font-semibold">Historical disaster case studies</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
          Demo content
        </span>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {caseStudies.map((item) => (
          <article key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-sky-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-sky-100">{item.year}</span>
              <span className="text-xs text-slate-400">{item.title}</span>
            </div>
            <h4 className="mt-3 text-lg font-semibold text-white">{item.headline}</h4>
            <p className="mt-3 text-sm text-emerald-200">{item.metrics}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.insight}</p>
          </article>
        ))}
      </div>
    </GlassCard>
  );
}
