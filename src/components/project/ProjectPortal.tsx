import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Download, LayoutDashboard, Menu, Search, X } from 'lucide-react';
import { extractMarkdownHeadings, markdownToHtml, type MarkdownHeading } from './markdown';

import README from '../../../README.md?raw';
import SOLUTION_CHALLENGE from '../../../SOLUTION_CHALLENGE.md?raw';
import ARCHITECTURE from '../../../docs/ARCHITECTURE.md?raw';
import JUDGE_QUICKSTART from '../../../docs/JUDGE_QUICKSTART.md?raw';
import PRIVACY_SECURITY from '../../../docs/PRIVACY_SECURITY.md?raw';
import RESPONSIBLE_AI from '../../../docs/RESPONSIBLE_AI.md?raw';
import DEMO_CHECKLIST from '../../../docs/DEMO_CHECKLIST.md?raw';
import VIDEO_SCRIPT from '../../../docs/VIDEO_SCRIPT.md?raw';

type DocPage = {
  id: string;
  title: string;
  description: string;
  body: string;
};

const OVERVIEW = `# SupplyGuard AI — Project Site

SupplyGuard AI is a disaster logistics platform for route disruption detection, drone dispatch, rescue coordination, inventory resilience, simulation, explainable decision support, and offline field operation.

## What this site contains

- A judge-friendly overview (problem → solution → impact → demo)
- Architecture and data-flow notes
- Privacy & security posture (demo vs production)
- Responsible AI boundary (AI explains; deterministic engines decide)
- A 5-minute quickstart and demo/video scripts

## Quickstart (local-only demo)

\`\`\`bash
cp .env.example .env
npm install
npm run dev
\`\`\`

Open http://localhost:3000

## Repo map

\`\`\`text
SupplyGuardAI/
├── src/                 (React + Vite command console)
├── backend/             (Cloud Run / local microservices)
├── frontend/            (Flutter field + command app)
├── firestore/           (rules + indexes)
├── docker/              (offline deployment)
└── docs/                (architecture, quickstart, RAI, security, scripts)
\`\`\`
`;

