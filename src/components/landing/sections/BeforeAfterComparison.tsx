import { useEffect, useRef, useState } from 'react';

import { Reveal } from './Reveal';

const WITHOUT_STEPS = [
  { text: 'Ambulance dispatched', icon: '🚑', color: 'var(--text-secondary)' },
  { text: 'Drives to Hospital A → FULL (no beds)', icon: '✕', color: 'var(--critical)' },
  { text: 'Tries Hospital B → FULL (at capacity)', icon: '✕', color: 'var(--critical)' },
  { text: 'Tries Hospital C → DIVERSION', icon: '✕', color: 'var(--critical)' },
  { text: 'Finally Hospital D → 2 beds left', icon: '✓', color: 'var(--warning)' },
];

const WITH_STEPS = [
  { text: 'Ambulance dispatched', icon: '🚑', color: 'var(--text-secondary)' },
  { text: 'System checks all hospital capacity', icon: '🔍', color: 'var(--accent)' },
  { text: 'Hospital B has 12 ICU beds available', icon: '🏥', color: 'var(--success)' },
  { text: 'Routes directly — bed reserved', icon: '✓', color: 'var(--success)' },
  { text: 'Arrives → Bed waiting → Admitted', icon: '✓', color: 'var(--success)' },
];

export function BeforeAfterComparison() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="before-after-section">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
            Visual Impact
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
            The Difference Real-Time Bed Data Makes
          </h2>
        </Reveal>

        <div ref={ref} className="before-after-grid mt-10">
          {/* Without */}
          <div className="before-after-col before-after-col--without">
            <div className="before-after-col__header before-after-col__header--without">WITHOUT SUPPLYGUARD</div>
            <div className="before-after-steps">
              {WITHOUT_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`before-after-step${visible ? ' before-after-step--visible' : ''}`}
                  style={{ transitionDelay: visible ? `${i * 600}ms` : '0ms' }}
                >
                  <div className="before-after-step__icon" style={{ color: step.color }}>{step.icon}</div>
                  <div className="before-after-step__text">{step.text}</div>
                  {i < WITHOUT_STEPS.length - 1 && <div className="before-after-step__line"/>}
                </div>
              ))}
            </div>
            <div className="before-after-result before-after-result--bad">
              <div className="before-after-result__time">⏱ 59 min</div>
              <div className="before-after-result__outcome">🔴 Patient deteriorated</div>
            </div>
          </div>

          {/* With */}
          <div className="before-after-col before-after-col--with">
            <div className="before-after-col__header before-after-col__header--with">WITH SUPPLYGUARD</div>
            <div className="before-after-steps">
              {WITH_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`before-after-step${visible ? ' before-after-step--visible' : ''}`}
                  style={{ transitionDelay: visible ? `${i * 600}ms` : '0ms' }}
                >
                  <div className="before-after-step__icon" style={{ color: step.color }}>{step.icon}</div>
                  <div className="before-after-step__text">{step.text}</div>
                  {i < WITH_STEPS.length - 1 && <div className="before-after-step__line before-after-step__line--good"/>}
                </div>
              ))}
            </div>
            <div className="before-after-result before-after-result--good">
              <div className="before-after-result__time">⏱ 12 min</div>
              <div className="before-after-result__outcome">🟢 Patient stable</div>
            </div>
          </div>
        </div>

        {/* Impact stats */}
        <Reveal className="mt-8">
          <div className="before-after-stats">
            <div className="before-after-stat">
              <div className="before-after-stat__value">47 min</div>
              <div className="before-after-stat__label">saved per patient</div>
            </div>
            <div className="before-after-stat">
              <div className="before-after-stat__value">400–600</div>
              <div className="before-after-stat__label">estimated lives saved (Katrina)</div>
            </div>
            <div className="before-after-stat">
              <div className="before-after-stat__value">96%</div>
              <div className="before-after-stat__label">fewer hospital overflows</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
