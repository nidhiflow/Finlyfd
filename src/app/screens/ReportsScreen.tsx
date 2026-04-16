import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Sparkles, TrendingUp, TrendingDown, ArrowLeft, BarChart2, X,
} from "lucide-react";
import { statsAPI } from "../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PeriodType = "daily" | "weekly" | "monthly" | "annual" | "custom";
type ChartType  = "expense" | "income";

interface SubData {
  id: string; name: string; emoji: string;
  color: string; amount: number; percentage: number;
}
interface CatData {
  id: string; name: string; emoji: string;
  color: string; amount: number; percentage: number;
  trend: number; // % change vs last period
  subs: SubData[];
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const EXPENSE_APR: CatData[] = [];

const INCOME_APR: CatData[] = [];

// Comparison data (March 2026)
const EXPENSE_MAR: CatData[] = [];
const INCOME_MAR: CatData[] = [];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PERIOD_OPTIONS: {id: PeriodType; label: string; emoji: string}[] = [
  {id:"daily",   label:"Daily",         emoji:"📅"},
  {id:"weekly",  label:"Weekly",        emoji:"📊"},
  {id:"monthly", label:"Monthly",       emoji:"📆"},
  {id:"annual",  label:"Annually",      emoji:"📈"},
  {id:"custom",  label:"Custom Period", emoji:"⏳"},
];

// ─── SVG Geometry ──────────────────────────────────────────────────────────────
const CX = 180, CY = 155;
const OUTER_R = 82, INNER_R = 48, LABEL_R = 116;
const LABEL_THRESHOLD = 5.5; // only label segments >= this %

function p2c(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, oR: number, iR: number, sA: number, eA: number) {
  const gap = 1.2;
  const s = sA + gap / 2, e = eA - gap / 2;
  if (e <= s) return "";
  const large = e - s > 180 ? 1 : 0;
  const os = p2c(cx, cy, oR, s), oe = p2c(cx, cy, oR, e);
  const is = p2c(cx, cy, iR, e), ie = p2c(cx, cy, iR, s);
  return `M${os.x} ${os.y} A${oR} ${oR} 0 ${large} 1 ${oe.x} ${oe.y} L${is.x} ${is.y} A${iR} ${iR} 0 ${large} 0 ${ie.x} ${ie.y}Z`;
}

interface SegInfo { cat: CatData|SubData; startAngle: number; endAngle: number; midAngle: number; }

function buildSegments(data: (CatData|SubData)[]): SegInfo[] {
  let cum = 0;
  return data.map(cat => {
    const sweep = (cat.percentage / 100) * 360;
    const start = cum;
    cum += sweep;
    return { cat, startAngle: start, endAngle: cum, midAngle: start + sweep / 2 };
  });
}

// ─── useChartAnimation ─────────────────────────────────────────────────────────
function useAnimKey(dep: unknown) {
  const [key, setKey] = useState(0);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setKey(k => k + 1);
  }, [dep]);
  return key;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR = (n: number) =>
  n >= 100000 ? `₹${(n/100000).toFixed(2)}L`
  : n >= 1000  ? `₹${(n/1000).toFixed(1)}K`
  : `₹${n}`;

const fmtFull = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

