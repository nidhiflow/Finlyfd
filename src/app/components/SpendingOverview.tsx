import { useState, useEffect, useMemo } from "react";
import { PieChart as PieIcon } from "lucide-react";
import { statsAPI } from "../services/api";

interface SpendingProps {
  month?: string; // YYYY-MM format
}

// ─── SVG Geometry constants ────────────────────────────────────────────────────
const CX = 60, CY = 60;
const OUTER_R = 48, INNER_R = 34;

function p2c(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, oR: number, iR: number, sA: number, eA: number) {
  const gap = 2.0; // gap angle between segments
  const s = sA + gap / 2, e = eA - gap / 2;
  if (e <= s) return "";
  const large = e - s > 180 ? 1 : 0;
  const os = p2c(cx, cy, oR, s), oe = p2c(cx, cy, oR, e);
  const is = p2c(cx, cy, iR, e), ie = p2c(cx, cy, iR, s);
  return `M${os.x} ${os.y} A${oR} ${oR} 0 ${large} 1 ${oe.x} ${oe.y} L${is.x} ${is.y} A${iR} ${iR} 0 ${large} 0 ${ie.x} ${ie.y}Z`;
}

interface SegInfo {
  cat: any;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

function buildSegments(data: any[]): SegInfo[] {
  let cum = 0;
  return data.map(cat => {
    const sweep = (cat.percentage / 100) * 360;
    const start = cum;
    cum += sweep;
    return { cat, startAngle: start, endAngle: cum, midAngle: start + sweep / 2 };
  });
}

// ─── Category placeholders to show when there's no transaction data ─────────────
const PLACEHOLDER_CATS = [
  { name: "Food & Dining",   color: "#FF6B35", emoji: "🍽️" },
  { name: "Transport",       color: "#4895EF", emoji: "🚗" },
  { name: "Bills",           color: "#FFB703", emoji: "💡" },
  { name: "Entertainment",   color: "#F72585", emoji: "🎬" },
];

export function SpendingOverview({ month }: SpendingProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    statsAPI.getCategoryBreakdown(month || "").then((data: any[]) => {
      const expenses = (data || []).filter((c: any) => c.type === 'expense');
      const total = expenses.reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);
      setTotalExpense(total);
      setCategories(expenses.map((c: any) => ({
        id: c.category_id || c.category_name || 'Unknown',
        name: c.category_name || c.name || 'Unknown',
        value: parseFloat(c.total || 0),
        color: c.color || '#7C5CFF',
        emoji: c.icon || '📦',
        percentage: total > 0 ? ((parseFloat(c.total || 0) / total) * 100) : 0,
      })));
    }).catch(console.error);
  }, [month]);

  const hasData = categories.length > 0 && totalExpense > 0;
  
  const segments = useMemo(() => {
    if (!hasData) return [];
    return buildSegments(categories);
  }, [categories, hasData]);

  const displayCats = hasData ? categories : PLACEHOLDER_CATS.map((c, idx) => ({ ...c, id: `placeholder-${idx}`, value: 0, percentage: 0 }));

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
        {/* Custom SVG Donut Chart */}
        <div className="relative flex-shrink-0 w-[120px] h-[120px] flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ overflow: "visible" }}>
            <defs>
              {/* Radial gradients per segment for rich depth */}
              {categories.map((cat) => (
                <radialGradient key={cat.id} id={`grad-dash-${cat.id}`} cx="35%" cy="35%" r="75%">
                  <stop offset="0%" stopColor={cat.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={cat.color} stopOpacity="0.75" />
                </radialGradient>
              ))}
              {/* Segment glow filter */}
              <filter id="seg-glow-dash" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {!hasData ? (
              /* Empty Ring Track */
              <circle
                cx={CX}
                cy={CY}
                r={(OUTER_R + INNER_R) / 2}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={OUTER_R - INNER_R}
              />
            ) : (
              /* Interactive Segments */
              <g>
                {segments.map(({ cat, startAngle, endAngle, midAngle }) => {
                  const isSelected = selectedId === cat.id;
                  const offset = isSelected ? 4 : 0;
                  const rad = (midAngle - 90) * Math.PI / 180;
                  const tx = Math.cos(rad) * offset;
                  const ty = Math.sin(rad) * offset;
                  const d = arcPath(CX, CY, OUTER_R, INNER_R, startAngle, endAngle);
                  return (
                    <g key={cat.id} transform={`translate(${tx},${ty})`} style={{ transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                      {isSelected && (
                        <path
                          d={arcPath(CX - tx, CY - ty, OUTER_R + 2.5, INNER_R - 2.5, startAngle, endAngle)}
                          fill={cat.color}
                          fillOpacity="0.15"
                        />
                      )}
                      <path
                        d={d}
                        fill={`url(#grad-dash-${cat.id})`}
                        filter={isSelected ? "url(#seg-glow-dash)" : "none"}
                        strokeWidth="0.5"
                        stroke="rgba(11,15,26,0.3)"
                        style={{ cursor: "pointer", transition: "filter 0.2s" }}
                        onClick={() => setSelectedId(prev => prev === cat.id ? null : cat.id)}
                      />
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* Center text label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
            {hasData ? (
              <>
                <p className="text-white font-extrabold text-[14px] leading-tight">
                  {categories.length}
                </p>
                <p className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">categories</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 16 }}>🍃</p>
                <p className="text-white/20 text-[9px] font-bold uppercase tracking-wider">0%</p>
              </>
            )}
          </div>
        </div>

        {/* Category Legend list */}
        <div className="flex-1 space-y-1">
          {displayCats.slice(0, 4).map((cat: any) => {
            const isSel = selectedId === cat.id;
            return (
              <div key={cat.id}
                onClick={() => hasData && setSelectedId(prev => prev === cat.id ? null : cat.id)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-xl transition-all ${hasData ? "cursor-pointer hover:bg-white/[0.03]" : ""}`}
                style={{
                  background: isSel ? `${cat.color}15` : "transparent",
                  border: isSel ? `1px solid ${cat.color}35` : "1px solid transparent",
                }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color, opacity: hasData ? 1 : 0.25 }} />
                  <span className="truncate text-white font-semibold" style={{ fontSize: 11.5, opacity: hasData ? 0.95 : 0.35 }}>
                    {cat.emoji} {cat.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold" style={{ fontSize: 12, color: hasData ? (isSel ? "white" : cat.color) : "rgba(255,255,255,0.18)" }}>
                    ₹{(cat.value || 0).toLocaleString("en-IN")}
                  </p>
                  <p style={{ fontSize: 9.5, color: hasData ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.14)" }}>
                    {(cat.percentage || 0).toFixed(0)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom helper text */}
      <div className="mt-4 pt-3 flex items-center justify-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 11, color: hasData ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.25)" }}>
          {hasData ? "📊 Based on your expense transactions" : "📊 Spending breakdown will appear after adding expenses"}
        </span>
      </div>
    </div>
  );
}
