export function ScoreBar({ label, value, max = 1, color }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  const bg = color || (pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-green-500');
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-slate-500 truncate">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className={`${bg} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-slate-600 font-mono">{value.toFixed(2)}</span>
    </div>
  );
}
