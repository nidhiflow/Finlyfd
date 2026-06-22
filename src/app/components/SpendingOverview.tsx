import { useState, useEffect, useMemo } from "react";
import { PieChart as PieIcon, Utensils, Car, Lightbulb, Clapperboard } from "lucide-react";
import { useCategoryContext } from "../context/CategoryContext";
import { statsAPI } from "../services/api";

interface SpendingProps {
  month?: string; // YYYY-MM format
}

// ─── SVG Geometry constants for centered layout ─────────────────────────────────
const CX = 160, CY = 85;
const OUTER_R = 42, INNER_R = 26, LABEL_R = 64;
const LABEL_THRESHOLD = 5.0; // only label segments >= this %

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
  { name: "Food & Dining",   color: "#FF6B35", emoji: "🍽️", icon: Utensils },
  { name: "Transport",       color: "#4895EF", emoji: "🚗", icon: Car },
  { name: "Bills",           color: "#FFB703", emoji: "💡", icon: Lightbulb },
  { name: "Entertainment",   color: "#F72585", emoji: "🎬", icon: Clapperboard },
];

export function SpendingOverview({ month }: SpendingProps) {
  const { getCatById } = useCategoryContext();
  const [categories, setCategories] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    statsAPI.getCategoryBreakdown(month || "").then((data: any[]) => {
      const expenses = (data || []).filter((c: any) => c.type === 'expense');
      const total = expenses.reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);
      setTotalExpense(total);
      setCategories(expenses.map((c: any) => {
        const catData = getCatById(c.category_id || c.category_name);
        const IconComponent = catData?.icon || PieIcon;
        return {
        id: c.category_id || c.category_name || 'Unknown',
        name: c.category_name || c.name || 'Unknown',
        value: parseFloat(c.total || 0),
        color: c.color || '#D4A24C',
        emoji: c.icon || '📦',
        icon: IconComponent,
        percentage: total > 0 ? ((parseFloat(c.total || 0) / total) * 100) : 0,
      }}));
    }).catch(console.error);
  }, [month]);

  const hasData = categories.length > 0 && totalExpense > 0;
  
  const segments = useMemo(() => {
    if (!hasData) return [];
    return buildSegments(categories);
  }, [categories, hasData]);

  const displayCats = hasData ? categories : PLACEHOLDER_CATS.map((c, idx) => ({ ...c, id: `placeholder-${idx}`, value: 0, percentage: 0 }));

  // Filter labeled segments to avoid overlap on small slices
  const labeledSegs = useMemo(() => {
    return segments.filter(s => s.cat.percentage >= LABEL_THRESHOLD);
  }, [segments]);

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.02) 100%)",
        border: "1px solid var(--divider)",
      }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(212,162,76,0.18)" }}>
            <PieIcon className="w-3.5 h-3.5 text-[#D4A24C]" />
          </div>
          <h3 className="text-ink font-bold" style={{ fontSize: 15 }}>Spending Overview</h3>
        </div>
        <span className="px-2.5 py-1 rounded-xl font-semibold"
          style={{ fontSize: 11, background: hasData ? "rgba(212,162,76,0.15)" : "rgba(255,255,255,0.06)", color: hasData ? "#D4A24C" : "rgba(255,255,255,0.30)" }}>
          {hasData ? `₹${totalExpense.toLocaleString("en-IN")}` : "No data"}
        </span>
      </div>

      {/* Custom SVG Donut Chart with Connector Lines */}
      <div className="relative w-full h-[170px] flex items-center justify-center">
        <svg width="320" height="170" viewBox="0 0 320 170" style={{ overflow: "visible" }}>
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
              stroke="var(--divider)"
              strokeWidth={OUTER_R - INNER_R}
            />
          ) : (
            /* Interactive Segments & Pointers */
            <g>
              {/* Connector lines and outside labels */}
              {labeledSegs.map(({ cat, midAngle }) => {
                const connStart = p2c(CX, CY, OUTER_R + 3, midAngle);
                const connBend  = p2c(CX, CY, OUTER_R + 12, midAngle);
                const labelPt   = p2c(CX, CY, LABEL_R, midAngle);
                const isRight   = midAngle < 180;
                const labelX    = isRight ? labelPt.x + 4 : labelPt.x - 4;
                const anchor    = isRight ? "start" : "end";

                return (
                  <g key={`pointer-${cat.id}`}>
                    <polyline
                      points={`${connStart.x},${connStart.y} ${connBend.x},${connBend.y} ${labelPt.x},${labelPt.y}`}
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                    <circle cx={connStart.x} cy={connStart.y} r="1.5" fill={cat.color} fillOpacity="0.8" />
                    {/* Category Label */}
                    <foreignObject x={isRight ? labelX : labelX - 80} y={labelPt.y - 10} width={80} height={20}>
                      <div className={`flex items-center gap-1 w-full ${isRight ? 'justify-start' : 'justify-end'}`}>
                        {cat.icon && <cat.icon className="w-[11px] h-[11px] text-ink/85" strokeWidth={2} />}
                        <span className="text-[9px] font-semibold text-ink/85 leading-none truncate">
                          {cat.name.length > 8 ? cat.name.slice(0, 7) + '..' : cat.name}
                        </span>
                      </div>
                    </foreignObject>
                    {/* Percentage Label */}
                    <text x={labelX} y={labelPt.y + 6} textAnchor={anchor}
                      fill="rgba(255,255,255,0.4)" fontSize="8.5" fontFamily="Inter, sans-serif" fontWeight="500">
                      {cat.percentage.toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {/* Pie segments */}
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
                        d={arcPath(CX - tx, CY - ty, OUTER_R + 2, INNER_R - 2, startAngle, endAngle)}
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
              <p className="text-ink font-extrabold text-[13px] leading-tight">
                {categories.length}
              </p>
              <p className="text-ink/45 text-[8px] uppercase tracking-wider font-semibold">cats</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14 }}>🍃</p>
              <p className="text-ink/20 text-[8px] font-bold uppercase tracking-wider">0%</p>
            </>
          )}
        </div>
      </div>

      {/* Category Legend list (2-Column Grid for clean vertical space) */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {displayCats.slice(0, 6).map((cat: any) => {
          const isSel = selectedId === cat.id;
          return (
            <div key={cat.id}
              onClick={() => hasData && setSelectedId(prev => prev === cat.id ? null : cat.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all ${hasData ? "cursor-pointer hover:bg-ink/[0.03]" : ""}`}
              style={{
                background: isSel ? `${cat.color}15` : "transparent",
                border: isSel ? `1px solid ${cat.color}35` : "1px solid transparent",
              }}>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color, opacity: hasData ? 1 : 0.25 }} />
                <div className="flex items-center gap-1.5 truncate text-ink font-semibold leading-none" style={{ fontSize: 11, opacity: hasData ? 0.95 : 0.35 }}>
                  {cat.icon && <cat.icon className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  <span>{cat.name}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-1.5">
                <p className="font-bold leading-none" style={{ fontSize: 11, color: hasData ? (isSel ? "white" : cat.color) : "rgba(255,255,255,0.18)" }}>
                  ₹{(cat.value || 0).toLocaleString("en-IN")}
                </p>
                <p className="mt-0.5 leading-none" style={{ fontSize: 8.5, color: hasData ? "rgba(255,255,255,0.45)" : "var(--divider)" }}>
                  {(cat.percentage || 0).toFixed(0)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom helper text */}
      <div className="mt-4 pt-3 flex items-center justify-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 11, color: hasData ? "rgba(255,255,255,0.45)" : "var(--divider)" }}>
          {hasData ? "📊 Based on your expense transactions" : "📊 Spending breakdown will appear after adding expenses"}
        </span>
      </div>
    </div>
  );
}


