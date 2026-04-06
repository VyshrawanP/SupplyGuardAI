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
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-cyan-50">Live Bengaluru map</span>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-emerald-50">Scenario simulation</span>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-amber-50">Offline-ready operations</span>
      </div>
    </div>
  );
}