export function ProjectPortal({
  onBackToConsole,
  activeDocId,
  onNavigateDoc,
  downloadsOpen,
  onSetDownloadsOpen,
}: {
  onBackToConsole: () => void;
  activeDocId: string | null;
  onNavigateDoc: (docId: string | null) => void;
  downloadsOpen: boolean;
  onSetDownloadsOpen: (open: boolean) => void;
}) {
  const pages: DocPage[] = useMemo(
    () => [
      {
        id: 'overview',
        title: 'Overview',
        description: 'Basics, quickstart, and repo map.',
        body: OVERVIEW,
      },
      {
        id: 'solution-challenge',
        title: 'Solution Challenge Pack',
        description: 'Problem, SDGs, impact metrics, and demo path.',
        body: SOLUTION_CHALLENGE,
      },
      {
        id: 'judge-quickstart',
        title: 'Judge Quickstart',
        description: '5-minute run path for the local demo.',
        body: JUDGE_QUICKSTART,
      },
      {
        id: 'architecture',
        title: 'Architecture',
        description: 'Components and data flow diagram.',
        body: ARCHITECTURE,
      },
      {
        id: 'responsible-ai',
        title: 'Responsible AI',
        description: 'AI boundary and mitigations.',
        body: RESPONSIBLE_AI,
      },
      {
        id: 'privacy-security',
        title: 'Privacy & Security',
        description: 'Roles, rules, and recommended posture.',
        body: PRIVACY_SECURITY,
      },
      {
        id: 'demo-checklist',
        title: 'Demo Checklist',
        description: 'Run-of-show for recording and judging.',
        body: DEMO_CHECKLIST,
      },
      {
        id: 'video-script',
        title: 'Video Script',
        description: 'Suggested 3-minute narrative.',
        body: VIDEO_SCRIPT,
      },
      {
        id: 'readme',
        title: 'README',
        description: 'Full repo overview and setup details.',
        body: README,
      },
    ],
    [],
  );

  const [activeId, setActiveId] = useState<string>(activeDocId ?? 'overview');
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const active = pages.find((page) => page.id === activeId) ?? pages[0]!;
  const activeHtml = useMemo(() => markdownToHtml(active.body), [active.body]);
  const toc = useMemo(() => extractMarkdownHeadings(active.body, [2, 3]), [active.body]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((page) => {
      const hay = `${page.title}\n${page.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pages, query]);

  useEffect(() => {
    if (!activeDocId) return;
    if (activeDocId === activeId) return;
    const exists = pages.some((page) => page.id === activeDocId);
    if (!exists) return;
    setActiveId(activeDocId);
  }, [activeDocId, activeId, pages]);

  useEffect(() => {
    setSidebarOpen(false);
    setActiveHeadingId(null);
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!toc.length) return;

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const offset = 140;
        let current: string | null = null;
        for (const heading of toc) {
          const el = document.getElementById(heading.id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          if (top - offset <= 0) {
            current = heading.id;
          } else {
            break;
          }
        }
        setActiveHeadingId(current);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [toc]);

  const selectDoc = (docId: string | null) => {
    const nextId = docId ?? 'overview';
    setActiveId(nextId);
    onNavigateDoc(docId);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="landing-mark flex h-8 w-8 items-center justify-center rounded">
              <span className="text-sm font-bold text-black">SG</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-[0.35em] text-white/60">SupplyGuard AI</p>
              <h1 className="mt-1 truncate text-lg font-semibold text-white">Project Docs</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="ghost-button text-xs lg:hidden"
              aria-label="Open docs navigation"
            >
              <Menu className="h-3.5 w-3.5" />
              Docs
            </button>
            <button type="button" onClick={() => onSetDownloadsOpen(true)} className="ghost-button text-xs">
              <Download className="h-3.5 w-3.5" />
              Downloads
            </button>
            <button type="button" onClick={onBackToConsole} className="ghost-button text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Open console
            </button>
          </div>
        </div>
      </header>

      {downloadsOpen ? (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="absolute inset-0" onClick={() => onSetDownloadsOpen(false)} />
          <div className="absolute left-1/2 top-[92px] w-[92vw] max-w-[760px] -translate-x-1/2 rounded-[22px] border border-white/10 bg-black/80 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">Downloads</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Get all 3 apps</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Install one app per role (Coordinator / Responder / Citizen), or download all APKs for an end-to-end demo.
                </p>
              </div>
              <button type="button" className="ghost-button px-2 py-1" onClick={() => onSetDownloadsOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-semibold text-slate-200">Which one should I install?</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><span className="text-slate-200">Command Center</span>: for coordinators running the operation.</li>
                <li><span className="text-slate-200">Rescue</span>: for field responders receiving assignments.</li>
                <li><span className="text-slate-200">Victim</span>: for citizens to self-report needs and receive alerts.</li>
              </ul>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href="/downloads/apk/command-center" className="panel-surface rounded-[18px] p-4 transition hover:bg-white/6">
                <div className="flex items-center gap-3">
                  <img
                    src="/downloads/apk/command-center/icon"
                    alt="Command Center app icon"
                    className="h-10 w-10 rounded-[12px] border border-white/10 bg-white/5 object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Command Center (APK)</p>
                    <p className="mt-1 text-xs text-slate-400">Android • coordinator console</p>
                  </div>
                </div>
              </a>
              <a href="/downloads/apk/rescue" className="panel-surface rounded-[18px] p-4 transition hover:bg-white/6">
                <div className="flex items-center gap-3">
                  <img
                    src="/downloads/apk/rescue/icon"
                    alt="Rescue app icon"
                    className="h-10 w-10 rounded-[12px] border border-white/10 bg-white/5 object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Rescue App (APK)</p>
                    <p className="mt-1 text-xs text-slate-400">Android • responder workflows</p>
                  </div>
                </div>
              </a>
              <a href="/downloads/apk/victim" className="panel-surface rounded-[18px] p-4 transition hover:bg-white/6">
                <div className="flex items-center gap-3">
                  <img
                    src="/downloads/apk/victim/icon"
                    alt="Victim app icon"
                    className="h-10 w-10 rounded-[12px] border border-white/10 bg-white/5 object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Victim App (APK)</p>
                    <p className="mt-1 text-xs text-slate-400">Android • self-report + alerts</p>
                  </div>
                </div>
              </a>
              <a href="/downloads/apk-all" className="panel-surface rounded-[18px] p-4 transition hover:bg-white/6">
                <p className="text-sm font-semibold text-white">Download all APKs</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Single zip with all three apps.</p>
              </a>
            </div>

            <div className="mt-3 rounded-[18px] border border-white/10 bg-slate-950/40 p-4 text-xs leading-5 text-slate-300">
              Install note: if Android blocks installation, enable “Install unknown apps” for your browser, then retry.
            </div>

            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-slate-200">Also available (source bundles)</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <a href="/downloads/all" className="rounded-[14px] border border-white/10 bg-slate-950/40 px-3 py-3 text-left transition hover:bg-white/5">
                  <p className="text-sm font-semibold text-white">Download everything (source)</p>
                  <p className="mt-1 text-xs text-slate-400">Web + Flutter + Android sources</p>
                </a>
                <a
                  href="/downloads/web-console"
                  className="rounded-[14px] border border-white/10 bg-slate-950/40 px-3 py-3 text-left transition hover:bg-white/5"
                >
                  <p className="text-sm font-semibold text-white">Web console (source)</p>
                  <p className="mt-1 text-xs text-slate-400">React + Vite project files</p>
                </a>
                <a
                  href="/downloads/flutter-frontend"
                  className="rounded-[14px] border border-white/10 bg-slate-950/40 px-3 py-3 text-left transition hover:bg-white/5"
                >
                  <p className="text-sm font-semibold text-white">Flutter app (source)</p>
                  <p className="mt-1 text-xs text-slate-400">`frontend/` project</p>
                </a>
                <a
                  href="/downloads/android-mesh"
                  className="rounded-[14px] border border-white/10 bg-slate-950/40 px-3 py-3 text-left transition hover:bg-white/5"
                >
                  <p className="text-sm font-semibold text-white">Android apps (source)</p>
                  <p className="mt-1 text-xs text-slate-400">`android-apps/` projects</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[92vw] max-w-[420px] border-r border-white/10 bg-slate-950/90 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] uppercase tracking-[0.35em] text-cyan-200/80">Docs</p>
                <h2 className="mt-1 truncate text-base font-semibold text-white">SupplyGuard AI</h2>
              </div>
              <button type="button" className="ghost-button" onClick={() => setSidebarOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <SidebarContent
                pages={filteredPages}
                activeId={activeId}
                query={query}
                onQueryChange={setQuery}
                onSelect={(docId) => selectDoc(docId)}
                onBack={onBackToConsole}
              />
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto grid max-w-[1320px] gap-6 px-4 py-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-6 lg:py-8">
        <aside className="hidden flex-col gap-4 lg:flex">
          <SidebarContent
            pages={filteredPages}
            activeId={activeId}
            query={query}
            onQueryChange={setQuery}
            onSelect={(docId) => selectDoc(docId)}
            onBack={onBackToConsole}
          />
        </aside>

        <section className="panel-surface rounded-[22px] p-5 sm:p-6">
          <div className="flex flex-col gap-2 border-b border-white/8 pb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{active.id.replaceAll('-', ' ')}</p>
            <h2 className="text-2xl font-semibold text-white">{active.title}</h2>
            <p className="text-sm text-slate-300">{active.description}</p>
          </div>

          {activeId === 'overview' ? (
            <div className="mt-5 grid gap-4 rounded-[18px] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/80">Disaster logistics, offline-first</p>
                <h3 className="text-xl font-semibold text-white sm:text-2xl">Everything about the project, in one place</h3>
                <p className="text-sm leading-6 text-slate-300">
                  Use this site to understand the problem, architecture, safety posture, and the exact demo path judges can run.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={onBackToConsole} className="ghost-button justify-center">
                  <LayoutDashboard className="h-4 w-4" />
                  Open command console
                </button>
                <button type="button" onClick={() => selectDoc('judge-quickstart')} className="ghost-button justify-center">
                  <BookOpen className="h-4 w-4" />
                  Judge quickstart
                </button>
                <button type="button" onClick={() => onSetDownloadsOpen(true)} className="ghost-button justify-center">
                  <Download className="h-4 w-4" />
                  Downloads
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <a
                  href="/downloads/apk/command-center"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/5"
                >
                  <p className="font-semibold text-white">Command Center APK</p>
                  <p className="mt-1 text-xs text-slate-400">Coordinator console</p>
                </a>
                <a
                  href="/downloads/apk/rescue"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/5"
                >
                  <p className="font-semibold text-white">Rescue APK</p>
                  <p className="mt-1 text-xs text-slate-400">Responder workflows</p>
                </a>
                <a
                  href="/downloads/apk/victim"
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/5"
                >
                  <p className="font-semibold text-white">Victim APK</p>
                  <p className="mt-1 text-xs text-slate-400">Self-report + alerts</p>
                </a>
              </div>
              <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                  <p className="font-semibold text-slate-200">AI boundary</p>
                  <p className="mt-1 text-slate-300">Deterministic engines decide; AI only explains.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                  <p className="font-semibold text-slate-200">Offline mode</p>
                  <p className="mt-1 text-slate-300">Local simulation + mesh alerts for disaster conditions.</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className={`mt-5 grid gap-6 ${toc.length ? 'lg:grid-cols-[minmax(0,1fr)_260px]' : ''}`}>
            <div
              className="markdown-content"
              // markdownToHtml escapes HTML; only a small safe subset is generated here.
              dangerouslySetInnerHTML={{ __html: activeHtml }}
            />

            {toc.length ? <TableOfContents toc={toc} activeId={activeHeadingId} /> : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarContent({
  pages,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onBack,
}: {
  pages: DocPage[];
  activeId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (docId: string | null) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="panel-surface rounded-[22px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Docs</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Everything, one place</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Browse the judge pack, architecture, security notes, and runnable demo instructions.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 p-2">
            <BookOpen className="h-4 w-4 text-cyan-200" />
          </div>
        </div>

        <label className="field-label mt-5" htmlFor="docs-search">
          Search docs
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="docs-search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="input-surface pl-10"
            placeholder="Architecture, quickstart, security…"
          />
        </div>
      </div>

      <nav className="panel-surface rounded-[22px] p-2">
        {pages.map((page) => {
          const active = page.id === activeId;
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelect(page.id)}
              className={`w-full rounded-[18px] px-4 py-3 text-left transition ${
                active ? 'bg-white/8 text-white' : 'text-slate-300 hover:bg-white/6 hover:text-white'
              }`}
            >
              <div className="text-sm font-semibold">{page.title}</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">{page.description}</div>
            </button>
          );
        })}
        {!pages.length ? <div className="px-4 py-3 text-sm text-slate-400">No matching docs.</div> : null}
      </nav>

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to command console
      </button>
    </div>
  );
}

function TableOfContents({ toc, activeId }: { toc: MarkdownHeading[]; activeId: string | null }) {
  return (
    <aside className="sticky top-[104px] hidden h-fit rounded-[18px] border border-white/10 bg-slate-950/40 p-4 lg:block">
      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">On this page</p>
      <nav className="mt-3 flex flex-col gap-1">
        {toc.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                active ? 'bg-emerald-500/10 text-emerald-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              } ${item.level === 3 ? 'ml-3' : ''}`}
            >
              {item.text}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
