import { Sparkles, ArrowRightLeft, Zap, ShieldAlert, RefreshCw, Cpu } from 'lucide-react';
import { GeminiInsight, useStore } from '../../store/useStore';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../lib/utils';

export function GeminiInsights({
  insights,
}: {
  insights: GeminiInsight[];
}) {
  const isAILoading = useStore((state) => state.isAILoading);
  const fetchGeminiInsights = useStore((state) => state.fetchGeminiInsights);

  return (
    <GlassCard className="border-indigo-500/20 bg-indigo-500/5 p-4 relative overflow-hidden">
      {isAILoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-semibold tracking-wide text-indigo-100">Gemini Reasoning</h2>
        </div>
        <button 
          onClick={() => fetchGeminiInsights()}
          disabled={isAILoading}
          className="rounded-full p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30"
          title="Refresh AI Insights"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isAILoading && "animate-spin")} />
        </button>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className="group relative rounded-2xl border border-white/5 bg-black/20 p-3 transition-colors hover:border-indigo-500/30">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {insight.type === 'reroute' && <ArrowRightLeft className="h-3 w-3 text-indigo-400" />}
                {insight.type === 'dispatch' && <Zap className="h-3 w-3 text-amber-400" />}
                {insight.type === 'risk' && <ShieldAlert className="h-3 w-3 text-rose-400" />}
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  {insight.type} Insight
                </span>
              </div>
              {insight.isRealAI && (
                <div className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-1.5 py-0.5 border border-indigo-500/20">
                  <Cpu className="h-2.5 w-2.5 text-indigo-400" />
                  <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-tighter">Real-time</span>
                </div>
              )}
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              {insight.message}
            </p>
            <div className="absolute -left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-indigo-500/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-[10px] text-white/30">
        <div className={cn("h-1 w-1 rounded-full animate-pulse", insights.some(i => i.isRealAI) ? "bg-indigo-400" : "bg-emerald-400")} />
        <span>{insights.some(i => i.isRealAI) ? "Gemini 2.5 Flash reasoning active" : "Local simulation optimization active"}</span>
      </div>
    </GlassCard>
  );
}
