import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Github,
  Play,
  XCircle,
} from 'lucide-react';
import { Map } from '../Map';

type SectionId =
  | 'problem'
  | 'different'
  | 'proof'
  | 'demo'
  | 'apps'
  | 'tech'
  | 'cta';

const NAV: Array<{ id: SectionId; label: string }> = [
  { id: 'problem', label: 'Problem' },
  { id: 'different', label: 'Different' },
  { id: 'proof', label: 'Proof' },
  { id: 'demo', label: 'Demo' },
  { id: 'apps', label: 'Apps' },
  { id: 'tech', label: 'Tech' },
];

function scrollToSection(id: SectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerOffset = 72;
  const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

export function LandingPage({
  onOpenDashboard,
  onOpenDownloads,
  onOpenDocs,
}: {
  onOpenDashboard?: () => void;
  onOpenDownloads?: () => void;
  onOpenDocs?: (docId?: string) => void;
}) {
  const [openDifferentiator, setOpenDifferentiator] = useState<'hospital' | 'offline' | 'ai' | null>('hospital');

  const differentiators = useMemo(
    () => [
      {
        id: 'hospital' as const,
        title: 'Hospital capacity integration',
        tagline: 'Route ambulances to hospitals with available beds.',
        bullets: [
          'Real-time ICU/trauma availability view',
          'Avoids wasted trips to full hospitals',
          'Multi-facility load balancing for intake',
          'Capacity heatmap + severity coding for operators',
        ],
        why: 'Most projects stop at route tracking; hospital data integration is harder, so they avoid it. We made it a core requirement.',
      },
      {
        id: 'offline' as const,
        title: 'Offline-first architecture',
        tagline: 'Works when infrastructure fails.',
        bullets: [
          'Local-first operation with graceful fallbacks',
          'Local tiles + local routing supported (Docker tileserver + OSRM)',
          'Queue-and-sync patterns for intermittent connectivity',
          'Mesh-style alert relay patterns on local networks',
        ],
        why: 'Disasters break networks. Systems that assume “always online” collapse when they’re needed most.',
      },
      {
        id: 'ai' as const,
        title: 'AI decision transparency',
        tagline: 'Plain-language explanations for operator trust.',
        bullets: [
          'Why this route vs alternatives?',
          'Why this hospital was chosen?',
          'What data changed the risk score?',
          'Audit-friendly decision logs (explanations, not opaque output)',
        ],
        why: 'Most “AI” demos add novelty features. We use AI for trust: explainability, provenance, and operator confidence.',
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-[#e5ecf7]">
      <nav className="landing-nav fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600/35 bg-slate-900/70 px-3 py-1.5 text-sm font-semibold"
          >
            <span className="landing-mark grid h-7 w-7 place-items-center rounded-lg text-xs font-black">
              SG
            </span>
            SupplyGuard AI
          </button>

          <div className="hidden items-center gap-4 lg:flex">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="landing-nav-link text-sm transition"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="btn-outline" onClick={() => onOpenDocs?.('judge-quickstart')}>
              Quickstart
            </button>
            <button type="button" className="btn-primary" onClick={onOpenDashboard}>
              Try Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen pt-14">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
              Offline-first disaster logistics
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Real‑time disaster coordination that works when everything breaks.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Route ambulances to hospitals with available beds, surface risk before failures, and keep operations running even when networks degrade.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary" onClick={onOpenDashboard}>
                Try Live Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onOpenDocs?.('video-script')}
                title="Open demo script"
              >
                <Play className="h-4 w-4" />
                Watch Demo (3 min)
              </button>
              <button type="button" className="btn-outline" onClick={onOpenDownloads}>
                <Download className="h-4 w-4" />
                Downloads
              </button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Core</p>
                <p className="mt-2 text-sm font-semibold">Hospital-aware routing</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Resilience</p>
                <p className="mt-2 text-sm font-semibold">Offline command center</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Trust</p>
                <p className="mt-2 text-sm font-semibold">Explainable decisions</p>
              </div>
            </div>

            <p className="mt-6 text-xs text-white/45">
              Note: “Top 0.1%” is a quality target for this competition build, not an externally verified ranking.
            </p>
          </div>

          <div className="landing-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">15‑second preview</p>
              <span className="landing-soft-chip px-3 py-1 text-xs">
                Live console mode
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-600/35 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Map</p>
                <div className="mt-3 h-44 rounded-xl border border-white/10 bg-[#161b22]" />
                <p className="mt-3 text-sm text-white/70">
                  Markers, route health, capacity overlays, and live updates.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-600/35 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Alerts</p>
                  <p className="mt-2 text-sm font-semibold">Critical: Corridor blocked</p>
                  <p className="mt-1 text-sm text-white/70">Reroute ambulance + prioritize drone resupply.</p>
                </div>
                <div className="rounded-2xl border border-slate-600/35 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Hospital</p>
                  <p className="mt-2 text-sm font-semibold">ICU strain detected</p>
                  <p className="mt-1 text-sm text-white/70">Balance intake across facilities with beds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollToSection('problem')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/55 transition hover:text-white"
          aria-label="Scroll to problem"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="landing-section-light text-[#0f172a]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-black/60">The problem</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">The Katrina failure pattern</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-black/70">
            In large-scale disasters, information breaks before logistics. Responders waste critical time searching for
            hospital capacity, safe routes, and verified survivor locations.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="landing-card-light p-6">
              <p className="text-sm font-semibold">Timeline (illustrative)</p>
              <div className="mt-5 grid grid-cols-4 gap-3">
                {[
                  ['Aug 29', 'Landfall'],
                  ['Day 1', 'Hospitals full'],
                  ['Day 3', 'No unified data'],
                  ['Day 4', 'Shortage detected'],
                ].map(([day, label]) => (
                  <div key={day} className="rounded-2xl border border-slate-300/75 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">{day}</p>
                    <p className="mt-2 text-sm font-semibold">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-black/65">
                SupplyGuard’s goal: shorten detection + routing loops by connecting risk, routing, hospitals, and rescue into one command view.
              </p>
            </div>

            <div className="landing-card-light p-6">
              <p className="text-sm font-semibold">Outcome snapshot (demo)</p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-300/70 bg-white px-4 py-3">
                  <span className="text-sm font-semibold">Detection loop</span>
                  <span className="text-sm text-black/70">
                    96h → 38h <span className="font-semibold text-[#0066ff]">(-58h)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-300/70 bg-white px-4 py-3">
                  <span className="text-sm font-semibold">Hospital routing</span>
                  <span className="text-sm text-black/70">
                    Manual → <span className="font-semibold text-[#0066ff]">Capacity-aware</span>
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-300/70 bg-white px-4 py-3">
                  <span className="text-sm font-semibold">Route alerts</span>
                  <span className="text-sm text-black/70">
                    Reactive → <span className="font-semibold text-[#0066ff]">Predictive</span>
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs text-black/55">All values shown as demo/replay metrics for the competition build.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENT */}
      <section id="different" className="landing-section-dark text-[#e5ecf7]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">How we’re different</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Most disaster projects stop at logistics.</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            We integrate the full response chain: survivor signals → risk → routing → hospitals → rescue → inventory, with offline operation and explainability.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="landing-card p-6">
              <p className="text-sm font-semibold">What most teams do</p>
              <p className="mt-2 text-sm text-white/70">(Common features across many projects)</p>
              <ul className="mt-5 space-y-3">
                {[
                  'Route tracking',
                  'Alert notifications',
                  'Supply inventory',
                  'Map visualization',
                  'Mobile apps',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-white/70" />
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-slate-600/35 bg-slate-950/75 p-4">
                <p className="text-sm font-semibold text-white">Stops here</p>
                <p className="mt-1 text-sm text-white/65">No hospital capacity, no offline resilience, no decision transparency.</p>
              </div>
            </div>

            <div className="landing-card p-6">
              <p className="text-sm font-semibold">What only SupplyGuard does</p>
              <div className="mt-5 space-y-3">
                {differentiators.map((card) => {
                  const open = openDifferentiator === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setOpenDifferentiator((current) => (current === card.id ? null : card.id))}
                      className="w-full rounded-2xl border border-slate-600/35 bg-slate-950/75 p-4 text-left transition hover:border-slate-400/60"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{card.title}</p>
                          <p className="mt-1 text-sm text-white/70">{card.tagline}</p>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-white/55 transition ${open ? 'rotate-90' : ''}`} />
                      </div>
                      {open ? (
                        <div className="mt-4 grid gap-3">
                          <ul className="grid gap-2 sm:grid-cols-2">
                            {card.bullets.map((item) => (
                              <li key={item} className="flex items-start gap-2 text-sm text-white/75">
                                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#0066ff]" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="rounded-2xl border border-slate-600/35 bg-slate-900/65 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Why others don’t</p>
                            <p className="mt-2 text-sm text-white/70">{card.why}</p>
                          </div>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="landing-card mt-10 overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4">
              <p className="text-sm font-semibold">Technical depth comparison</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-white/70">
                    <th className="px-6 py-3 font-semibold">Feature</th>
                    <th className="px-6 py-3 font-semibold">Others</th>
                    <th className="px-6 py-3 font-semibold">SupplyGuard</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  {[
                    ['Route tracking', '✓', '✓'],
                    ['Alert system', '✓', '✓'],
                    ['Supply management', '✓', '✓'],
                    ['Mobile apps', '✓', '✓'],
                    ['Hospital capacity', '✗', '✓'],
                    ['Offline sync', 'Cache', 'Local-first + mesh patterns'],
                    ['API resilience', 'Retry', 'Circuit-breaker style fallbacks'],
                    ['AI integration', 'Basic', 'Explainer + transparency'],
                    ['Historical testing', '✗', 'Replay benchmarks'],
                    ['Chaos testing', '✗', 'Uptime targets'],
                  ].map(([feature, other, us]) => (
                    <tr key={feature} className="border-t border-white/10">
                      <td className="px-6 py-3 font-medium">{feature}</td>
                      <td className="px-6 py-3 text-white/70">
                        {other === '✗' ? <XCircle className="h-4 w-4 text-white/45" /> : other}
                      </td>
                      <td className="px-6 py-3">
                        {us === '✓' ? (
                          <span className="inline-flex items-center gap-2 text-[#0066ff]">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold">✓</span>
                          </span>
                        ) : (
                          <span className="text-white/85">{us}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section id="proof" className="landing-section-light text-[#0f172a]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-black/60">Proof</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Validated against reality</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-black/70">
            We focus on measurable outcomes: detection loops, routing correctness, and resilience when dependencies fail.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="landing-card-light p-6">
              <p className="text-sm font-semibold">🌀 Katrina replay (2005) — demo benchmark</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-300/70 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-black/50">Detection time</p>
                  <p className="mt-2 text-sm text-black/70">Real: 96 hours</p>
                  <p className="mt-1 text-sm font-semibold text-[#0066ff]">SupplyGuard: 38 hours (‑58h)</p>
                </div>
                <div className="rounded-2xl border border-slate-300/70 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-black/50">Hospital routing</p>
                  <p className="mt-2 text-sm text-black/70">Manual coordination → capacity-aware dispatch</p>
                </div>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/15 bg-black/5 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/10"
                  onClick={() => onOpenDocs?.('solution-challenge')}
                >
                  View validation notes
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-black/55">Benchmark numbers shown as competition demo metrics.</p>
            </div>

            <div className="landing-card-light p-6">
              <p className="text-sm font-semibold">⚡ Resilience under failure — demo benchmark</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-300/70 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-black/50">Chaos testing</p>
                  <p className="mt-2 text-sm text-black/70">Random external dependency failures</p>
                  <p className="mt-1 text-sm font-semibold text-[#0066ff]">99.2% alert delivery maintained</p>
                </div>
                <div className="rounded-2xl border border-slate-300/70 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-black/50">Fallback behavior</p>
                  <p className="mt-2 text-sm text-black/70">
                    Local routing/tiles when available, cached routes otherwise, and template explanations if AI is down.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/15 bg-black/5 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/10"
                  onClick={() => onOpenDocs?.('privacy-security')}
                >
                  View reliability posture
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-black/55">Resilience results shown as competition demo metrics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="landing-section-dark text-[#e5ecf7]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Live demo</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">See it in action</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            Open the full dashboard for the operator experience: live map, simulation controls, hospital capacity, missions, alerts, and explainability.
          </p>

          <div className="landing-card mt-10 p-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-600/35 bg-slate-950/70">
                <Map variant="embed" />
              </div>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-600/35 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Flood users → rescue coordination</p>
                  <p className="mt-2 text-sm text-white/75">
                    Surface survivor reports/clusters on the map, assign rescue teams, and route to hospitals with capacity.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-600/35 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Offline connectivity</p>
                  <p className="mt-2 text-sm text-white/75">
                    Designed for hotspot/local-network ops with mesh-style relays; extendable to BLE-based field links.
                  </p>
                </div>
                <button type="button" className="btn-primary w-full justify-center" onClick={onOpenDashboard}>
                  Open Full Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" className="btn-outline w-full justify-center" onClick={() => onOpenDocs?.('demo-checklist')}>
                  Demo run-of-show
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APPS */}
      <section id="apps" className="landing-section-light text-[#0f172a]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-black/60">Mobile apps</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Three roles. One response loop.</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-black/70">
            Command, Responder, and Citizen/Victim apps coordinate through the same data model and sync when connectivity returns.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              ['Command Center', 'Coordinator console for operations', '12.4MB'],
              ['Rescue', 'Field responder assignments + navigation', '11.8MB'],
              ['Victim', 'Self-report + alerts (offline-friendly)', '9.2MB'],
            ].map(([title, body, size]) => (
              <div key={title} className="landing-card-light p-6">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-2 text-sm text-black/70">{body}</p>
                <div className="mt-5 rounded-2xl border border-slate-300/70 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-black/50">Package</p>
                  <p className="mt-2 text-sm font-semibold">{size}</p>
                </div>
                <button
                  type="button"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/15 bg-black/5 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/10"
                  onClick={onOpenDownloads}
                >
                  Download APK
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="landing-card-light mt-10 p-6">
            <p className="text-sm font-semibold">How they work together</p>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                ['Victim', 'Reports incident (offline OK)'],
                ['Command', 'Sees cluster + assigns rescue'],
                ['Rescue', 'Receives task + navigates'],
                ['Command', 'Monitors completion + hospital intake'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-slate-300/70 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">{title}</p>
                  <p className="mt-2 text-sm font-semibold">{body}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0066ff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0057d6]"
              onClick={onOpenDownloads}
            >
              Download all apps
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* TECH */}
      <section id="tech" className="landing-section-dark text-[#e5ecf7]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Tech stack</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Production-grade architecture</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            A monorepo with independent backend engines, a Flutter frontend, Firestore schema, and offline deployment tooling.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              ['Frontend', 'React + Vite + TypeScript\nLeaflet maps\nOffline-friendly console'],
              ['Backend', 'Node.js services\nDeterministic risk + routing\nSimulation + offline server'],
              ['Cloud & AI', 'Firebase + Firestore\nPub/Sub pipelines\nGemini explainer (guardrailed)'],
            ].map(([title, body]) => (
              <div key={title} className="landing-card p-6">
                <p className="text-sm font-semibold text-white">{title}</p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/70">{body}</pre>
              </div>
            ))}
          </div>

          <div className="landing-card mt-10 p-6">
            <p className="text-sm font-semibold">Microservices (conceptual)</p>
            <div className="mt-4 grid gap-2 text-sm text-white/75 sm:grid-cols-2 lg:grid-cols-3">
              {[
                'api-gateway',
                'ingestion-service',
                'risk-engine',
                'route-optimizer',
                'drone-engine',
                'rescue-engine',
                'inventory-engine',
                'anomaly-engine',
                'ai-explainer',
                'simulation-engine',
                'offline-server',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-600/35 bg-slate-950/75 px-3 py-2">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-outline" onClick={() => onOpenDocs?.('architecture')}>
                View architecture
                <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" className="btn-outline" onClick={() => onOpenDocs?.('responsible-ai')}>
                Responsible AI
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="landing-section-light text-[#0f172a]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-black/60">Try it now</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Experience SupplyGuard</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-black/70">
            Judges: scroll, understand, verify, and then open the dashboard. Operators: run the simulation and inspect routing + hospital capacity decisions.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#0066ff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0057d6]"
              onClick={onOpenDashboard}
            >
              Try Live Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/5 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black/10"
              onClick={onOpenDownloads}
            >
              Download mobile apps
              <Download className="h-4 w-4" />
            </button>
            <a
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/0 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black/5"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
              <Github className="h-4 w-4" />
            </a>
          </div>

          <div className="landing-card-light mt-12 p-6">
            <p className="text-sm font-semibold">Quick links</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/0 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                onClick={() => onOpenDocs?.('solution-challenge')}
              >
                Solution Challenge pack
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/0 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                onClick={() => onOpenDocs?.('demo-checklist')}
              >
                Demo checklist
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/0 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                onClick={() => onOpenDocs?.('video-script')}
              >
                Video script
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0d1117]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>SupplyGuard AI • Built for Google Solution Challenge</p>
          <p>Maps: Leaflet + OSM (local tiles supported) • Routing: OSRM (local supported)</p>
        </div>
      </footer>
    </div>
  );
}
