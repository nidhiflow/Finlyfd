import { useState, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { statsAPI } from "../services/api";

// ─── Zero placeholder — single transparent segment so the donut ring renders ──
const EMPTY_DATA = [{ name: "empty", value: 1, color: "rgba(255,255,255,0.07)" }];

// ─── Category rows to show as "waiting" ────────────────────────────────────────
const PLACEHOLDER_CATS = [
  { name: "Food & Dining",   color: "#FF6B35", emoji: "🍽️" },
  { name: "Transport",       color: "#4895EF", emoji: "🚗" },
  { name: "Bills",           color: "#FFB703", emoji: "💡" },
  { name: "Entertainment",   color: "#F72585", emoji: "🎬" },
];

interface SpendingProps {
  month?: string; // YYYY-MM format
}

export function SpendingOverview({ month }: SpendingProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    statsAPI.getCategoryBreakdown(month).then((data: any[]) => {
      const expenses = (data || []).filter((c: any) => c.type === 'expense');
      const total = expenses.reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);
      setTotalExpense(total);
      setCategories(expenses.map((c: any) => ({
        name: c.category_name || c.name || 'Unknown',
        value: parseFloat(c.total || 0),
        color: c.color || '#7C5CFF',
        emoji: c.icon || '📦',
        percentage: total > 0 ? ((parseFloat(c.total || 0) / total) * 100) : 0,
      })));
    }).catch(console.error);
  }, [month]);

  const hasData = categories.length > 0 && totalExpense > 0;
  const chartData = hasData ? categories : EMPTY_DATA;
  const displayCats = hasData ? categories : PLACEHOLDER_CATS.map(c => ({ ...c, value: 0, percentage: 0 }));

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
          style={{ fontSize: 11, background: hasData ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.06)", color: hasData ? "#9D7EFF" : "rgba(255,255,255,0.30)" }}>
          {hasData ? `₹${totalExpense.toLocaleString("en-IN")}` : "No data"}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <PieChart width={120} height={120}>
            <Pie
              data={chartData}
              cx={60} cy={60}
              innerRadius={36} outerRadius={54}
              paddingAngle={hasData ? 2 : 0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none">
              {chartData.map((e: any, i: number) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Pie>
          </PieChart>

          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {hasData ? (
              <>
                <p className="text-white font-bold" style={{ fontSize: 13 }}>
                  {categories.length}
                </p>
                <p className="text-white/40" style={{ fontSize: 9 }}>categories</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 18 }}>🍃</p>
                <p className="text-white/22 font-bold" style={{ fontSize: 11 }}>0%</p>
              </>
            )}
          </div>
        </div>

        {/* Category legend */}
        <div className="flex-1 space-y-2.5">
          {displayCats.slice(0, 4).map((cat: any) => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: cat.color, opacity: hasData ? 1 : 0.25 }} />
                <span style={{ fontSize: 12, color: hasData ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.28)", fontWeight: 600 }}>
                  {cat.emoji} {cat.name}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ fontSize: 12, color: hasData ? cat.color : "rgba(255,255,255,0.18)" }}>
                  ₹{(cat.value || 0).toLocaleString("en-IN")}
                </p>
                <p style={{ fontSize: 10, color: hasData ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.14)" }}>
                  {(cat.percentage || 0).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nudge */}
      <div className="mt-4 pt-4 flex items-center justify-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 12, color: hasData ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.25)" }}>
          {hasData ? "📊 Based on your expense transactions" : "📊 Spending breakdown will appear after adding expenses"}
        </span>
      </div>
    </div>
  );
}
