import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { IntroOverlay } from './components/sections/IntroOverlay';
import { IndiaHistoryReplay } from './components/history/IndiaHistoryReplay';
import { useMeshAlerts } from './store/useMeshAlerts';
import { ProjectPortal } from './components/project/ProjectPortal';
import { PromoPage } from './components/promo/PromoPage';

const INTRO_SEEN_KEY = 'sg_intro_seen';

type AppView = 'promo' | 'dashboard' | 'history' | 'project';

function viewFromPathname(pathname: string): AppView {
  if (pathname.startsWith('/project')) return 'project';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/promo')) return 'promo';
  return 'dashboard';
}

function projectStateFromLocation(location: Location) {
  const params = new URLSearchParams(location.search);
  const doc = params.get('doc');
  const downloads = params.get('downloads');
  return {
    docId: doc && doc.trim() ? doc.trim() : null,
    downloadsOpen: downloads === '1' || downloads === 'true',
  };
}

function pathnameFromView(view: AppView) {
  if (view === 'project') return '/project';
  if (view === 'history') return '/history';
  if (view === 'promo') return '/promo';
  return '/';
}

export default function App() {
  const [view, setView] = useState<AppView>(() => {
    if (typeof window === 'undefined') return 'project';
    return viewFromPathname(window.location.pathname);
  });
  const [projectDocId, setProjectDocId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    if (!window.location.pathname.startsWith('/project')) return null;
    return projectStateFromLocation(window.location).docId;
  });
  const [projectDownloadsOpen, setProjectDownloadsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (!window.location.pathname.startsWith('/project')) return false;
    return projectStateFromLocation(window.location).downloadsOpen;
  });
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
  });
  const startMesh = useMeshAlerts((state) => state.start);

  const replaceProjectQuery = (next: { docId: string | null; downloadsOpen: boolean }) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (next.docId) params.set('doc', next.docId);
    if (next.downloadsOpen) params.set('downloads', '1');
    const search = params.toString();
    const url = `/project${search ? `?${search}` : ''}`;
    window.history.replaceState({ view: 'project', docId: next.docId, downloadsOpen: next.downloadsOpen }, '', url);
  };

  const navigate = (nextView: AppView, options?: { docId?: string | null; downloadsOpen?: boolean }) => {
    setView(nextView);
    if (typeof window === 'undefined') return;
    const nextPath = pathnameFromView(nextView);
    if (nextView === 'project') {
      const docId = options?.docId ?? null;
      setProjectDocId(docId);
      const downloadsOpen = Boolean(options?.downloadsOpen);
      setProjectDownloadsOpen(downloadsOpen);
      const params = new URLSearchParams();
      if (docId) params.set('doc', docId);
      if (downloadsOpen) params.set('downloads', '1');
      const search = params.toString();
      window.history.pushState({ view: nextView, docId, downloadsOpen }, '', `${nextPath}${search ? `?${search}` : ''}`);
      return;
    }

    setProjectDocId(null);
    setProjectDownloadsOpen(false);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: nextView }, '', nextPath);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      const nextView = viewFromPathname(window.location.pathname);
      setView(nextView);
      if (nextView === 'project') {
        const state = projectStateFromLocation(window.location);
        setProjectDocId(state.docId);
        setProjectDownloadsOpen(state.downloadsOpen);
      } else {
        setProjectDocId(null);
        setProjectDownloadsOpen(false);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!showIntro) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
      setShowIntro(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    void startMesh();
  }, [startMesh]);

  return (
    <div className="app-shell min-h-screen">
      {view === 'landing' ? (
        <LandingPage
          onOpenDashboard={() => navigate('dashboard')}
          onOpenDocs={(docId) => navigate('project', { docId: docId ?? 'overview' })}
          onOpenDownloads={() => navigate('project', { docId: 'overview', downloadsOpen: true })}
        />
      ) : view === 'history' ? (
        <IndiaHistoryReplay onBack={() => navigate('dashboard')} />
      ) : view === 'project' ? (
        <ProjectPortal
          activeDocId={projectDocId}
          onNavigateDoc={(docId) => navigate('project', { docId })}
          downloadsOpen={projectDownloadsOpen}
          onSetDownloadsOpen={(open) => {
            setProjectDownloadsOpen(open);
            replaceProjectQuery({ docId: projectDocId, downloadsOpen: open });
          }}
          onOpenPromo={() => navigate('promo')}
          onBackToConsole={() => navigate('dashboard')}
        />
      ) : view === 'promo' ? (
        <PromoPage
          onOpenConsole={() => navigate('dashboard')}
          onOpenProject={() => navigate('project', { docId: 'overview' })}
          onOpenHistory={() => navigate('history')}
          onOpenDownloads={() => navigate('project', { docId: 'overview', downloadsOpen: true })}
        />
      ) : (
        <Dashboard
          onOpenHistory={() => navigate('history')}
          onOpenProject={() => navigate('project')}
          onOpenProjectDoc={(docId) => navigate('project', { docId })}
          onOpenDownloads={() => navigate('project', { docId: 'overview', downloadsOpen: true })}
          onOpenPromo={() => navigate('promo')}
        />
      )}
      <IntroOverlay visible={view === 'dashboard' && showIntro} />
    </div>
  );
}
