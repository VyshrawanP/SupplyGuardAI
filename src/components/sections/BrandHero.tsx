export function BrandHero() {
  return (
    <div className="hero-card">
      <p className="section-kicker">SupplyGuard AI Command Center</p>
      <h1 className="mt-3 max-w-3xl text-[36px] font-semibold leading-[1.02] text-white sm:text-[44px]">
        Real-street Bengaluru disaster coordination with a calmer, clearer operator view
      </h1>
      <p className="section-body max-w-2xl">
        Run the same simulation stack, response orchestration, and hospital-resource coordination on top of a real city map, but with a layout that lets the map lead and the decision context support it.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <span className="ops-chip">Live Bengaluru map</span>
        <span className="ops-chip">Scenario simulation</span>
        <span className="ops-chip">Offline-ready operations</span>
      </div>
    </div>
  );
}
