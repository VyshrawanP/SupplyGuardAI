import { useEffect, useRef } from 'react';

import { Reveal } from './Reveal';

export function HospitalTechExplainer() {
  return (
    <section id="hospital-tech" className="tech-explainer-section">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
            Technical Architecture
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
            How Hospital Bed Tracking Actually Works
          </h2>
          <p className="landing-subtitle mt-4 max-w-2xl text-base leading-relaxed">
            Not hand-waving. Here's the complete data flow from hospital bed to ambulance dispatch.
          </p>
        </Reveal>

        {/* Data Sources */}
        <Reveal className="mt-10">
          <h3 className="tech-explainer__heading">Data Sources</h3>
          <div className="tech-explainer__sources">
            <div className="tech-source">
              <div className="tech-source__num">1</div>
              <div>
                <strong>Manual Updates (Command Center App)</strong>
                <p>Hospital coordinators input bed status every 30 min → Firestore <code>/hospitals/{'{id}'}/capacity</code></p>
              </div>
            </div>
            <div className="tech-source">
              <div className="tech-source__num">2</div>
              <div>
                <strong>Auto-Updates (Rescue Team App)</strong>
                <p>When rescue team delivers patient → Increments occupied beds → Adds patient to inbound queue → Updates ETA</p>
              </div>
            </div>
            <div className="tech-source">
              <div className="tech-source__num">3</div>
              <div>
                <strong>Predictive Modeling (ML Service)</strong>
                <p>Estimates discharge rates based on time of day, historical patterns, severity distribution → Adjusts "available" count predictions</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Update Frequency */}
        <Reveal className="mt-8">
          <div className="tech-explainer__freq">
            <div className="tech-freq-item">
              <span className="tech-freq-label">Real-time sync</span>
              <span className="tech-freq-value">Firestore listeners {'<'}200ms latency</span>
            </div>
            <div className="tech-freq-item">
              <span className="tech-freq-label">Offline fallback</span>
              <span className="tech-freq-value">CRDT merge when reconnected</span>
            </div>
            <div className="tech-freq-item">
              <span className="tech-freq-label">Staleness indicator</span>
              <span className="tech-freq-value">Shows "Last update: X min ago"</span>
            </div>
          </div>
        </Reveal>

        {/* Capacity Calculation */}
        <Reveal className="mt-10">
          <h3 className="tech-explainer__heading">Capacity Calculation</h3>
          <div className="tech-formula">
            <pre className="tech-formula__code">{`available_beds = total_beds
                 - occupied_beds
                 - incoming_patients
                 - reserved_beds
                 + predicted_discharges (next 2 hours)`}</pre>
          </div>
          <div className="tech-example">
            <div className="tech-example__title">Example: Memorial Hospital</div>
            <div className="tech-example__rows">
              <div className="tech-example__row"><span>Total</span><span>240 beds</span></div>
              <div className="tech-example__row"><span>Occupied</span><span>198 beds</span></div>
              <div className="tech-example__row"><span>Incoming</span><span>3 ambulances</span></div>
              <div className="tech-example__row"><span>Reserved</span><span>2 beds</span></div>
              <div className="tech-example__row"><span>Predicted discharges</span><span>+8 beds (2h)</span></div>
              <div className="tech-example__row tech-example__row--result"><span>→ Available</span><span style={{color:'var(--success)'}}>45 beds ✅</span></div>
            </div>
          </div>
        </Reveal>

        {/* Routing Algorithm */}
        <Reveal className="mt-10">
          <h3 className="tech-explainer__heading">Routing Algorithm</h3>
          <p className="text-sm mb-4" style={{color:'var(--text-secondary)'}}>When an ambulance needs a hospital:</p>
          <div className="tech-algo-steps">
            {[
              { step: 'FILTER', desc: 'Find hospitals within 50km radius' },
              { step: 'MATCH', desc: 'Match required capability — ICU? Trauma? Burn unit?' },
              { step: 'RANK', desc: <><code>score = (beds × 0.5) + (1/distance × 0.3) + (1/ETA × 0.2)</code></> },
              { step: 'RESERVE', desc: 'Optimistic lock on bed — 30-minute timeout with auto-release' },
              { step: 'ROUTE', desc: 'OSRM turn-by-turn navigation with offline cached fallback' },
            ].map((s, i) => (
              <div key={s.step} className="tech-algo-step">
                <div className="tech-algo-step__num">{i + 1}</div>
                <div>
                  <strong className="tech-algo-step__label">{s.step}</strong>
                  <p className="tech-algo-step__desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Edge Cases */}
        <Reveal className="mt-10">
          <h3 className="tech-explainer__heading">Edge Cases Handled</h3>
          <div className="tech-edge-cases">
            <div className="tech-edge-case tech-edge-case--warn">
              <div className="tech-edge-case__title">Race condition (2 ambulances, 1 bed)</div>
              <p>Firestore transaction ensures only one reservation wins. Second ambulance gets rerouted to next-best hospital automatically.</p>
            </div>
            <div className="tech-edge-case tech-edge-case--info">
              <div className="tech-edge-case__title">Stale data (hospital offline)</div>
              <p>Shows staleness indicator: "Updated 15 min ago ⚠️" — Still routes there but warns operator of uncertainty.</p>
            </div>
            <div className="tech-edge-case tech-edge-case--crit">
              <div className="tech-edge-case__title">All hospitals full</div>
              <p>Triggers "overflow mode" — Dispatches to hospital with shortest wait time and alerts command center to request additional capacity.</p>
            </div>
          </div>
        </Reveal>

        {/* Tech Stack */}
        <Reveal className="mt-10">
          <div className="tech-stack-summary">
            <div className="tech-stack-col">
              <h4>Backend</h4>
              <ul>
                <li>hospital-capacity-service (Node.js + TypeScript)</li>
                <li>Firestore for real-time sync</li>
                <li>Pub/Sub for capacity change events</li>
                <li>OSRM for routing calculations</li>
              </ul>
            </div>
            <div className="tech-stack-col">
              <h4>Frontend</h4>
              <ul>
                <li>Flutter Riverpod for state management</li>
                <li>Firestore listeners for live updates</li>
                <li>Google Maps Flutter for visualization</li>
              </ul>
            </div>
            <div className="tech-stack-col">
              <h4>Algorithms</h4>
              <ul>
                <li>Haversine distance (nearest hospital)</li>
                <li>Weighted scoring (capacity + distance + ETA)</li>
                <li>Firestore transactions (race prevention)</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