// ─── Pie SVG ───────────────────────────────────────────────────────────────────
function PieChartSVG({
  data, selectedId, onSelect, chartType,
}: {
  data: (CatData|SubData)[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  chartType: ChartType;
}) {
  const segments = buildSegments(data);
  const animKey = useAnimKey(data.map(d => d.id).join(","));
  const total = data.reduce((s, d) => s + d.amount, 0);
  const selected = data.find(d => d.id === selectedId);
  const accentColor = chartType === "income" ? "#22C55E" : "#7C5CFF";

  // Labels: only for segments above threshold
  const labeledSegs = segments.filter(s => s.cat.percentage >= LABEL_THRESHOLD);

  return (
    <svg width="360" height="310" viewBox="0 0 360 310" style={{ overflow: "visible" }}>
      <defs>
        {/* Radial gradients per segment */}
        {segments.map(({ cat }) => (
          <radialGradient key={cat.id} id={`grad-${cat.id}`} cx="35%" cy="35%" r="75%">
            <stop offset="0%" stopColor={cat.color} stopOpacity="1" />
            <stop offset="100%" stopColor={cat.color} stopOpacity="0.75" />
          </radialGradient>
        ))}
        {/* Glow filter */}
        <filter id="seg-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Drop shadow for chart */}
        <filter id="chart-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor={accentColor} floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Background ring (track) */}
      <circle cx={CX} cy={CY} r={(OUTER_R + INNER_R) / 2}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={OUTER_R - INNER_R}
      />

      {/* Pie segments */}
      <AnimatePresence mode="wait">
        <motion.g
          key={animKey}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          filter="url(#chart-shadow)"
        >
          {segments.map(({ cat, startAngle, endAngle, midAngle }) => {
            const isSelected = selectedId === cat.id;
            const offset = isSelected ? 10 : 0;
            const rad = (midAngle - 90) * Math.PI / 180;
            const tx = Math.cos(rad) * offset;
            const ty = Math.sin(rad) * offset;
            const d = arcPath(CX, CY, OUTER_R, INNER_R, startAngle, endAngle);
            return (
              <g key={cat.id} transform={`translate(${tx},${ty})`}>
                {isSelected && (
                  <path d={arcPath(CX - tx, CY - ty, OUTER_R + 4, INNER_R - 4, startAngle, endAngle)}
                    fill={cat.color} fillOpacity="0.18" />
                )}
                <path
                  d={d}
                  fill={`url(#grad-${cat.id})`}
                  filter={isSelected ? "url(#seg-glow)" : "none"}
                  strokeWidth={isSelected ? "0" : "0.5"}
                  stroke="rgba(11,15,26,0.5)"
                  style={{ cursor: "pointer", transition: "filter 0.2s" }}
                  onClick={() => onSelect(cat.id)}
                />
              </g>
            );
          })}
        </motion.g>
      </AnimatePresence>

      {/* Connector lines and labels */}
      <AnimatePresence>
        {labeledSegs.map(({ cat, midAngle }, idx) => {
          const connStart = p2c(CX, CY, OUTER_R + 7, midAngle);
          const connBend  = p2c(CX, CY, OUTER_R + 22, midAngle);
          const labelPt   = p2c(CX, CY, LABEL_R, midAngle);
          const isRight   = midAngle < 180;
          const labelX    = isRight ? labelPt.x + 6 : labelPt.x - 6;
          const anchor    = isRight ? "start" : "end";

          return (
            <motion.g key={cat.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.35 + idx * 0.05, duration: 0.25 }}>
              <polyline
                points={`${connStart.x},${connStart.y} ${connBend.x},${connBend.y} ${labelPt.x},${labelPt.y}`}
                fill="none" stroke={cat.color} strokeWidth="1" strokeOpacity="0.55"
                strokeDasharray="0"
              />
              <circle cx={connStart.x} cy={connStart.y} r="2" fill={cat.color} fillOpacity="0.7" />
              {/* Label bubble */}
              <text x={labelX} y={labelPt.y - 5} textAnchor={anchor}
                fill="rgba(255,255,255,0.85)" fontSize="11" fontFamily="Inter,sans-serif" fontWeight="600">
                {cat.emoji} {cat.percentage.toFixed(1)}%
              </text>
              <text x={labelX} y={labelPt.y + 7} textAnchor={anchor}
                fill={cat.color} fontSize="10" fontFamily="Inter,sans-serif" fontWeight="500">
                {fmtINR(cat.amount)}
              </text>
            </motion.g>
          );
        })}
      </AnimatePresence>

      {/* Center info */}
      <motion.g
        key={selectedId ?? "total"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      >
        {selected ? (
          <>
            <text x={CX} y={CY - 14} textAnchor="middle"
              fill="rgba(255,255,255,0.42)" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="600"
              letterSpacing="0.4">SELECTED</text>
            <text x={CX} y={CY + 4} textAnchor="middle"
              fill="white" fontSize="21" fontFamily="Inter,sans-serif" fontWeight="700">
              {selected.emoji}
            </text>
            <text x={CX} y={CY + 20} textAnchor="middle"
              fill={selected.color} fontSize="13" fontFamily="Inter,sans-serif" fontWeight="700">
              {selected.percentage.toFixed(1)}%
            </text>
            <text x={CX} y={CY + 34} textAnchor="middle"
              fill="rgba(255,255,255,0.55)" fontSize="10" fontFamily="Inter,sans-serif">
              {fmtINR(selected.amount)}
            </text>
          </>
        ) : (
          <>
            <text x={CX} y={CY - 14} textAnchor="middle"
              fill="rgba(255,255,255,0.38)" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="600"
              letterSpacing="0.4">{chartType === "expense" ? "TOTAL SPENT" : "TOTAL EARNED"}</text>
            <text x={CX} y={CY + 8} textAnchor="middle"
              fill="white" fontSize="20" fontFamily="Inter,sans-serif" fontWeight="800">
              {fmtINR(total)}
            </text>
            <text x={CX} y={CY + 24} textAnchor="middle"
              fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="Inter,sans-serif">
              {data.length} categories
            </text>
          </>
        )}
      </motion.g>
    </svg>
  );
}

// ─── Period Dropdown ───────────────────────────────────────────────────────────
function PeriodDropdown({ period, onChange }: { period: PeriodType; onChange: (p: PeriodType) => void }) {
  const [open, setOpen] = useState(false);
  const cur = PERIOD_OPTIONS.find(p => p.id === period)!;
  return (
    <div className="relative">
      <motion.button whileTap={{ scale: 0.94 }} onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all"
        style={{
          background: open ? "rgba(124,92,255,0.2)" : "rgba(255,255,255,0.07)",
          border: `1px solid ${open ? "rgba(124,92,255,0.4)" : "rgba(255,255,255,0.1)"}`,
        }}>
        <span style={{ fontSize: 13 }}>{cur.emoji}</span>
        <span className="text-white font-semibold" style={{ fontSize: 12 }}>{cur.label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-white/45" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full mt-2 rounded-2xl py-1.5 z-50 min-w-[170px]"
            style={{
              background: "linear-gradient(180deg,#1C2440 0%,#141C30 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
            }}>
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/5"
                style={{ fontSize: 13 }}>
                <span>{opt.emoji}</span>
                <span style={{ color: period === opt.id ? "#9D7EFF" : "rgba(255,255,255,0.72)", fontWeight: period === opt.id ? 700 : 400 }}>
                  {opt.label}
                </span>
                {period === opt.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7C5CFF]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Insight Banner ────────────────────────────────────────────────────────────
function InsightBanner({ data, chartType }: { data: CatData[]; chartType: ChartType }) {
  const top = data[0];
  const biggest = data.reduce((a, b) => b.amount > a.amount ? b : a, data[0]);
  const text = chartType === "expense"
    ? `You spent ${biggest.percentage}% on ${biggest.name} this month ${biggest.emoji}`
    : `${biggest.name} is your top income source at ${biggest.percentage}% ${biggest.emoji}`;

  return (
    <div className="mx-4 mb-3 rounded-2xl px-4 py-3.5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,rgba(124,92,255,0.14) 0%,rgba(76,201,240,0.07) 100%)",
        border: "1px solid rgba(124,92,255,0.25)",
      }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(124,92,255,0.22) 0%,transparent 70%)" }} />
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)" }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{text}</p>
          {top.trend !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              {top.trend > 0
                ? <TrendingUp className="w-3 h-3 text-rose-400" />
                : <TrendingDown className="w-3 h-3 text-emerald-400" />}
              <p style={{ fontSize: 11, color: top.trend > 0 ? "#F87171" : "#4ADE80" }}>
                {top.name} {top.trend > 0 ? "increased" : "decreased"} by {Math.abs(top.trend)}% vs last month
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Category Row ──────────────────────────────────────────────────────────────
function CategoryRow({
  cat, rank, isSelected, compareAmt, showCompare, onTap,
}: {
  cat: CatData | SubData;
  rank: number;
  isSelected: boolean;
  compareAmt?: number;
  showCompare: boolean;
  onTap: () => void;
}) {
  const trend = (cat as CatData).trend ?? 0;
  const hasSubs = (cat as CatData).subs?.length > 0;

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.975 }}
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
      style={{
        background: isSelected
          ? `linear-gradient(135deg,${cat.color}18 0%,${cat.color}08 100%)`
          : "rgba(255,255,255,0.03)",
        border: isSelected
          ? `1px solid ${cat.color}40`
          : "1px solid rgba(255,255,255,0.06)",
        marginBottom: 6,
      }}>
      {/* Rank badge */}
      <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: `${cat.color}22`, border: `1px solid ${cat.color}35` }}>
        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold truncate" style={{ fontSize: 13 }}>{cat.name}</p>
          {hasSubs && (
            <span className="px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ fontSize: 9, fontWeight: 700, background: `${cat.color}22`, color: cat.color }}>
              DRILL
            </span>
          )}
        </div>
        {showCompare && compareAmt !== undefined && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
            Last month: {fmtINR(compareAmt)}
            <span className="ml-1.5" style={{ color: cat.amount > compareAmt ? "#F87171" : "#4ADE80" }}>
              {cat.amount > compareAmt ? "↑" : "↓"} {Math.abs(Math.round((cat.amount - compareAmt) / compareAmt * 100))}%
            </span>
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <p className="font-bold" style={{ fontSize: 14, color: cat.color }}>{fmtINR(cat.amount)}</p>
        <div className="flex items-center gap-1.5">
          {/* % pill */}
          <span className="px-2 py-0.5 rounded-full"
            style={{ fontSize: 10, fontWeight: 800, background: `${cat.color}22`, color: cat.color }}>
            {cat.percentage.toFixed(1)}%
          </span>
          {/* Trend */}
          {trend !== 0 && (
            <div className="flex items-center gap-0.5">
              {trend > 0
                ? <TrendingUp className="w-2.5 h-2.5 text-rose-400" />
                : <TrendingDown className="w-2.5 h-2.5 text-emerald-400" />}
              <span style={{ fontSize: 9, color: trend > 0 ? "#F87171" : "#4ADE80" }}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function ReportsScreen() {
  const [chartType, setChartType] = useState<ChartType>("expense");
  const [period, setPeriod]       = useState<PeriodType>("monthly");
  const [month, setMonth]         = useState(new Date().getMonth()); // current month
  const [year, setYear]           = useState(new Date().getFullYear());
  const [selectedSeg, setSelectedSeg] = useState<string | null>(null);
  const [drillCat, setDrillCat]       = useState<CatData | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expenseData, setExpenseData] = useState<CatData[]>([]);
  const [incomeData, setIncomeData] = useState<CatData[]>([]);
  const [summaryData, setSummaryData] = useState({ income: 0, expense: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Load data from API
  useEffect(() => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    setIsLoading(true);
    Promise.all([
      statsAPI.getCategoryBreakdown(monthStr),
      statsAPI.getSummary(monthStr),
    ]).then(([breakdown, summary]) => {
      // breakdown is array: [{category_id, category_name, icon, color, total, type}]
      const allCats = breakdown || [];
      const totalExpense = allCats.filter((c: any) => c.type === 'expense').reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);
      const totalIncome = allCats.filter((c: any) => c.type === 'income').reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);

      const mapCats = (cats: any[], total: number): CatData[] => cats.map((c: any) => ({
        id: c.category_id || c.id,
        name: c.category_name || c.name || 'Unknown',
        emoji: c.icon || '📦',
        color: c.color || '#7C5CFF',
        amount: parseFloat(c.total || 0),
        percentage: total > 0 ? (parseFloat(c.total || 0) / total) * 100 : 0,
        trend: 0,
        subs: [],
      }));

      setExpenseData(mapCats(allCats.filter((c: any) => c.type === 'expense'), totalExpense));
      setIncomeData(mapCats(allCats.filter((c: any) => c.type === 'income'), totalIncome));
      setSummaryData({ income: summary?.income || 0, expense: summary?.expense || 0 });
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [month, year]);

  const hasTransactions = expenseData.length > 0 || incomeData.length > 0;

  // Current data based on type
  const mainData   = chartType === "expense" ? expenseData : incomeData;
  const compareData: CatData[] = [];

  // Drilldown
  const displayData: (CatData | SubData)[] = drillCat ? drillCat.subs : mainData;

  const totalIncome  = summaryData.income;
  const totalExpense = summaryData.expense;
  const ratioPercent = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

  const prevPeriod = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedSeg(null); setDrillCat(null);
  };
  const nextPeriod = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedSeg(null); setDrillCat(null);
  };

  const handleSegClick = (id: string) => {
    setSelectedSeg(prev => prev === id ? null : id);
  };

  const handleDrilldown = (catId: string) => {
    const cat = mainData.find(c => c.id === catId) as CatData;
    if (!cat || !cat.subs?.length) return;
    setDrillCat(cat);
    setSelectedSeg(null);
  };

  const handleBack = () => {
    setDrillCat(null);
    setSelectedSeg(null);
  };

  const periodLabel =
    period === "monthly" ? `${MONTHS[month]} ${year}` :
    period === "annual"  ? `FY ${year}` :
    period === "weekly"  ? `Week ${Math.ceil((new Date(year, month, 15).getDay() + 15) / 7)}, ${year}` :
    period === "daily"   ? `${MONTHS[month]} 15, ${year}` :
    "Custom Period";

  const accentIncome  = "#22C55E";
  const accentExpense = "#F72585";
  const pieAccent     = chartType === "income" ? accentIncome : accentExpense;

  // Empty state (future: no data)
  const isEmpty = displayData.length === 0;

  return (
    <div className="relative pb-32"
      style={{ background: "linear-gradient(180deg,#0B0F1A 0%,#121826 100%)", minHeight: "calc(100vh - 56px)" }}>

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%,${pieAccent}12 0%,transparent 70%)`,
          transition: "background 0.4s" }} />

      {/* ── Period Selector ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.88 }} onClick={prevPeriod}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ChevronLeft className="w-4 h-4 text-white/55" />
          </motion.button>
          <div className="text-center">
            <p className="text-white font-bold" style={{ fontSize: 15 }}>{periodLabel}</p>
            {drillCat && (
              <p style={{ fontSize: 11, color: drillCat.color }}>
                {drillCat.emoji} {drillCat.name}
              </p>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={nextPeriod}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ChevronRight className="w-4 h-4 text-white/55" />
          </motion.button>
        </div>
        <PeriodDropdown period={period} onChange={p => { setPeriod(p); setSelectedSeg(null); setDrillCat(null); }} />
      </div>

      {/* ── Summary Metrics ── */}
      {hasTransactions && (
        <div className="px-4 mb-3">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Income card */}
            <div className="rounded-2xl px-4 py-3.5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.14),rgba(34,197,94,0.06))", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(34,197,94,0.2) 0%,transparent 70%)" }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "0.6px" }}>INCOME</p>
              <p className="font-bold mt-1" style={{ fontSize: 16, color: "#4ADE80" }}>
                {fmtFull(totalIncome)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span style={{ fontSize: 10, color: "#4ADE80" }}>+₹90K business</span>
              </div>
            </div>
            {/* Expense card */}
            <div className="rounded-2xl px-4 py-3.5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,rgba(247,37,133,0.14),rgba(247,37,133,0.06))", border: "1px solid rgba(247,37,133,0.25)" }}>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(247,37,133,0.2) 0%,transparent 70%)" }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "0.6px" }}>EXPENSES</p>
              <p className="font-bold mt-1" style={{ fontSize: 16, color: "#F87171" }}>
                {fmtFull(totalExpense)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-rose-400" />
                <span style={{ fontSize: 10, color: "#F87171" }}>+15% investments</span>
              </div>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Expense ratio</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: ratioPercent > 70 ? "#F87171" : "#4ADE80" }}>
                {ratioPercent}% of income spent
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${ratioPercent}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                style={{ background: `linear-gradient(90deg,#22C55E,${ratioPercent > 70 ? "#F72585" : "#4CC9F0"})` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Income / Expense Pie Toggle ── */}
      {hasTransactions && (
        <div className="px-4 mb-1">
          <div className="relative flex p-1 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl"
              animate={{ left: chartType === "expense" ? 4 : "calc(50%)" }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              style={{
                background: chartType === "expense"
                  ? "linear-gradient(135deg,#F72585 0%,#7C5CFF 100%)"
                  : "linear-gradient(135deg,#22C55E 0%,#4CC9F0 100%)",
                boxShadow: chartType === "expense"
                  ? "0 4px 14px rgba(247,37,133,0.3)"
                  : "0 4px 14px rgba(34,197,94,0.3)",
              }} />
            {(["expense","income"] as ChartType[]).map(t => (
              <button key={t}
                onClick={() => { setChartType(t); setSelectedSeg(null); setDrillCat(null); }}
                className="relative flex-1 py-2.5 rounded-xl z-10 flex items-center justify-center gap-2">
                <span style={{ fontSize: 13, fontWeight: 700, color: chartType === t ? "white" : "rgba(255,255,255,0.35)" }}>
                  {t === "expense" ? "💸 Expenses" : "💰 Income"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Drilldown Back Button ── */}
      <AnimatePresence>
        {drillCat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
            className="px-4 pt-2">
            <button onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: `${drillCat.color}18`, border: `1px solid ${drillCat.color}35` }}>
              <ArrowLeft className="w-3.5 h-3.5" style={{ color: drillCat.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: drillCat.color }}>
                Back to {chartType === "expense" ? "Expense" : "Income"} Categories
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PIE CHART ── */}
      {!isEmpty ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={drillCat?.id ?? "root"}
            initial={{ opacity: 0, x: drillCat ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: drillCat ? -20 : 20 }}
            transition={{ duration: 0.3 }}
          >
            <PieChartSVG
              data={displayData}
              selectedId={selectedSeg}
              onSelect={handleSegClick}
              chartType={chartType}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 gap-4 mx-4">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{ background: "linear-gradient(135deg,rgba(124,92,255,0.1),rgba(76,201,240,0.05))", border: "1px solid rgba(124,92,255,0.2)" }}>
            📊
          </div>
          <div className="text-center">
            <p className="text-white font-bold mb-1" style={{ fontSize: 17 }}>No data available</p>
            <p className="text-white/45" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Start adding income or expenses<br />to see your financial reports
            </p>
          </div>
        </div>
      )}

      {/* ── AI Insight ── */}
      {!drillCat && !isEmpty && (
        <InsightBanner data={mainData} chartType={chartType} />
      )}

      {/* ── Compare Toggle ── */}
      {!drillCat && hasTransactions && (
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between py-3 px-4 rounded-2xl"
            style={{ background: compareMode ? "linear-gradient(135deg,rgba(124,92,255,0.12),rgba(76,201,240,0.06))" : "rgba(255,255,255,0.04)", border: compareMode ? "1px solid rgba(124,92,255,0.25)" : "1px solid rgba(255,255,255,0.07)", transition: "all 0.3s" }}>
            <div className="flex items-center gap-2.5">
              <BarChart2 className="w-4 h-4" style={{ color: compareMode ? "#7C5CFF" : "rgba(255,255,255,0.45)" }} />
              <p className="font-medium" style={{ fontSize: 13, color: compareMode ? "white" : "rgba(255,255,255,0.65)" }}>Compare with last month</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setCompareMode(v => !v)}
              className="w-11 h-6 rounded-full relative"
              style={{ background: compareMode ? "linear-gradient(135deg,#7C5CFF,#4CC9F0)" : "rgba(255,255,255,0.12)" }}>
              <motion.div
                animate={{ x: compareMode ? 23 : 2 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
            </motion.button>
          </div>
        </div>
      )}

      {/* ── Comparison Analytics (only when compare mode ON) ── */}
      <AnimatePresence>
        {compareMode && !drillCat && hasTransactions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 mb-4 overflow-hidden"
          >
            {/* Summary insight cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(124,92,255,0.08)", border: "1px solid rgba(124,92,255,0.2)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>THIS MONTH</p>
                <p className="font-bold mt-1" style={{ fontSize: 17, color: "#9D7EFF" }}>
                  {fmtFull(mainData.reduce((s, c) => s + c.amount, 0))}
                </p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>LAST MONTH</p>
                <p className="font-bold mt-1" style={{ fontSize: 17, color: "rgba(255,255,255,0.55)" }}>
                  {fmtFull(compareData.reduce((s, c) => s + c.amount, 0))}
                </p>
              </div>
            </div>

            {/* Side-by-side comparison bars */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white/40 font-semibold mb-2" style={{ fontSize: 11, letterSpacing: "0.5px" }}>CATEGORY COMPARISON</p>
              {mainData.map((cat) => {
                const prev = compareData.find(c => c.id === cat.id);
                const prevAmt = prev?.amount || 0;
                const maxAmt = Math.max(cat.amount, prevAmt);
                const change = prevAmt > 0 ? Math.round(((cat.amount - prevAmt) / prevAmt) * 100) : 0;
                const isIncrease = change > 0;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                        <span className="text-white/80 font-medium" style={{ fontSize: 12 }}>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {change !== 0 && (
                          <span className="flex items-center gap-0.5" style={{ fontSize: 11, color: isIncrease ? "#F87171" : "#4ADE80" }}>
                            {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(change)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Current month bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 w-8" style={{ fontSize: 9 }}>Now</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                          animate={{ width: `${maxAmt > 0 ? (cat.amount / maxAmt) * 100 : 0}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          style={{ background: cat.color }} />
                      </div>
                      <span className="text-white/60 w-14 text-right font-semibold" style={{ fontSize: 10 }}>{fmtINR(cat.amount)}</span>
                    </div>
                    {/* Last month bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-white/20 w-8" style={{ fontSize: 9 }}>Prev</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                          animate={{ width: `${maxAmt > 0 ? (prevAmt / maxAmt) * 100 : 0}%` }}
                          transition={{ duration: 0.6, delay: 0.15 }}
                          style={{ background: cat.color, opacity: 0.35 }} />
                      </div>
                      <span className="text-white/35 w-14 text-right" style={{ fontSize: 10 }}>{fmtINR(prevAmt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Insight cards */}
            {(() => {
              let highestIncrease = { name: "", pct: 0, emoji: "" };
              let highestDecrease = { name: "", pct: 0, emoji: "" };
              mainData.forEach(cat => {
                const prev = compareData.find(c => c.id === cat.id);
                if (!prev || prev.amount === 0) return;
                const pct = Math.round(((cat.amount - prev.amount) / prev.amount) * 100);
                if (pct > highestIncrease.pct) highestIncrease = { name: cat.name, pct, emoji: cat.emoji };
                if (pct < highestDecrease.pct) highestDecrease = { name: cat.name, pct, emoji: cat.emoji };
              });
              return (
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  {highestIncrease.pct > 0 && (
                    <div className="rounded-2xl px-3 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-rose-400" />
                        <span style={{ fontSize: 10, color: "#F87171", fontWeight: 700 }}>MOST INCREASED</span>
                      </div>
                      <p className="text-white font-semibold" style={{ fontSize: 13 }}>{highestIncrease.emoji} {highestIncrease.name}</p>
                      <p style={{ fontSize: 11, color: "#F87171" }}>+{highestIncrease.pct}%</p>
                    </div>
                  )}
                  {highestDecrease.pct < 0 && (
                    <div className="rounded-2xl px-3 py-3" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingDown className="w-3 h-3 text-emerald-400" />
                        <span style={{ fontSize: 10, color: "#4ADE80", fontWeight: 700 }}>MOST DECREASED</span>
                      </div>
                      <p className="text-white font-semibold" style={{ fontSize: 13 }}>{highestDecrease.emoji} {highestDecrease.name}</p>
                      <p style={{ fontSize: 11, color: "#4ADE80" }}>{highestDecrease.pct}%</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Breakdown List ── */}
      {hasTransactions && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: pieAccent }} />
            <p className="text-white/38 font-semibold" style={{ fontSize: 11, letterSpacing: "0.5px" }}>
              {drillCat
                ? `${drillCat.emoji} ${drillCat.name} BREAKDOWN`
                : `${chartType === "expense" ? "EXPENSE" : "INCOME"} BREAKDOWN`}
            </p>
            {selectedSeg && (
              <button onClick={() => setSelectedSeg(null)}
                className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                <X className="w-2.5 h-2.5" />
                Clear
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {displayData.map((cat, i) => {
              const compareCat = !drillCat ? compareData.find(c => c.id === cat.id) : undefined;
              return (
                <motion.div key={cat.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }} transition={{ delay: i * 0.04, duration: 0.2 }}>
                  <CategoryRow
                    cat={cat}
                    rank={i + 1}
                    isSelected={selectedSeg === cat.id}
                    compareAmt={compareCat?.amount}
                    showCompare={compareMode && !drillCat}
                    onTap={() => {
                      handleSegClick(cat.id);
                      if ((cat as CatData).subs?.length) handleDrilldown(cat.id);
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Total row */}
          {displayData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: displayData.length * 0.04 + 0.1 }}
              className="mt-2 flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: `${pieAccent}10`, border: `1px solid ${pieAccent}25` }}>
              <p className="text-white/55 font-semibold" style={{ fontSize: 13 }}>
                {drillCat ? "Subtotal" : chartType === "expense" ? "Total Expenses" : "Total Income"}
              </p>
              <p className="font-bold" style={{ fontSize: 15, color: pieAccent }}>
                {fmtFull(displayData.reduce((s, c) => s + c.amount, 0))}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}