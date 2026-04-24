import { useEffect, useState } from 'react';

const PHASES = [
  { id: 'markers',  label: 'Disaster markers detected',  duration: 5000 },
  { id: 'capacity', label: 'Hospital capacity updating',  duration: 5000 },
  { id: 'routing',  label: 'Calculating ambulance route', duration: 5000 },
  { id: 'alert',    label: 'Alert dispatched',            duration: 5000 },
  { id: 'hospital', label: 'Hospital detail view',        duration: 5000 },
  { id: 'complete', label: 'Patient routed to open bed',  duration: 5000 },
] as const;

const HOSPITALS = [
  { name: 'Metro General', x: 68, y: 28, beds: 240, used: 29 },
  { name: 'Central Med',   x: 42, y: 55, beds: 180, used: 155 },
  { name: 'East District',  x: 78, y: 72, beds: 120, used: 118 },
];

export function HeroDemoPreview({ onOpenSimulation }: { onOpenSimulation?: () => void }) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const dur = PHASES[phaseIdx].duration;
    const t = setTimeout(() => setPhaseIdx((p) => (p + 1) % PHASES.length), dur);
    return () => clearTimeout(t);
  }, [phaseIdx]);

  const showMarkers  = phaseIdx >= 0;
  const showCapacity = phaseIdx >= 1;
  const showRoute    = phaseIdx >= 2;
  const showAlert    = phaseIdx >= 3;
  const showHospital = phaseIdx >= 4;
  const showComplete = phaseIdx >= 5;

  return (
    <div className="hero-demo" id="hero-demo-preview">
      <div className="hero-demo__screen">
        {/* Map background */}
        <div className="hero-demo__map">
          <svg className="hero-demo__grid" viewBox="0 0 400 300" preserveAspectRatio="none">
            {[50,100,150,200,250,300,350].map(x=>(
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={300} stroke="rgba(30,41,59,0.5)" strokeWidth="0.5"/>
            ))}
            {[50,100,150,200,250].map(y=>(
              <line key={`h${y}`} x1={0} y1={y} x2={400} y2={y} stroke="rgba(30,41,59,0.5)" strokeWidth="0.5"/>
            ))}
            <rect x="60" y="40" width="80" height="50" rx="4" fill="rgba(20,28,43,0.8)" stroke="rgba(30,41,59,0.6)" strokeWidth="0.5"/>
            <rect x="180" y="30" width="100" height="70" rx="4" fill="rgba(20,28,43,0.8)" stroke="rgba(30,41,59,0.6)" strokeWidth="0.5"/>
            <rect x="60" y="120" width="120" height="60" rx="4" fill="rgba(20,28,43,0.8)" stroke="rgba(30,41,59,0.6)" strokeWidth="0.5"/>
            <rect x="220" y="130" width="90" height="50" rx="4" fill="rgba(20,28,43,0.8)" stroke="rgba(30,41,59,0.6)" strokeWidth="0.5"/>
            <rect x="100" y="210" width="80" height="50" rx="4" fill="rgba(20,28,43,0.8)" stroke="rgba(30,41,59,0.6)" strokeWidth="0.5"/>
            <rect x="240" y="200" width="100" height="60" rx="4" fill="rgba(20,28,43,0.8)" stroke="rgba(30,41,59,0.6)" strokeWidth="0.5"/>
            <line x1="150" y1="0" x2="150" y2="300" stroke="rgba(51,65,85,0.4)" strokeWidth="2"/>
            <line x1="0" y1="110" x2="400" y2="110" stroke="rgba(51,65,85,0.4)" strokeWidth="2"/>
            <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(51,65,85,0.4)" strokeWidth="2"/>
            <line x1="320" y1="0" x2="320" y2="300" stroke="rgba(51,65,85,0.4)" strokeWidth="2"/>
          </svg>

          {/* Disaster markers */}
          {showMarkers && <>
            <div className="hero-demo__marker hero-demo__marker--disaster" style={{left:'22%',top:'35%'}}>
              <span className="hero-demo__marker-ring"/>⚠
            </div>
            <div className="hero-demo__marker hero-demo__marker--disaster" style={{left:'55%',top:'65%',animationDelay:'0.5s'}}>
              <span className="hero-demo__marker-ring"/>⚠
            </div>
            <div className="hero-demo__marker hero-demo__marker--disaster" style={{left:'35%',top:'80%',animationDelay:'1s'}}>
              <span className="hero-demo__marker-ring"/>🌊
            </div>
          </>}

          {/* Hospital markers */}
          {HOSPITALS.map((h,i) => {
            const pct = showCapacity ? (i===0?12:i===1?(showComplete?86:67):98) : 0;
            const c = pct<50?'var(--success)':pct<80?'var(--warning)':'var(--critical)';
            return (
              <div key={h.name} className={`hero-demo__hospital${showHospital&&i===0?' hero-demo__hospital--selected':''}`} style={{left:`${h.x}%`,top:`${h.y}%`}}>
                <div className="hero-demo__hospital-dot" style={{background:showCapacity?c:'var(--text-muted)'}}/>
                <span className="hero-demo__hospital-label">{h.name}</span>
              </div>
            );
          })}

          {/* Ambulance route */}
          {showRoute && (
            <svg className="hero-demo__route-svg" viewBox="0 0 400 300" preserveAspectRatio="none">
              <path d="M 130,240 Q 150,200 150,150 Q 150,110 200,100 Q 250,90 272,84" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="8 4" className="hero-demo__route-path"/>
            </svg>
          )}

          {showRoute && <div className={`hero-demo__ambulance${showComplete?' hero-demo__ambulance--arrived':''}`}>🚑</div>}

          {/* Hospital detail panel */}
          {showHospital && (
            <div className="hero-demo__detail-panel">
              <div className="hero-demo__detail-name">Metro General Hospital</div>
              <div className="hero-demo__detail-row"><span>ICU Beds</span><span style={{color:'var(--success)'}}>211 / 240</span></div>
              <div className="hero-demo__detail-row"><span>Trauma</span><span style={{color:'var(--success)'}}>Available</span></div>
              <div className="hero-demo__detail-row"><span>Incoming</span><span>3 patients</span></div>
              <div className="hero-demo__detail-bar"><div className="hero-demo__detail-bar-fill" style={{width:'12%'}}/></div>
            </div>
          )}
        </div>

        {/* Capacity sidebar */}
        <div className="hero-demo__sidebar">
          <div className="hero-demo__sidebar-title">Hospital Status</div>
          {HOSPITALS.map((h,i) => {
            const pct = showCapacity?(i===0?12:i===1?(showComplete?86:67):98):0;
            const c = pct<50?'var(--success)':pct<80?'var(--warning)':'var(--critical)';
            return (
              <div key={h.name} className="hero-demo__sidebar-item">
                <div className="hero-demo__sidebar-name">{h.name}</div>
                <div className="hero-demo__sidebar-bar">
                  <div className="hero-demo__sidebar-bar-fill" style={{width:showCapacity?`${pct}%`:'0%',background:c,transition:'width 1.5s cubic-bezier(0.4,0,0.2,1), background 0.5s ease'}}/>
                </div>
                <div className="hero-demo__sidebar-pct" style={{color:c}}>{showCapacity?`${pct}%`:'—'}</div>
              </div>
            );
          })}
        </div>

        {/* Alert notification */}
        {showAlert && (
          <div className="hero-demo__alert">
            <div className="hero-demo__alert-icon">🔔</div>
            <div>
              <div className="hero-demo__alert-title">Routing Alert</div>
              <div className="hero-demo__alert-body">Ambulance rerouted to Metro General — 12 ICU beds available</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="hero-demo__controls">
        <div className="hero-demo__live"><span className="hero-demo__live-dot"/>LIVE SIMULATION</div>
        <div className="hero-demo__phase">{PHASES[phaseIdx].label}</div>
        <button onClick={onOpenSimulation} className="hero-demo__cta">Open Full Dashboard →</button>
      </div>

      {/* Progress bar */}
      <div className="hero-demo__progress">
        {PHASES.map((p,i) => (
          <div key={p.id} className={`hero-demo__progress-seg${i<=phaseIdx?' hero-demo__progress-seg--active':''}${i===phaseIdx?' hero-demo__progress-seg--current':''}`}/>
        ))}
      </div>
    </div>
  );
}
