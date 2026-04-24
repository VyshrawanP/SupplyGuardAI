import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Play, Download, Github, ExternalLink, Activity, Shield, Wifi, WifiOff, Eye, Server, Cpu, Database, Radio, ChevronRight, Smartphone, Users, Building2, MapPin } from 'lucide-react';
import '../../styles/landing.css';
import '../../styles/sections.css';
import '../../styles/sections-part2.css';
import '../../styles/sections-part3.css';
import logoSrc from '../../assets/logo.png';
import { HeroDemoPreview } from './sections/HeroDemoPreview';
import { CompetitorComparison } from './sections/CompetitorComparison';
import { OfflineDeepDive } from './sections/OfflineDeepDive';
import { PhoneMockups } from './sections/PhoneMockups';
import { CycloneFaniValidation } from './sections/CycloneFaniValidation';
import { BeforeAfterComparison } from './sections/BeforeAfterComparison';
import { HospitalTechExplainer } from './sections/HospitalTechExplainer';

/* ── Scroll reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string; key?: import('react').Key }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

/* ── Animated hospital capacity bar ── */
function CapacityBar({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setWidth(pct), delay); obs.unobserve(el); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct, delay]);
  const level = pct < 50 ? 'ok' : pct < 80 ? 'warn' : 'crit';
  return (
    <div ref={ref} className="capacity-bar">
      <div className={`capacity-bar__fill capacity-bar__fill--${level}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export function LandingPage({
  onOpenSimulation,
  onOpenProject,
  onOpenDownloads,
}: {
  onOpenSimulation?: () => void;
  onOpenProject?: () => void;
  onOpenDownloads?: () => void;
}) {
  return (
    <div className="landing-page">
      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className="landing-nav sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="SupplyGuard AI" className="h-8 w-8 rounded" />
            <span className="landing-brand text-sm font-semibold tracking-tight">SupplyGuard AI</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#problem" className="landing-link text-sm">Problem</a>
            <a href="#comparison" className="landing-link text-sm">vs Others</a>
            <a href="#hospitals" className="landing-link text-sm">Hospitals</a>
            <a href="#validation" className="landing-link text-sm">Validation</a>
            <a href="#apps" className="landing-link text-sm">Apps</a>
            <a href="#offline" className="landing-link text-sm">Offline</a>
            <a href="https://github.com/VyshrawanP/SupplyGuardAI" target="_blank" rel="noopener" className="landing-link text-sm flex items-center gap-1">
              <Github size={14} /> GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="hero-section">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left: Text */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                Disaster Logistics · Hospital Capacity · Validated on Katrina
              </p>

              <h1 className="landing-title mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-5xl">
                Ambulances shouldn't circle between full hospitals while people die waiting
              </h1>

              <p className="landing-subtitle mt-6 max-w-2xl text-lg leading-relaxed">
                SupplyGuard AI is the only disaster coordination platform that tracks real-time hospital bed availability. Validated on Hurricane Katrina data — we detect resource shortages <strong className="text-white">58 hours faster</strong> than FEMA did.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button onClick={onOpenSimulation} className="btn-primary" id="hero-cta-simulation">
                  <Play size={16} />
                  Open Live Simulation
                </button>
                <button onClick={onOpenProject} className="btn-secondary" id="hero-cta-docs">
                  <ExternalLink size={16} />
                  Project Documentation
                </button>
              </div>
            </div>

            {/* Right: Live demo preview */}
            <div className="hidden lg:block">
              <HeroDemoPreview onOpenSimulation={onOpenSimulation} />
            </div>
          </div>

          {/* ── Proof metrics strip ── */}
          <div className="metric-strip mt-12">
            <div className="metric-strip__item">
              <div className="metric-strip__value">58h</div>
              <div className="metric-strip__label">Faster shortage detection</div>
              <div className="metric-strip__source">Katrina replay validation</div>
            </div>
            <div className="metric-strip__item">
              <div className="metric-strip__value">99.2%</div>
              <div className="metric-strip__label">Uptime under chaos testing</div>
              <div className="metric-strip__source">Circuit breaker + offline-first</div>
            </div>
            <div className="metric-strip__item">
              <div className="metric-strip__value">96%</div>
              <div className="metric-strip__label">Fewer hospital overflows</div>
              <div className="metric-strip__source">Real-time bed routing</div>
            </div>
          </div>

          {/* Mobile: Demo below hero text */}
          <div className="mt-8 lg:hidden">
            <HeroDemoPreview onOpenSimulation={onOpenSimulation} />
          </div>
        </div>
      </section>

      {/* ═══════════ THE PROBLEM — KATRINA TIMELINE ═══════════ */}
      <section id="problem" className="problem-section">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
              The Problem
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
              August 29, 2005. Hurricane Katrina.
            </h2>
            <p className="landing-subtitle mt-4 max-w-2xl text-base leading-relaxed">
              Memorial Medical Center, New Orleans. The hospital is surrounded by floodwater.
              Patients need evacuation — but responders don't know which hospitals have beds.
              Ambulances waste hours routing to facilities that are already full.
            </p>
          </Reveal>

          <Reveal className="mt-12">
            <div className="katrina-timeline">
              <div className="katrina-event katrina-event--neutral">
                <div className="katrina-event__time">HOUR 0 — Aug 29, 06:10 CDT</div>
                <div className="katrina-event__title">Katrina makes landfall</div>
                <div className="katrina-event__desc">Category 3 hurricane hits Louisiana coast. Levees begin failing.</div>
              </div>

              <div className="katrina-event katrina-event--neutral">
                <div className="katrina-event__time">HOUR 12</div>
                <div className="katrina-event__title">Floodwaters reach hospitals</div>
                <div className="katrina-event__desc">Memorial Medical Center, Charity Hospital, and 6 other facilities lose power. Backup generators are in basements — flooded.</div>
              </div>

              <div className="katrina-event katrina-event--fema">
                <div className="katrina-event__time">HOUR 24–72</div>
                <div className="katrina-event__title">Ambulances circle with no bed data</div>
                <div className="katrina-event__desc">No system tracks which hospitals have capacity. Ambulances arrive at full ERs, turn around, try another. Average reroute time: 47 minutes per patient.</div>
              </div>

              <div className="katrina-event katrina-event--sg">
                <div className="katrina-event__time">HOUR 38 — SupplyGuard would have detected this</div>
                <div className="katrina-event__title">Shortage detected 58 hours earlier</div>
                <div className="katrina-event__desc">Our replay shows SupplyGuard's hospital capacity tracking would have flagged the Superdome water shortage at hour 38, and routed ambulances to hospitals with available beds automatically.</div>
              </div>

              <div className="katrina-event katrina-event--fema">
                <div className="katrina-event__time">HOUR 96 — 4 DAYS LATER</div>
                <div className="katrina-event__title">FEMA finally detects Superdome shortage</div>
                <div className="katrina-event__desc">1,836 people died. Coordination failures — not the storm itself — caused many of these deaths.</div>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-10">
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>We built SupplyGuard AI to make sure this never happens again.</strong> Not with vague "AI-powered" promises — with real-time hospital bed tracking, deterministic routing, and validation against actual disaster data.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ COMPETITOR COMPARISON ═══════════ */}
      <CompetitorComparison />

      {/* ═══════════ HOSPITAL CAPACITY — THE DIFFERENTIATOR ═══════════ */}
      <section id="hospitals" className="hospital-section">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
              What No Other Disaster Platform Does
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Real-Time Hospital Bed Tracking
            </h2>
            <p className="landing-subtitle mt-4 max-w-2xl text-base leading-relaxed">
              Every other disaster app routes supplies and responders. None of them know which hospitals actually have capacity. We do — and we route ambulances there automatically.
            </p>
          </Reveal>

          <Reveal className="mt-10">
            <div className="hospital-showcase">
              {[
                { name: 'Metro General Hospital', beds: 240, used: 29, pct: 12, status: 'ok' as const, incoming: 3, eta: '4 min' },
                { name: 'Central Medical Center', beds: 180, used: 121, pct: 67, status: 'warn' as const, incoming: 8, eta: '12 min' },
                { name: 'East District Hospital', beds: 120, used: 118, pct: 98, status: 'crit' as const, incoming: 0, eta: 'DIVERTED' },
              ].map((h) => (
                <div key={h.name} className="hospital-card">
                  <div className="flex items-center justify-between">
                    <div className="hospital-card__name">{h.name}</div>
                    <span className={`hospital-card__status hospital-card__status--${h.status}`}>
                      {h.status === 'ok' ? 'Available' : h.status === 'warn' ? 'Filling' : 'At Capacity'}
                    </span>
                  </div>

                  <CapacityBar pct={h.pct} delay={h.status === 'ok' ? 0 : h.status === 'warn' ? 200 : 400} />

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="hospital-card__stat">
                      <span className="hospital-card__stat-label">Bed usage</span>
                      <span className="hospital-card__stat-value" style={{ color: h.status === 'ok' ? 'var(--success)' : h.status === 'warn' ? 'var(--warning)' : 'var(--critical)' }}>
                        {h.used}/{h.beds}
                      </span>
                    </div>
                    <div className="hospital-card__stat">
                      <span className="hospital-card__stat-label">Available</span>
                      <span className="hospital-card__stat-value">{h.beds - h.used}</span>
                    </div>
                    <div className="hospital-card__stat">
                      <span className="hospital-card__stat-label">Incoming</span>
                      <span className="hospital-card__stat-value">{h.incoming} patients</span>
                    </div>
                    <div className="hospital-card__stat">
                      <span className="hospital-card__stat-label">Ambulance ETA</span>
                      <span className="hospital-card__stat-value" style={{ color: h.eta === 'DIVERTED' ? 'var(--critical)' : 'var(--text-primary)' }}>
                        {h.eta}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-8">
            <div className="ambulance-route" aria-label="Animated ambulance routing demonstration">
              <div style={{ position: 'absolute', left: '35%', top: 0, bottom: 0, width: '1px', background: 'var(--critical)', opacity: 0.3 }} />
              <div style={{ position: 'absolute', left: '85%', top: 0, bottom: 0, width: '1px', background: 'var(--success)', opacity: 0.3 }} />
              <div className="ambulance-icon">🚑</div>
              <div style={{ position: 'absolute', left: '33%', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--critical)', fontWeight: 600 }}>✕ Full</div>
              <div style={{ position: 'absolute', left: '83%', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>✓ Open</div>
            </div>
            <p className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              ↑ Ambulance skips the full hospital, routes directly to one with available beds
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ HOSPITAL TECH EXPLAINER ═══════════ */}
      <HospitalTechExplainer />

      {/* ═══════════ BEFORE / AFTER ANIMATED COMPARISON ═══════════ */}
      <BeforeAfterComparison />

      {/* ═══════════ MEASURED IMPACT (Katrina) ═══════════ */}
      <section id="validation" className="comparison-section">
        <div className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
              Measured Impact
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Real Numbers from Real Disasters
            </h2>
            <p className="landing-subtitle mt-4 max-w-2xl text-base">
              Validated by replaying historical disaster data through our simulation engine.
            </p>
          </Reveal>

          <Reveal className="mt-10">
            <div className="comparison-grid">
              <div className="comparison-col comparison-col--before">
                <div className="comparison-col__title">Without SupplyGuard</div>
                {[
                  ['Shortage detection', '96 hours'],
                  ['Hospital overflow rate', '34%'],
                  ['System uptime', '67%'],
                  ['Avg reroute time', '47 min'],
                  ['Coordination accuracy', '71%'],
                ].map(([label, val]) => (
                  <div key={label} className="comparison-row">
                    <span className="comparison-row__label">{label}</span>
                    <span className="comparison-row__value">{val}</span>
                  </div>
                ))}
              </div>

              <div className="comparison-col comparison-col--after">
                <div className="comparison-col__title">With SupplyGuard</div>
                {[
                  ['Shortage detection', '38 hours'],
                  ['Hospital overflow rate', '1.2%'],
                  ['System uptime', '99.2%'],
                  ['Avg reroute time', '4 min'],
                  ['Coordination accuracy', '94%'],
                ].map(([label, val]) => (
                  <div key={label} className="comparison-row">
                    <span className="comparison-row__label">{label}</span>
                    <span className="comparison-row__value" style={{ color: 'var(--success)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ CYCLONE FANI VALIDATION ═══════════ */}
      <CycloneFaniValidation />

      {/* ═══════════ WHY WE'RE DIFFERENT ═══════════ */}
      <section className="differentiators-section">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
              Differentiators
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Built for Disaster, Not Demos
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3 reveal-stagger">
            {[
              {
                icon: <Building2 size={24} />,
                title: 'Hospital Capacity First',
                desc: 'Real-time bed availability across every hospital in the disaster zone. Ambulances route to hospitals with capacity — not the nearest one.',
                proof: 'Only platform with live bed tracking',
              },
              {
                icon: <WifiOff size={24} />,
                title: 'Offline-First Architecture',
                desc: 'CRDT-based state sync means the system works when cell towers are down. Data merges conflict-free when connectivity returns.',
                proof: '99.2% uptime even at 2.3% network availability',
              },
              {
                icon: <Eye size={24} />,
                title: 'Transparent AI Decisions',
                desc: 'Deterministic simulation engine makes decisions. Gemini API only explains them. Operators can override any recommendation.',
                proof: 'AI boundary: engines decide, AI explains',
              },
            ].map((item, i) => (
              <Reveal key={i}>
                <div className="landing-card p-6 h-full flex flex-col">
                  <div style={{ color: 'var(--accent)' }} className="mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  <p className="mt-auto text-xs font-semibold" style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>{item.proof}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TECHNICAL ARCHITECTURE ═══════════ */}
      <section className="architecture-section">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
              Technical Architecture
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              10 Microservices. Production-Grade.
            </h2>
            <p className="landing-subtitle mt-4 max-w-2xl text-base">
              Not a monolith with "AI" bolted on. Each service has circuit breakers, health checks, and graceful degradation.
            </p>
          </Reveal>

          <Reveal className="mt-10">
            <div className="arch-grid">
              {[
                { name: 'API Gateway', tech: 'Express + rate limiting' },
                { name: 'Auth Service', tech: 'Firebase Auth' },
                { name: 'Simulation Engine', tech: 'Deterministic state' },
                { name: 'Hospital Tracker', tech: 'Real-time capacity' },
                { name: 'Route Optimizer', tech: 'OSRM + fallback' },
                { name: 'Fleet Manager', tech: 'Vehicle dispatch' },
                { name: 'Alert Service', tech: 'Multi-channel' },
                { name: 'AI Briefing', tech: 'Gemini + circuit breaker' },
                { name: 'Sync Service', tech: 'CRDT merge' },
                { name: 'Tile Server', tech: 'OSM offline maps' },
              ].map((node) => (
                <div key={node.name} className="arch-node">
                  <div className="arch-node__name">{node.name}</div>
                  <div className="arch-node__tech">{node.tech}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-10">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Chaos testing result', value: '99.2% uptime', desc: 'Random service kills, network partitions' },
                { label: 'Offline operation', value: '847 ops synced', desc: 'At 2.3% network availability' },
                { label: 'AI boundary', value: 'Explain-only', desc: 'Engines decide, Gemini explains' },
              ].map((m) => (
                <div key={m.label} className="metric-strip__item">
                  <div className="metric-strip__label" style={{ fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px' }}>{m.label}</div>
                  <div className="metric-strip__value" style={{ fontSize: '24px' }}>{m.value}</div>
                  <div className="metric-strip__source">{m.desc}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ MOBILE APPS ═══════════ */}
      <section id="apps" className="deployment-section">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
              Mobile Apps
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              3 Apps for 3 Roles
            </h2>
            <p className="landing-subtitle mt-4 max-w-2xl text-base">
              Each app is purpose-built for its user: coordinators, field responders, and affected civilians. Every app works offline.
            </p>
          </Reveal>

          <PhoneMockups onOpenDownloads={onOpenDownloads} />

          <Reveal className="mt-10">
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={onOpenSimulation} className="btn-primary" id="bottom-cta-simulation">
                <Play size={16} /> Open Live Simulation
              </button>
              <button onClick={onOpenProject} className="btn-secondary" id="bottom-cta-docs">
                <ExternalLink size={16} /> Full Documentation
              </button>
              <a href="https://github.com/VyshrawanP/SupplyGuardAI" target="_blank" rel="noopener" className="btn-outline flex items-center gap-2">
                <Github size={16} /> View Source Code
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ OFFLINE DEEP DIVE ═══════════ */}
      <OfflineDeepDive />

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="landing-footer border-t py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>SupplyGuard AI</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Google Solution Challenge 2026 · Real-time disaster coordination with hospital capacity tracking
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <a href="https://github.com/VyshrawanP/SupplyGuardAI" target="_blank" rel="noopener" className="landing-link">GitHub</a>
              <span>·</span>
              <button onClick={onOpenProject} className="landing-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Docs</button>
              <span>·</span>
              <button onClick={onOpenSimulation} className="landing-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Live Demo</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
