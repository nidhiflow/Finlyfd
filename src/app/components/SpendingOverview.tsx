import { PieChart, Pie, Cell } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

// ─── Zero placeholder — single transparent segment so the donut ring renders ──
const EMPTY_DATA = [{ name: "empty", value: 1, color: "rgba(255,255,255,0.07)" }];

// ─── Category rows to show as "waiting" ────────────────────────────────────────
const PLACEHOLDER_CATS = [
  { name: "Food & Dining",   color: "#FF6B35", emoji: "🍽️" },
  { name: "Transport",       color: "#4895EF", emoji: "🚗" },
  { name: "Bills",           color: "#FFB703", emoji: "💡" },
  { name: "Entertainment",   color: "#F72585", emoji: "🎬" },
];

export function SpendingOverview() {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(124,92,255,0.18)" }}>
            <PieIcon className="w-3.5 h-3.5 text-[#9D7EFF]" />
          </div>
          <h3 className="text-white font-bold" style={{ fontSize: 15 }}>Spending Overview</h3>
        </div>
        <span className="px-2.5 py-1 rounded-xl font-semibold"
          style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.30)" }}>
          No data
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut — empty ghost ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <PieChart width={120} height={120}>
            <Pie
              data={EMPTY_DATA}
              cx={60} cy={60}
              innerRadius={36} outerRadius={54}
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none">
              {EMPTY_DATA.map((e, i) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Pie>
          </PieChart>

          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p style={{ fontSize: 18 }}>🍃</p>
            <p className="text-white/22 font-bold" style={{ fontSize: 11 }}>0%</p>
          </div>
        </div>

        {/* Category legend placeholders */}
        <div className="flex-1 space-y-2.5">
          {PLACEHOLDER_CATS.map(cat => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full opacity-25" style={{ background: cat.color }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", fontWeight: 600 }}>
                  {cat.emoji} {cat.name}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>₹0</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.14)" }}>0%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom empty-state nudge */}
      <div className="mt-4 pt-4 flex items-center justify-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          📊 Spending breakdown will appear after adding expenses
        </span>
      </div>
    </div>
  );
}
