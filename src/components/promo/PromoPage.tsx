import { useMemo, useState, type ReactNode } from 'react';
import { BookOpen, Download, ExternalLink, LayoutDashboard, Play, ShieldCheck, Signal, Sparkles, Users, Wifi } from 'lucide-react';
import commandIcon from '../../assets/command_center_app.png';
import rescueIcon from '../../assets/rescue_app.png';
import victimIcon from '../../assets/victim_app.png';

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="panel-surface rounded-[22px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 p-2 text-cyan-200">{icon}</div>
      </div>
    </div>
  );
}

type RoleId = 'coordinator' | 'responder' | 'citizen';

function RolePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
          : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

function AppPromoCard({
  iconSrc,
  name,
  subtitle,
  bestFor,
  bullets,
  downloadHref,
}: {
  iconSrc?: string;
  name: string;
  subtitle: string;
  bestFor: string;
  bullets: string[];
  downloadHref?: string;
}) {
  return (
    <div className="panel-surface rounded-[24px] p-6">
      <div className="flex items-center gap-4">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt={`${name} icon`}
            className="h-14 w-14 rounded-[16px] border border-white/10 bg-white/5 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-white/10 bg-white/5">
            <LayoutDashboard className="h-6 w-6 text-cyan-200" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-base font-semibold text-white">{name}</p>
          <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/10 bg-slate-950/40 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Best for</p>
        <p className="mt-2 text-sm font-semibold text-slate-100">{bestFor}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>

      {downloadHref ? (
        <a href={downloadHref} className="ghost-button mt-4 w-full justify-center">
          <Download className="h-4 w-4" />
          Download APK
        </a>
      ) : null}
    </div>
  );
}

