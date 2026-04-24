import { useEffect, useRef } from 'react';

import { Reveal } from './Reveal';

const OTHERS_HAVE = [
  'Route tracking and optimization',
  'Supply inventory management',
  'Alert and notification systems',
  'Map-based visualization',
  'Mobile apps for field teams',
  '"AI-powered" features',
];

const ONLY_WE_HAVE = [
  { icon: '🏥', title: 'Real-Time Hospital Capacity Integration', items: ['ICU bed availability tracking', 'Trauma room capacity monitoring', 'Burn unit status', 'Auto-routing to available beds', 'Bed reservation during dispatch'] },
  { icon: '📱', title: 'True Offline-First Architecture', items: ['CRDT conflict-free state sync', 'Works at 0% network availability', 'Vector clock merge on reconnection'] },
  { icon: '🧠', title: 'Transparent AI Decision Logs', items: ['Immutable audit trail', 'Every decision explained (Gemini)', 'Operator override capability'] },
  { icon: '✅', title: 'Historical Disaster Validation', items: ['Katrina replay (58 hours faster)', 'Cyclone Fani replay (6 hours early detection)', 'Chaos testing (99.2% uptime)'] },
];

const TABLE_ROWS = [
  { cap: 'Route tracking', others: '✓', us: '✓', usNote: '' },
  { cap: 'Hospital capacity', others: '✗', us: '✓', usNote: 'Real-time' },
  { cap: 'Offline mode', others: 'Caching', us: 'CRDT sync', usNote: '' },
  { cap: 'API resilience', others: 'Retry logic', us: 'Circuit breakers', usNote: '' },
  { cap: 'AI integration', others: 'Features', us: 'Explanation only', usNote: '' },
  { cap: 'Disaster validation', others: '✗', us: 'Katrina + Fani replay', usNote: '' },
  { cap: 'Production testing', others: '✗', us: '99.2% uptime', usNote: 'Chaos tested' },
];

export function CompetitorComparison() {
  return (
    <section id="comparison" className="competitor-section">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
            Competitive Analysis
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
            Why Other Disaster Apps Can't Do This
          </h2>
        </Reveal>

        {/* What others have */}
        <Reveal className="mt-10">
          <div className="competitor-block competitor-block--others">
            <div className="competitor-block__label">What 95% of Solution Challenge disaster projects have:</div>
            <ul className="competitor-checklist">
              {OTHERS_HAVE.map(item => (
                <li key={item} className="competitor-checklist__item competitor-checklist__item--muted">
                  <span className="competitor-check competitor-check--muted">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="competitor-stop">
              <span>⚠️</span> STOPS HERE — Most teams assume hospital data integration is "out of scope" or "too complex"
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-2">
          <div className="competitor-arrow">↓</div>
        </Reveal>

        {/* What only we have */}
        <Reveal className="mt-2">
          <div className="competitor-block competitor-block--us">
            <div className="competitor-block__label">What only SupplyGuard has:</div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>✓ Everything above PLUS:</p>
            <div className="competitor-unique-grid">
              {ONLY_WE_HAVE.map(cat => (
                <div key={cat.title} className="competitor-unique-card">
                  <div className="competitor-unique-card__header">
                    <span className="competitor-unique-card__icon">{cat.icon}</span>
                    <h4>{cat.title}</h4>
                  </div>
                  <ul>
                    {cat.items.map(item => (
                      <li key={item} className="competitor-unique-item">
                        <span className="competitor-check competitor-check--us">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Technical depth comparison table */}
        <Reveal className="mt-10">
          <h3 className="text-lg font-semibold mb-4">Technical Depth Comparison</h3>
          <div className="competitor-table-wrap">
            <table className="competitor-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Other Teams</th>
                  <th>SupplyGuard</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(row => (
                  <tr key={row.cap}>
                    <td>{row.cap}</td>
                    <td className={row.others === '✗' ? 'competitor-cell--no' : 'competitor-cell--muted'}>{row.others}</td>
                    <td className="competitor-cell--yes">
                      {row.us}
                      {row.usNote && <span className="competitor-cell__note">{row.usNote}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
