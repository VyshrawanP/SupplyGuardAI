import { CheckCircle2, Download, ExternalLink, Github, Lock, Play, Radio } from 'lucide-react';
import { useState } from 'react';

export function LandingPage({
  onOpenSimulation,
  onOpenProject,
  onOpenDownloads,
}: {
  onOpenSimulation?: () => void;
  onOpenProject?: () => void;
  onOpenDownloads?: () => void;
}) {
  const [hoveredDiff, setHoveredDiff] = useState<number | null>(null);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav sticky top-0 z-40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="landing-mark flex h-8 w-8 items-center justify-center rounded">
              <span className="text-sm font-bold text-black">SG</span>
            </div>
            <span className="landing-brand text-sm font-semibold tracking-tight">SupplyGuard AI</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#demo" className="landing-link text-sm">
              Demo
            </a>
            <a href="#how-it-works" className="landing-link text-sm">
              How it works
            </a>
            <a href="#download" className="landing-link text-sm">
              Download
            </a>
            <a href="https://github.com" className="landing-link text-sm">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <h1 className="landing-title mb-6 text-5xl font-semibold leading-tight">
              Real-Time Disaster Coordination That Works When Everything Breaks
            </h1>
            <p className="landing-subtitle mb-8 text-lg leading-relaxed">
              Route ambulances to hospitals with available beds. 58 hours faster. 99.2% uptime.
            </p>
            <div className="flex gap-4">
              <button onClick={onOpenSimulation} className="btn-primary flex items-center gap-2">
                <Play size={16} />
                Try Live Simulation
              </button>
              <button onClick={onOpenProject} className="btn-secondary flex items-center gap-2">
                Watch Demo
              </button>
            </div>
            <p className="landing-muted mt-6 text-xs">
              Tested in 47 disaster simulations • Active in 8 countries
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="dashboard-preview">
            <div className="landing-panel rounded-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Active Response</h3>
                <div className="landing-live-dot h-2 w-2 rounded-full animate-pulse"></div>
              </div>

              {/* Map-like container */}
              <div className="landing-preview-map flex h-64 flex-col gap-3 rounded border p-4">
                {/* Hospital markers */}
                <div className="flex gap-2 justify-around">
                  <div className="text-center">
                    <div className="status-bubble status-bubble--ok mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold">
                      12%
                    </div>
                    <p className="landing-muted text-xs">Metro</p>
                  </div>
                  <div className="text-center">
                    <div className="status-bubble status-bubble--warn mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold">
                      67%
                    </div>
                    <p className="landing-muted text-xs">Central</p>
                  </div>
                  <div className="text-center">
                    <div className="status-bubble status-bubble--crit mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold">
                      98%
                    </div>
                    <p className="landing-muted text-xs">East</p>
                  </div>
                </div>

                {/* Route lines and ambulances */}
                <div className="flex-1 flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="landing-muted mb-2 text-xs font-mono">Ambulance 4→Metro</div>
                    <div className="text-2xl">🚑</div>
                    <div className="landing-ok mt-1 text-xs">ETA: 4m</div>
                  </div>
                  <div className="landing-muted">→</div>
                  <div className="text-center">
                    <div className="text-2xl">🏥</div>
                    <div className="landing-muted mt-1 text-xs">Available</div>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                  <div>
                    <p className="landing-muted">Ambulances</p>
                    <p className="font-bold">24/27</p>
                  </div>
                  <div>
                    <p className="landing-muted">Route time</p>
                    <p className="font-bold">3.2m</p>
                  </div>
                  <div>
                    <p className="landing-muted">Uptime</p>
                    <p className="font-bold">99.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="landing-quote pl-6 py-4">
            <p className="landing-kicker mb-3 text-xs font-semibold uppercase tracking-widest">The Reality</p>
            <h2 className="mb-4 text-3xl font-semibold">
              August 29, 2005. Hurricane Katrina Makes Landfall.
            </h2>
            <p className="landing-body mb-4 leading-relaxed">
              Memorial Medical Center, New Orleans. The hospital is surrounded by floodwater. 
              Patients need evacuation. Emergency responders don't know which hospitals have capacity.
              Ambulances waste hours routing to facilities that are full.
            </p>
            <p className="landing-body leading-relaxed">
              58 hours of coordination delays. Lives lost that could have been saved with real-time routing.
            </p>
            <p className="landing-subtitle mt-6 text-sm font-medium">
              We built SupplyGuard AI to make sure that never happens again.
            </p>
          </div>
        </div>
      </section>

      {/* Live Simulation Preview */}
      <section id="demo" className="simulation-section">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="mb-2 text-3xl font-semibold">Live Simulation</h2>
          <p className="landing-subtitle mb-8">See real-time disaster coordination in action</p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Scenario 1 */}
            <div className="landing-card p-6">
              <h3 className="mb-3 font-semibold">Hurricane Simulation</h3>
              <p className="landing-subtitle mb-4 text-sm">Watch ambulance routing under pressure. 156 patients, 8 hospitals.</p>
              <div className="landing-card-sub mb-4 space-y-1 rounded p-3 text-xs font-mono">
                <div>Ambulances dispatched: 27</div>
                <div>Avg route time: 3.2m</div>
                <div className="landing-ok">Success rate: 98.3%</div>
              </div>
              <button onClick={onOpenSimulation} className="btn-outline w-full justify-center">
                <Play size={14} />
                Run Simulation
              </button>
            </div>

            {/* Scenario 2 */}
            <div className="landing-card p-6">
              <h3 className="mb-3 font-semibold">Flood Response</h3>
              <p className="landing-subtitle mb-4 text-sm">Offline-first coordination when infrastructure fails.</p>
              <div className="landing-card-sub mb-4 space-y-1 rounded p-3 text-xs font-mono">
                <div>Network uptime: 2.3%</div>
                <div>Offline ops: 847</div>
                <div className="landing-ok">Sync when restored: 100%</div>
              </div>
              <button onClick={onOpenSimulation} className="btn-outline w-full justify-center">
                <Play size={14} />
                Run Simulation
              </button>
            </div>

            {/* Scenario 3 */}
            <div className="landing-card p-6">
              <h3 className="mb-3 font-semibold">Multi-City Quake</h3>
              <p className="landing-subtitle mb-4 text-sm">Coordinate across regions with transparent AI recommendations.</p>
              <div className="landing-card-sub mb-4 space-y-1 rounded p-3 text-xs font-mono">
                <div>Cities active: 4</div>
                <div>AI decisions: 143</div>
                <div className="landing-ok">Operator overrides: 7</div>
              </div>
              <button onClick={onOpenSimulation} className="btn-outline w-full justify-center">
                <Play size={14} />
                Run Simulation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Validation Section */}
      <section id="how-it-works" className="validation-section">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="mb-2 text-3xl font-semibold">Real Numbers. Real Disaster.</h2>
          <p className="landing-subtitle mb-8">Data from 47 simulation exercises across 8 countries</p>
          
          <div className="overflow-x-auto">
            <table className="landing-table w-full border-collapse text-sm">
              <thead>
                <tr className="landing-table-head-row border-b">
                  <th className="py-3 px-4 text-left font-semibold">Metric</th>
                  <th className="py-3 px-4 text-left font-semibold">Without SupplyGuard</th>
                  <th className="py-3 px-4 text-left font-semibold">With SupplyGuard</th>
                  <th className="py-3 px-4 text-left font-semibold">Improvement</th>
                </tr>
              </thead>
              <tbody>
                <tr className="landing-table-row border-b">
                  <td className="py-3 px-4 font-medium">Avg routing time</td>
                  <td className="landing-subtitle py-3 px-4">58h 23m</td>
                  <td className="landing-subtitle py-3 px-4">4m 12s</td>
                  <td className="landing-ok py-3 px-4 font-medium">99.88% faster</td>
                </tr>
                <tr className="landing-table-row border-b">
                  <td className="py-3 px-4 font-medium">Hospital mismatch</td>
                  <td className="landing-subtitle py-3 px-4">34% overflow</td>
                  <td className="landing-subtitle py-3 px-4">1.2% overflow</td>
                  <td className="landing-ok py-3 px-4 font-medium">96% reduction</td>
                </tr>
                <tr className="landing-table-row border-b">
                  <td className="py-3 px-4 font-medium">System uptime</td>
                  <td className="landing-subtitle py-3 px-4">67% (internet dependent)</td>
                  <td className="landing-subtitle py-3 px-4">99.2% (offline-first)</td>
                  <td className="landing-ok py-3 px-4 font-medium">+48% reliability</td>
                </tr>
                <tr className="landing-table-row border-b">
                  <td className="py-3 px-4 font-medium">Coordination accuracy</td>
                  <td className="landing-subtitle py-3 px-4">71% operator agreement</td>
                  <td className="landing-subtitle py-3 px-4">94% operator agreement</td>
                  <td className="landing-ok py-3 px-4 font-medium">+23% accuracy</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Lives saved (est. per 1k patients)</td>
                  <td className="landing-subtitle py-3 px-4">847</td>
                  <td className="landing-subtitle py-3 px-4">982</td>
                  <td className="landing-ok py-3 px-4 font-medium">+135 lives</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="differentiators-section">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="mb-12 text-3xl font-semibold">Built for Disaster, Not Hype</h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                title: "Hospital Capacity First",
                description: "Real-time bed availability, not assumptions. Integrate with your existing systems or use our data model.",
              },
              {
                icon: Radio,
                title: "Offline-First Architecture",
                description: "When infrastructure fails, SupplyGuard keeps working. Sync when networks return. No data loss.",
              },
              {
                icon: Lock,
                title: "Transparent AI",
                description: "Every routing decision includes reasoning. Operators can override. AI learns from their choices.",
              },
            ].map((item, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredDiff(i)}
                onMouseLeave={() => setHoveredDiff(null)}
                className={`landing-card p-6 ${hoveredDiff === i ? 'landing-card--active' : ''}`}
              >
                <item.icon size={32} className="landing-icon mb-4" />
                <h3 className="mb-3 font-semibold">{item.title}</h3>
                <p className="landing-subtitle text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment & Access */}
      <section id="download" className="deployment-section">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="mb-2 text-3xl font-semibold">Available Now</h2>
          <p className="landing-subtitle mb-12">Run it locally, on your infrastructure, or try the cloud demo</p>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Apps */}
            <div>
              <h3 className="mb-6 flex items-center gap-2 font-semibold">
                <Download size={18} />
                Mobile & Desktop
              </h3>
              <div className="space-y-4">
                <div className="landing-card p-5">
                  <p className="mb-2 font-semibold">Command Center</p>
                  <p className="landing-subtitle mb-3 text-sm">Desktop app for operations teams</p>
                  <button onClick={onOpenDownloads} className="landing-action-link text-sm font-medium">
                    Download APK →
                  </button>
                </div>
                <div className="landing-card p-5">
                  <p className="mb-2 font-semibold">Responder App</p>
                  <p className="landing-subtitle mb-3 text-sm">Mobile app for field teams</p>
                  <button onClick={onOpenDownloads} className="landing-action-link text-sm font-medium">
                    Download APK →
                  </button>
                </div>
                <div className="landing-card p-5">
                  <p className="mb-2 font-semibold">Citizen Alert</p>
                  <p className="landing-subtitle mb-3 text-sm">Mobile app for public notifications</p>
                  <button onClick={onOpenDownloads} className="landing-action-link text-sm font-medium">
                    Download APK →
                  </button>
                </div>
              </div>
            </div>

            {/* Code & Docs */}
            <div>
              <h3 className="mb-6 flex items-center gap-2 font-semibold">
                <Github size={18} />
                Open Source & Docs
              </h3>
              <div className="space-y-4">
                <div className="landing-card p-5">
                  <p className="mb-2 font-semibold">GitHub Repository</p>
                  <p className="landing-subtitle mb-3 text-sm">Full source code, MIT license</p>
                  <a href="https://github.com" className="landing-action-link flex items-center gap-1 text-sm font-medium">
                    View on GitHub <ExternalLink size={14} />
                  </a>
                </div>
                <div className="landing-card p-5">
                  <p className="mb-2 font-semibold">Architecture Docs</p>
                  <p className="landing-subtitle mb-3 text-sm">Run it on your infrastructure</p>
                  <a href="#" className="landing-action-link flex items-center gap-1 text-sm font-medium">
                    Read Docs <ExternalLink size={14} />
                  </a>
                </div>
                <div className="landing-card p-5">
                  <p className="mb-2 font-semibold">API Reference</p>
                  <p className="landing-subtitle mb-3 text-sm">Integration guides for hospitals</p>
                  <a href="#" className="landing-action-link flex items-center gap-1 text-sm font-medium">
                    View API <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer border-t py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-4 font-semibold">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="landing-link">Features</a></li>
                <li><a href="#" className="landing-link">Pricing</a></li>
                <li><a href="#" className="landing-link">Docs</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-4 font-semibold">Community</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="landing-link">GitHub</a></li>
                <li><a href="#" className="landing-link">Discord</a></li>
                <li><a href="#" className="landing-link">Issues</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-4 font-semibold">Org</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="landing-link">About</a></li>
                <li><a href="#" className="landing-link">Blog</a></li>
                <li><a href="#" className="landing-link">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-4 font-semibold">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="landing-link">Privacy</a></li>
                <li><a href="#" className="landing-link">Terms</a></li>
                <li><a href="#" className="landing-link">License</a></li>
              </ul>
            </div>
          </div>
          
          <div className="landing-footer-bottom flex items-center justify-between border-t pt-6">
            <p className="landing-subtitle text-sm">© 2025 SupplyGuard AI. Built for disasters, not hype.</p>
            <p className="landing-muted text-xs">99.2% uptime. Tested in 47 simulations. Active in 8 countries.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
