import { useState, type CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';

/* ── Reveal helper (same as LandingPage) ── */
import { useEffect, useRef } from 'react';
import { Reveal } from './Reveal';

const LAYERS = [
  {
    num: 1,
    title: 'Local-First Data Storage',
    color: 'var(--accent)',
    content: (
      <>
        <p className="offline-layer__intro">Every app has a complete local database (SQLite):</p>
        <div className="offline-apps-grid">
          <div className="offline-app-block">
            <h4>Command Center App</h4>
            <ul>
              <li>Hospital capacity snapshots (last known state)</li>
              <li>Active mission assignments</li>
              <li>Map tiles for disaster zone (cached 50km radius)</li>
              <li>Alert templates and notification history</li>
            </ul>
          </div>
          <div className="offline-app-block">
            <h4>Rescue Team App</h4>
            <ul>
              <li>Assigned missions with full context</li>
              <li>Hospital locations and last-known capacity</li>
              <li>Offline navigation routes (OSRM cached)</li>
              <li>Victim reports pending submission</li>
            </ul>
          </div>
          <div className="offline-app-block">
            <h4>Victim Report App</h4>
            <ul>
              <li>Emergency reports queue (submitted when online)</li>
              <li>Received safety alerts and instructions</li>
              <li>GPS coordinates (works offline via device)</li>
            </ul>
          </div>
        </div>
        <div className="offline-tech-note">
          <strong>Tech:</strong> Flutter sqflite (SQLite) · ~50MB per app · Updates every 5 min when online
        </div>
      </>
    ),
  },
  {
    num: 2,
    title: 'CRDT Conflict-Free Sync',
    color: 'var(--success)',
    content: (
      <>
        <p className="offline-layer__intro">
          <strong>Problem:</strong> Two rescue teams update the same survivor report offline. When they reconnect, whose update wins?
        </p>
        <p className="offline-layer__intro">
          <strong>Solution:</strong> Conflict-Free Replicated Data Types (CRDTs) with vector clocks.
        </p>
        <pre className="offline-code">{`{
  id: "survivor_report_123",
  location: { lat: 12.9716, lng: 77.5946 },
  needs: ["medical", "water"],
  vectorClock: {
    "device_abc": 5,  // Team A's logical timestamp
    "device_xyz": 3   // Team B's logical timestamp
  },
  timestamp: 1640995200000
}`}</pre>
        <div className="offline-merge-steps">
          <p><strong>When devices reconnect:</strong></p>
          <ol>
            <li>Compare vector clocks</li>
            <li>If one dominates (all counters ≥), use that version</li>
            <li>If concurrent (neither dominates), merge:
              <ul>
                <li>Take union of needs arrays</li>
                <li>Keep most recent timestamp per field</li>
                <li>Preserve both updates in decision log</li>
              </ul>
            </li>
          </ol>
        </div>
        <div className="offline-result">
          <strong>Result:</strong> NO DATA LOSS, even with concurrent offline updates from multiple devices
        </div>
        <div className="offline-tech-note">
          <strong>Tech:</strong> Custom CRDT implementation (not library) · Vector clocks per record · Last-write-wins per field with causal ordering
        </div>
      </>
    ),
  },
  {
    num: 3,
    title: 'Background Sync Engine',
    color: 'var(--warning)',
    content: (
      <>
        <p className="offline-layer__intro">When device regains connectivity (even 2G/EDGE):</p>
        <div className="offline-sync-flow">
          <div className="offline-sync-step">
            <div className="offline-sync-step__num">1</div>
            <div>
              <strong>Check connectivity</strong>
              <ul>
                <li>WiFi → Sync everything</li>
                <li>Mobile data → Critical only (reports)</li>
                <li>2G/EDGE → Queue for later, sync reports only</li>
              </ul>
            </div>
          </div>
          <div className="offline-sync-step">
            <div className="offline-sync-step__num">2</div>
            <div>
              <strong>Upload pending data (priority queue):</strong>
              <ol>
                <li>Emergency victim reports (critical)</li>
                <li>Mission status updates (high)</li>
                <li>Hospital capacity updates (high)</li>
                <li>Read receipts and notifications (medium)</li>
                <li>Analytics and logs (low)</li>
              </ol>
            </div>
          </div>
          <div className="offline-sync-step">
            <div className="offline-sync-step__num">3</div>
            <div>
              <strong>Download fresh data →</strong> Merge conflicts (CRDT) → Update local cache → Show sync status
            </div>
          </div>
        </div>
        <div className="offline-tech-note">
          <strong>Tech:</strong> Flutter workmanager · connectivity_plus · Exponential backoff (5s, 15s, 45s, …)
        </div>
      </>
    ),
  },
  {
    num: 4,
    title: 'Degraded Mode Operations',
    color: 'var(--critical)',
    content: (
      <>
        <p className="offline-layer__intro">When 100% offline for extended periods:</p>
        <div className="offline-degraded-grid">
          <div className="offline-degraded-card">
            <h4>Victim Report App</h4>
            <ul>
              <li className="offline-can">✓ Submit reports (queued locally)</li>
              <li className="offline-can">✓ GPS still works (device-based)</li>
              <li className="offline-can">✓ Attach photos (stored locally)</li>
              <li className="offline-can">✓ Shows offline indicator</li>
              <li className="offline-cant">✗ Can't receive new alerts</li>
            </ul>
          </div>
          <div className="offline-degraded-card">
            <h4>Rescue Team App</h4>
            <ul>
              <li className="offline-can">✓ View assigned missions (cached)</li>
              <li className="offline-can">✓ Navigate using offline maps</li>
              <li className="offline-can">✓ Mark mission complete</li>
              <li className="offline-warn">⚠ Hospital capacity may be stale</li>
              <li className="offline-cant">✗ Can't receive new assignments</li>
            </ul>
          </div>
          <div className="offline-degraded-card">
            <h4>Command Center App</h4>
            <ul>
              <li className="offline-can">✓ View cached map and status</li>
              <li className="offline-can">✓ Plan operations with stale data</li>
              <li className="offline-warn">⚠ All data frozen at last sync</li>
              <li className="offline-cant">✗ Can't dispatch until online</li>
            </ul>
          </div>
        </div>
        <div className="offline-status-legend">
          <span><span className="offline-dot offline-dot--green"/>Online — real-time</span>
          <span><span className="offline-dot offline-dot--yellow"/>Degraded — partial</span>
          <span><span className="offline-dot offline-dot--red"/>Offline — cached only</span>
        </div>
      </>
    ),
  },
];

export function OfflineDeepDive() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section id="offline" className="offline-section">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
            Offline-First Architecture
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
            How Mobile Apps Work Without Internet
          </h2>
          <p className="landing-subtitle mt-4 max-w-2xl text-base leading-relaxed">
            Disasters destroy infrastructure. Cell towers fail. Power grids go down. Yet this is exactly when coordination tools are most critical. Most disaster apps fail here. We don't.
          </p>
        </Reveal>

        {/* Layers */}
        <div className="offline-layers mt-10">
          {LAYERS.map((layer) => (
            <Reveal key={layer.num}>
              <div className={`offline-layer${expanded === layer.num ? ' offline-layer--open' : ''}`} style={{ '--layer-color': layer.color } as CSSProperties}>
                <button className="offline-layer__header" onClick={() => setExpanded(expanded === layer.num ? null : layer.num)}>
                  <div className="offline-layer__num">{layer.num}</div>
                  <h3 className="offline-layer__title">{layer.title}</h3>
                  <ChevronRight size={18} className={`offline-layer__chevron${expanded === layer.num ? ' offline-layer__chevron--open' : ''}`}/>
                </button>
                {expanded === layer.num && <div className="offline-layer__body">{layer.content}</div>}
              </div>
            </Reveal>
          ))}
        </div>

        {/* Katrina scenario timeline */}
        <Reveal className="mt-12">
          <div className="offline-scenario">
            <h3 className="offline-scenario__title">Real-World Scenario: Katrina Network Outage</h3>
            <div className="offline-timeline">
              {[
                { hour: 'Hour 0', time: 'Aug 29, 6 AM', desc: 'Hurricane landfall — All apps online, syncing every 5 minutes', status: 'green' },
                { hour: 'Hour 12', time: '6 PM', desc: 'Cell towers failing — Apps detect degraded connectivity, switch to critical-only sync', status: 'yellow' },
                { hour: 'Hour 24', time: 'Aug 30, 6 AM', desc: 'Complete network outage — Apps enter offline mode, teams navigate with cached maps', status: 'red' },
                { hour: 'Hour 36', time: 'Partial restore', desc: 'Spotty 2G restored — Background sync uploads 47 queued reports, downloads 12 missions, merges 3 concurrent updates', status: 'yellow' },
                { hour: 'Hour 48', time: 'WiFi restored', desc: 'Full sync of all pending data — System back to real-time operation', status: 'green' },
              ].map((ev) => (
                <div key={ev.hour} className="offline-timeline__event">
                  <div className={`offline-timeline__dot offline-timeline__dot--${ev.status}`}/>
                  <div>
                    <div className="offline-timeline__hour">{ev.hour} <span className="offline-timeline__time">({ev.time})</span></div>
                    <div className="offline-timeline__desc">{ev.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="offline-scenario__result">
              <strong>Result:</strong> Zero data loss despite 36 hours of network outage
            </div>
          </div>
        </Reveal>

        {/* Sync flow diagram */}
        <Reveal className="mt-10">
          <div className="offline-sync-diagram">
            <h3 className="offline-sync-diagram__title">CRDT Sync Flow</h3>
            <div className="offline-sync-visual">
              <div className="offline-sync-col">
                <div className="offline-sync-device">Device A (Offline)</div>
                <div className="offline-sync-action">Report created<br/><code>{'vectorClock: {A:1}'}</code></div>
                <div className="offline-sync-action offline-sync-action--wait">Queued locally…</div>
                <div className="offline-sync-action offline-sync-action--online">→ ONLINE → Upload</div>
                <div className="offline-sync-action offline-sync-action--merge">← Merged version</div>
              </div>
              <div className="offline-sync-col offline-sync-col--center">
                <div className="offline-sync-device offline-sync-device--server">Firestore</div>
                <div className="offline-sync-action offline-sync-action--wait" style={{minHeight:60}}/>
                <div className="offline-sync-action offline-sync-action--wait" style={{minHeight:40}}/>
                <div className="offline-sync-action offline-sync-action--merge">
                  MERGE<br/><code>{'vectorClock: {A:1, B:1}'}</code><br/>Union of needs
                </div>
              </div>
              <div className="offline-sync-col">
                <div className="offline-sync-device">Device B (Offline)</div>
                <div className="offline-sync-action">Report created<br/><code>{'vectorClock: {B:1}'}</code></div>
                <div className="offline-sync-action offline-sync-action--wait">Queued locally…</div>
                <div className="offline-sync-action offline-sync-action--online">→ ONLINE → Upload</div>
                <div className="offline-sync-action offline-sync-action--merge">← Merged version</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