export function PromoPage({
  onOpenConsole,
  onOpenProject,
  onOpenHistory,
  onOpenDownloads,
}: {
  onOpenConsole: () => void;
  onOpenProject: () => void;
  onOpenHistory: () => void;
  onOpenDownloads: () => void;
}) {
  const [role, setRole] = useState<RoleId>('coordinator');

  const roleCopy = useMemo(() => {
    if (role === 'responder') {
      return {
        title: 'Responder mode',
        description: 'Use this if you are a rescue / medical / field team member.',
        primary: 'Rescue APK',
      };
    }
    if (role === 'citizen') {
      return {
        title: 'Citizen mode',
        description: 'Use this if you are reporting needs or receiving local alerts.',
        primary: 'Victim APK',
      };
    }
    return {
      title: 'Coordinator mode',
      description: 'Use this if you are operating the command center and coordinating response.',
      primary: 'Command Center APK',
    };
  }, [role]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%),linear-gradient(180deg,#050b12_0%,#0b121a_55%,#0f1215_100%)] text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-[0.35em] text-cyan-200/80">SupplyGuard AI</p>
            <h1 className="mt-1 truncate text-lg font-semibold text-white">Disaster logistics, command-ready</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onOpenProject} className="ghost-button text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Docs
            </button>
            <button type="button" onClick={onOpenDownloads} className="ghost-button text-xs">
              <Download className="h-3.5 w-3.5" />
              APKs
            </button>
            <button type="button" onClick={onOpenHistory} className="ghost-button text-xs">
              <Play className="h-3.5 w-3.5" />
              Replay
            </button>
            <button type="button" onClick={onOpenConsole} className="ghost-button text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Open console
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-8 lg:px-6 lg:py-12">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="panel-surface rounded-[28px] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/80">Offline-first • human-in-the-loop</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Keep medical delivery, rescue, and relief inventory moving under disruption.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              SupplyGuard AI is a disaster logistics command system for route disruption detection, service orchestration,
              simulation, mesh alerts, and explainable decision support.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={onOpenConsole} className="ghost-button justify-center">
                <LayoutDashboard className="h-4 w-4" />
                Launch live console
              </button>
              <button type="button" onClick={onOpenProject} className="ghost-button justify-center">
                <BookOpen className="h-4 w-4" />
                Read the judge pack
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Decision model</p>
                <p className="mt-2 text-sm font-semibold text-white">Deterministic</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">AI explains; engines decide.</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Connectivity</p>
                <p className="mt-2 text-sm font-semibold text-white">Offline-capable</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Local simulation + mesh alerts.</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Demo</p>
                <p className="mt-2 text-sm font-semibold text-white">Reproducible</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Scenario suite + replay.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <FeatureCard
              title="Route + locality intelligence"
              description="Risk-scored corridors, route warnings, and locality focus that update together with simulation controls."
              icon={<Signal className="h-4 w-4" />}
            />
            <FeatureCard
              title="Service orchestration"
              description="Coordinate ambulance, drones, rescue teams, evacuation, utilities, and inventory response from one console."
              icon={<Sparkles className="h-4 w-4" />}
            />
            <FeatureCard
              title="Responsible AI boundary"
              description="AI is used for explanations and briefings; operational decisions remain deterministic and inspectable."
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <FeatureCard
              title="Mesh + LAN relay alerts"
              description="When networks degrade, devices can still pair and relay alerts locally using WebRTC or a LAN relay fallback."
              icon={<Wifi className="h-4 w-4" />}
            />
          </div>
        </section>

        <section className="panel-surface rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Apps</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Install the right app for your role</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This demo includes three Android apps (Command Center / Rescue / Victim) plus the web console. Install one app per
                user role, or install all for an end-to-end walkthrough.
              </p>
            </div>
            <button type="button" onClick={onOpenDownloads} className="ghost-button mt-3 justify-center sm:mt-0">
              <Download className="h-4 w-4" />
              Open downloads
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <RolePill active={role === 'coordinator'} label="Coordinator" onClick={() => setRole('coordinator')} />
            <RolePill active={role === 'responder'} label="Responder" onClick={() => setRole('responder')} />
            <RolePill active={role === 'citizen'} label="Citizen" onClick={() => setRole('citizen')} />
          </div>

          <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{roleCopy.title}</p>
                <p className="mt-1 text-sm text-slate-300">{roleCopy.description}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-slate-200">
                <Users className="h-4 w-4 text-cyan-200" />
                Recommended: {roleCopy.primary}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <AppPromoCard
              iconSrc={commandIcon}
              name="SupplyGuard Command"
              subtitle="Command Center (Android • v1.0)"
              bestFor="Coordinators managing missions, routes, and overall response."
              bullets={[
                'View alerts and operational status at a glance',
                'Coordinate across rescue, medical, and supply workflows',
                'Works even when connectivity degrades (local pairing)',
              ]}
              downloadHref="https://www.mediafire.com/file/6mmxsw86jvhb7xb/command-center-debug.apk/file"
            />
            <AppPromoCard
              iconSrc={rescueIcon}
              name="SupplyGuard Rescue"
              subtitle="Responder app (Android • v1.0)"
              bestFor="Field responders executing assignments and relaying updates."
              bullets={[
                'Receive assignments and alerts in the field',
                'Send status updates during low-connectivity scenarios',
                'Mesh + LAN relay friendly',
              ]}
              downloadHref="https://www.mediafire.com/file/0r0x790cpqlk2hu/rescue-debug.apk/file"
            />
            <AppPromoCard
              iconSrc={victimIcon}
              name="SupplyGuard Victim"
              subtitle="Citizen app (Android • v1.0)"
              bestFor="People requesting help and receiving local guidance."
              bullets={[
                'Self-report needs during emergencies',
                'Receive local alerts and instructions',
                'Designed for simple, fast interaction',
              ]}
              downloadHref="https://www.mediafire.com/file/52gwl19r5w7dljr/victim-debug.apk/file"
            />
            <AppPromoCard
              name="SupplyGuard Web Console"
              subtitle="Runs in the browser"
              bestFor="Demos, judging, and operations simulation from any laptop."
              bullets={[
                'Command / Operations / Impact views',
                'Simulation controls and KPI dashboard',
                'History replay for repeatable walkthroughs',
              ]}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-6">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Install steps</p>
              <h4 className="mt-2 text-lg font-semibold text-white">How to install (Android)</h4>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                <li>Tap an APK download button (or download all APKs).</li>
                <li>Open the downloaded file to start installation.</li>
                <li>If blocked, enable “Install unknown apps” for your browser.</li>
                <li>Allow Bluetooth + Notifications when prompted (used for local mesh alerts).</li>
              </ol>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a href="/downloads/apk-all" className="ghost-button justify-center">
                  <Download className="h-4 w-4" />
                  Download all APKs
                </a>
                <button type="button" onClick={onOpenDownloads} className="ghost-button justify-center">
                  <Download className="h-4 w-4" />
                  Downloads page
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-6">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Safety</p>
              <h4 className="mt-2 text-lg font-semibold text-white">Why these permissions?</h4>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                The Android apps use Bluetooth LE scanning/advertising to support local pairing and mesh-style alert delivery when
                internet is unreliable. Notifications are used to surface urgent alerts.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                For details, open the project docs: Privacy &amp; Security + Responsible AI boundary.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={onOpenProject} className="ghost-button justify-center">
                  <BookOpen className="h-4 w-4" />
                  Read docs
                </button>
                <button type="button" onClick={onOpenHistory} className="ghost-button justify-center">
                  <Play className="h-4 w-4" />
                  Watch replay
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="panel-surface rounded-[28px] p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Try it</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Live command console</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Run the simulation, see missions orchestration, hospital pressure, and notifications update live.
            </p>
            <button type="button" onClick={onOpenConsole} className="ghost-button mt-4 w-full justify-center">
              <LayoutDashboard className="h-4 w-4" />
              Open console
            </button>
          </div>
          <div className="panel-surface rounded-[28px] p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Replay</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Scenario playback</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use the history replay for a repeatable, judge-friendly walk-through with timeline controls.
            </p>
            <button type="button" onClick={onOpenHistory} className="ghost-button mt-4 w-full justify-center">
              <Play className="h-4 w-4" />
              Open replay
            </button>
          </div>
          <div className="panel-surface rounded-[28px] p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Install</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Android APKs</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Download the Command Center, Rescue, and Victim apps directly from your browser.
            </p>
            <button type="button" onClick={onOpenDownloads} className="ghost-button mt-4 w-full justify-center">
              <Download className="h-4 w-4" />
              Open downloads
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-slate-950/55">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>SupplyGuard AI</p>
          <p className="inline-flex items-center gap-2">
            Offline-first demo • Deterministic decisions • Explainable briefings
            <ExternalLink className="h-4 w-4 text-slate-500" />
          </p>
        </div>
      </footer>
    </div>
  );
}
