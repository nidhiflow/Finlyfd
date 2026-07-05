import { useState, useEffect, useRef, ComponentType } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Sparkles, TrendingUp, TrendingDown, ArrowLeft, BarChart2, X,
  Calendar, CalendarDays, CalendarClock, Download
} from "lucide-react";
import { toast } from "sonner";
import { statsAPI } from "../services/api";
import { DateRangePicker } from "../components/DateRangePicker";
import { useCategoryContext } from "../context/CategoryContext";
import { exportReportPDF } from "../utils/pdf";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PeriodType = "daily" | "weekly" | "monthly" | "annual" | "custom";
type ChartType  = "expense" | "income";

interface SubData {
  id: string; name: string; emoji: string; icon?: any;
  color: string; amount: number; percentage: number;
}
interface CatData {
  id: string; name: string; emoji: string; icon?: any;
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
const PERIOD_OPTIONS: {id: PeriodType; label: string; icon: ComponentType<any>}[] = [
  {id:"daily",   label:"Daily",         icon: Calendar},
  {id:"weekly",  label:"Weekly",        icon: BarChart2},
  {id:"monthly", label:"Monthly",       icon: CalendarDays},
  {id:"annual",  label:"Annually",      icon: TrendingUp},
  {id:"custom",  label:"Custom Period", icon: CalendarClock},
];

// ─── SVG Geometry ──────────────────────────────────────────────────────────────
const CX = 180, CY = 155;
const OUTER_R = 82, INNER_R = 0, LABEL_R = 116;
const LABEL_THRESHOLD = 5.5; // only label segments >= this %

function p2c(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, oR: number, iR: number, sA: number, eA: number) {
  const gap = 0;
  const s = sA + gap / 2, e = eA - gap / 2;
  if (e <= s) return "";
  const large = e - s > 180 ? 1 : 0;
  const os = p2c(cx, cy, oR, s), oe = p2c(cx, cy, oR, e);
  if (iR === 0) {
    return `M${cx} ${cy} L${os.x} ${os.y} A${oR} ${oR} 0 ${large} 1 ${oe.x} ${oe.y} Z`;
  }
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
const fmtINR = (n: number) => {
  if (n >= 100000) {
    const val = parseFloat((n / 100000).toFixed(1));
    return `₹${val}L`;
  }
  if (n >= 1000) {
    const val = parseFloat((n / 1000).toFixed(1));
    return `₹${val}K`;
  }
  return `₹${Math.round(n)}`;
};

const fmtFull = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString("en-IN")}`;

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
  const selectedSegInfo = segments.find(s => s.cat.id === selectedId);
  const accentColor = chartType === "income" ? "var(--income)" : "var(--expense)";

  // Labels: only for segments above threshold
  const labeledSegs = segments.filter(s => s.cat.percentage >= LABEL_THRESHOLD);

  return (
    <svg width="360" height="310" viewBox="0 0 360 310" style={{ overflow: "visible" }}>
      <defs>
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
        stroke="color-mix(in srgb, var(--ink) 4%, transparent)"
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
                <path
                  d={d}
                  fill={cat.color}
                  stroke="var(--bg-deep)"
                  strokeWidth="1.5"
                  filter={isSelected ? "url(#seg-glow)" : "none"}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
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
              <text x={labelX} y={labelPt.y - 4} textAnchor={anchor}
                fill="color-mix(in srgb, var(--ink) 85%, transparent)" fontSize="11" fontFamily="Inter,sans-serif" fontWeight="700">
                {cat.name.length > 12 ? cat.name.slice(0, 10) + '...' : cat.name}
              </text>
              <text x={labelX} y={labelPt.y + 10} textAnchor={anchor}
                fill="color-mix(in srgb, var(--ink) 50%, transparent)" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="500">
                {cat.percentage.toFixed(1)} %
              </text>
            </motion.g>
          );
        })}
      </AnimatePresence>

      {/* Center info moved below chart */}

      {/* Floating Tooltip Card */}
      <AnimatePresence>
        {selectedSegInfo && selected && (
          <motion.g
            key={selected.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {(() => {
              const isRight = selectedSegInfo.midAngle < 180;
              const rectWidth = 110;
              const rectHeight = 44;
              const tooltipPt = p2c(CX, CY, OUTER_R + 15, selectedSegInfo.midAngle);
              const rx = isRight ? tooltipPt.x + 5 : tooltipPt.x - rectWidth - 5;
              const ry = tooltipPt.y - rectHeight / 2;
              return (
                <g>
                  {/* Tooltip Card Background */}
                  <rect
                    x={rx}
                    y={ry}
                    width={rectWidth}
                    height={rectHeight}
                    rx="4"
                    fill="var(--surface)"
                    stroke={selected.color}
                    strokeWidth="2"
                    style={{ filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.5))" }}
                  />
                  {/* Category Name */}
                  <text
                    x={rx + 10}
                    y={ry + 16}
                    fill="color-mix(in srgb, var(--ink) 60%, transparent)"
                    fontSize="10"
                    fontFamily="Inter,sans-serif"
                    fontWeight="500"
                  >
                    {selected.name.length > 12 ? selected.name.slice(0, 10) + '...' : selected.name}
                  </text>
                  {/* Amount */}
                  <text
                    x={rx + 10}
                    y={ry + 32}
                    fill="var(--ink)"
                    fontSize="13"
                    fontFamily="Inter,sans-serif"
                    fontWeight="700"
                  >
                    {fmtFull(selected.amount)}
                  </text>
                </g>
              );
            })()}
          </motion.g>
        )}
      </AnimatePresence>
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
          background: open ? "rgba(212,162,76,0.2)" : "var(--divider)",
          border: `1px solid ${open ? "rgba(212,162,76,0.4)" : "var(--divider)"}`,
        }}>
        <cur.icon className="w-3.5 h-3.5 text-ink/75" />
        <span className="text-ink font-semibold" style={{ fontSize: 12 }}>{cur.label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-ink/45" />
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
              background: "var(--surface)",
              border: "1px solid var(--divider)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
            }}>
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-ink/5"
                style={{ fontSize: 13 }}>
                <opt.icon className="w-3.5 h-3.5" style={{ color: period === opt.id ? "#D4A24C" : "color-mix(in srgb, var(--ink) 54%, transparent)" }} />
                <span style={{ color: period === opt.id ? "#D4A24C" : "color-mix(in srgb, var(--ink) 72%, transparent)", fontWeight: period === opt.id ? 700 : 400 }}>
                  {opt.label}
                </span>
                {period === opt.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4A24C]" />}
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
  const InsightIcon = biggest.icon ? () => <biggest.icon className="w-3.5 h-3.5 inline-block -mt-0.5" /> : () => <>{biggest.emoji}</>;
  const text = chartType === "expense"
    ? <p>You spent {Math.round(biggest.percentage)}% on {biggest.name} this month <InsightIcon /></p>
    : <p>{biggest.name} is your top income source at {Math.round(biggest.percentage)}% <InsightIcon /></p>;

  return (
    <div className="mx-4 mb-3 rounded-2xl px-4 py-3.5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,rgba(212,162,76,0.14) 0%,rgba(212,162,76,0.07) 100%)",
        border: "1px solid rgba(212,162,76,0.25)",
      }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(212,162,76,0.22) 0%,transparent 70%)" }} />
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#D4A24C,#D4A24C)" }}>
          <Sparkles className="w-4 h-4 text-ink" />
        </div>
        <div>
          <div className="text-ink font-semibold" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{text}</div>
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
  cat, rank, isSelected, compareAmt, showCompare, isIncome, onTap,
}: {
  cat: CatData | SubData;
  rank?: number;
  isSelected: boolean;
  compareAmt?: number;
  showCompare: boolean;
  isIncome: boolean;
  onTap: () => void;
}) {
  const hasSubs = (cat as CatData).subs?.length > 0;

  // Calculate trend dynamically by comparing current amount and compareAmt (previous amount)
  const trendVal = compareAmt !== undefined && compareAmt > 0
    ? parseFloat((((cat.amount - compareAmt) / compareAmt) * 100).toFixed(1))
    : 0;
  const displayTrend = showCompare ? trendVal : 0;
  const isTrendUp = displayTrend > 0;
  const trend = Math.abs(displayTrend);

  // Styling for trend text/arrows based on whether it is income or expense:
  // For Income: increase is good (green), decrease is bad (red).
  // For Expense: increase is bad (red), decrease is good (green).
  const isGood = isIncome ? isTrendUp : !isTrendUp;
  const trendColor = isGood ? "#4ADE80" : "#F87171";

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.975 }}
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left"
      style={{
        background: isSelected
          ? `color-mix(in srgb, var(--ink) 5%, transparent)`
          : "color-mix(in srgb, var(--ink) 2%, transparent)",
        border: isSelected
          ? `1px solid ${cat.color}50`
          : "1px solid color-mix(in srgb, var(--ink) 5%, transparent)",
        marginBottom: 6,
      }}>
      {/* Percentage Badge */}
      <div className="w-12 py-1 flex items-center justify-center text-[10px] font-extrabold text-ink rounded-lg flex-shrink-0"
        style={{ background: cat.color }}>
        {cat.percentage.toFixed(0)}%
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {cat.icon ? <cat.icon className="w-4 h-4 text-ink/85 flex-shrink-0" /> : <span className="text-base leading-none flex-shrink-0">{cat.emoji}</span>}
          <p className="text-ink font-semibold truncate" style={{ fontSize: 13 }}>{cat.name}</p>
          {hasSubs && (
            <span className="px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ fontSize: 9, fontWeight: 700, background: `${cat.color}22`, color: cat.color }}>
              DRILL
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <p className="font-fraunces font-bold text-ink text-[13px] tabular-nums">{fmtFull(cat.amount)}</p>
        <div className="flex items-center gap-1.5 justify-end w-full">
          {/* Trend arrow and text is placed on the left side of the % pill for clean vertical alignment */}
          {displayTrend !== 0 && (
            <div className="flex items-center gap-0.5">
              {isTrendUp
                ? <TrendingUp className="w-2.5 h-2.5" style={{ color: trendColor }} />
                : <TrendingDown className="w-2.5 h-2.5" style={{ color: trendColor }} />}
              <span style={{ fontSize: 9, color: trendColor }}>
                {trend}%
              </span>
            </div>
          )}
          {/* % pill is always on the right side of the card, flush with the amount above it */}
          <span className="px-2 py-0.5 rounded-full text-right font-semibold"
            style={{ fontSize: 10, fontWeight: 800, background: `${cat.color}22`, color: cat.color }}>
            {cat.percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function ReportsScreen() {
  const { categories } = useCategoryContext();
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
  const [compareExpenseData, setCompareExpenseData] = useState<CatData[]>([]);
  const [compareIncomeData, setCompareIncomeData] = useState<CatData[]>([]);
  const [summaryData, setSummaryData] = useState({ income: 0, expense: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load data from API
  useEffect(() => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;

    setIsLoading(true);
    Promise.all([
      statsAPI.getCategoryBreakdown({ month: monthStr }),
      statsAPI.getSummary({ month: monthStr }),
      statsAPI.getCategoryBreakdown({ month: prevMonthStr }),
    ]).then(([breakdown, summary, prevBreakdown]) => {
      // breakdown is array: [{category_id, category_name, icon, color, total, type}]
      const allCats = breakdown || [];
      const totalExpense = allCats.filter((c: any) => c.type === 'expense').reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);
      const totalIncome = allCats.filter((c: any) => c.type === 'income').reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);

      const allPrevCats = prevBreakdown || [];
      const totalPrevExpense = allPrevCats.filter((c: any) => c.type === 'expense').reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);
      const totalPrevIncome = allPrevCats.filter((c: any) => c.type === 'income').reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0);

      const mapCats = (cats: any[], total: number): CatData[] => cats.map((c: any) => {
        const catObj = categories.find(cat => cat.id === (c.category_id || c.id));
        return {
          id: c.category_id || c.id,
          name: c.category_name || c.name || 'Unknown',
          emoji: c.icon || '📦',
          icon: catObj?.icon,
          color: c.color || '#D4A24C',
          amount: parseFloat(c.total || 0),
          percentage: total > 0 ? (parseFloat(c.total || 0) / total) * 100 : 0,
          trend: 0,
          subs: [],
        };
      });

      setExpenseData(mapCats(allCats.filter((c: any) => c.type === 'expense'), totalExpense));
      setIncomeData(mapCats(allCats.filter((c: any) => c.type === 'income'), totalIncome));
      setCompareExpenseData(mapCats(allPrevCats.filter((c: any) => c.type === 'expense'), totalPrevExpense));
      setCompareIncomeData(mapCats(allPrevCats.filter((c: any) => c.type === 'income'), totalPrevIncome));
      setSummaryData({ income: summary?.income || 0, expense: summary?.expense || 0 });
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [month, year]);

  const hasTransactions = expenseData.length > 0 || incomeData.length > 0;

  // Current data based on type
  const mainData   = chartType === "expense" ? expenseData : incomeData;
  const compareData = chartType === "expense" ? compareExpenseData : compareIncomeData;

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

  const accentIncome  = "var(--income)";
  const accentExpense = "var(--expense)";
  const pieAccent     = chartType === "income" ? accentIncome : accentExpense;

  // Empty state (future: no data)
  const isEmpty = displayData.length === 0;

  const handleExportPDF = () => {
    try {
      exportReportPDF({
        periodLabel,
        chartType,
        totalIncome,
        totalExpense,
        categories: mainData.map(c => ({ name: c.name, amount: c.amount, percentage: c.percentage })),
      });
      toast.success("PDF exported successfully");
    } catch (e) {
      toast.error("Failed to export PDF");
    }
  };

  return (
    <>
    <div className="relative pb-32"
      style={{ background: "var(--bg-deep)", minHeight: "calc(100vh - 56px)" }}>

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%,${pieAccent}12 0%,transparent 70%)`,
          transition: "background 0.4s" }} />

      {/* ── Period Selector ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.88 }} onClick={prevPeriod}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--divider)", border: "1px solid var(--divider)" }}>
            <ChevronLeft className="w-4 h-4 text-ink/55" />
          </motion.button>
          <div className="text-center">
            <p className="text-ink font-bold" style={{ fontSize: 15 }}>{periodLabel}</p>
            {drillCat && (
              <p className="flex items-center justify-center gap-1.5" style={{ fontSize: 11, color: drillCat.color }}>
                {drillCat.icon ? <drillCat.icon className="w-3 h-3" /> : drillCat.emoji} {drillCat.name}
              </p>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={nextPeriod}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--divider)", border: "1px solid var(--divider)" }}>
            <ChevronRight className="w-4 h-4 text-ink/55" />
          </motion.button>
        </div>
        <div className="flex items-center gap-2">
          <PeriodDropdown period={period} onChange={p => {
            setPeriod(p); setSelectedSeg(null); setDrillCat(null);
            if (p === "custom") setShowDatePicker(true);
          }} />
          {hasTransactions && (
            <motion.button whileTap={{ scale: 0.88 }} onClick={handleExportPDF}
              title="Download PDF report"
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--divider)", border: "1px solid var(--divider)" }}>
              <Download className="w-4 h-4 text-ink/55" />
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Income / Expense Toggle Tab Bar ── */}
      {hasTransactions && (
        <div className="flex border-b border-ink/[0.08] px-4 mb-4 relative">
          <button
            onClick={() => { setChartType("income"); setSelectedSeg(null); setDrillCat(null); }}
            className="flex-1 pb-3 text-center relative focus:outline-none cursor-pointer"
          >
            <span className="block text-ink/50 text-[10px] mb-1 font-bold tracking-wider">INCOME</span>
            <span className={`font-fraunces text-[15px] font-bold tabular-nums transition-colors duration-250 ${chartType === "income" ? "text-[var(--income)]" : "text-ink/60"}`}>
              {fmtFull(totalIncome)}
            </span>
            {chartType === "income" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--income)]"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
          <button
            onClick={() => { setChartType("expense"); setSelectedSeg(null); setDrillCat(null); }}
            className="flex-1 pb-3 text-center relative focus:outline-none cursor-pointer"
          >
            <span className="block text-ink/50 text-[10px] mb-1 font-bold tracking-wider">EXPENSES</span>
            <span className={`font-fraunces text-[15px] font-bold tabular-nums transition-colors duration-250 ${chartType === "expense" ? "text-[var(--expense)]" : "text-ink/60"}`}>
              {fmtFull(totalExpense)}
            </span>
            {chartType === "expense" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--expense)]"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
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
            {/* Total display below pie chart */}
            <div className="flex flex-col items-center justify-center -mt-10 mb-6">
               <p className="text-ink/50 font-bold tracking-wider" style={{fontSize:11}}>{chartType === "expense" ? "TOTAL SPENT" : "TOTAL EARNED"}</p>
               <p className="font-fraunces font-bold text-[32px] tabular-nums mt-1 text-ink">{fmtFull(displayData.reduce((s, d) => s + d.amount, 0))}</p>
               <p className="text-ink/40 mt-1" style={{fontSize:13}}>{displayData.length} categories</p>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 gap-4 mx-4">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,rgba(212,162,76,0.1),rgba(212,162,76,0.05))", border: "1px solid rgba(212,162,76,0.2)" }}>
            <BarChart2 className="w-10 h-10 text-[#D4A24C]" />
          </div>
          <div className="text-center">
            <p className="text-ink font-bold mb-1" style={{ fontSize: 17 }}>No data available</p>
            <p className="text-ink/45" style={{ fontSize: 13, lineHeight: 1.5 }}>
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
            style={{ background: compareMode ? "linear-gradient(135deg,rgba(212,162,76,0.12),rgba(212,162,76,0.06))" : "color-mix(in srgb, var(--ink) 4%, transparent)", border: compareMode ? "1px solid rgba(212,162,76,0.25)" : "1px solid var(--divider)", transition: "all 0.3s" }}>
            <div className="flex items-center gap-2.5">
              <BarChart2 className="w-4 h-4" style={{ color: compareMode ? "#D4A24C" : "color-mix(in srgb, var(--ink) 45%, transparent)" }} />
              <p className="font-medium" style={{ fontSize: 13, color: compareMode ? "white" : "color-mix(in srgb, var(--ink) 65%, transparent)" }}>Compare with last month</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setCompareMode(v => !v)}
              className="w-11 h-6 rounded-full relative"
              style={{ background: compareMode ? "linear-gradient(135deg,#D4A24C,#D4A24C)" : "var(--divider)" }}>
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
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(212,162,76,0.08)", border: "1px solid rgba(212,162,76,0.2)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "color-mix(in srgb, var(--ink) 35%, transparent)", letterSpacing: "0.5px" }}>THIS MONTH</p>
                <p className="font-bold mt-1" style={{ fontSize: 17, color: "#D4A24C" }}>
                  {fmtFull(mainData.reduce((s, c) => s + c.amount, 0))}
                </p>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: "color-mix(in srgb, var(--ink) 3%, transparent)", border: "1px solid var(--divider)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "color-mix(in srgb, var(--ink) 35%, transparent)", letterSpacing: "0.5px" }}>LAST MONTH</p>
                <p className="font-bold mt-1" style={{ fontSize: 17, color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}>
                  {fmtFull(compareData.reduce((s, c) => s + c.amount, 0))}
                </p>
              </div>
            </div>

            {/* Side-by-side comparison bars */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "color-mix(in srgb, var(--ink) 3%, transparent)", border: "1px solid var(--divider)" }}>
              <p className="text-ink/40 font-semibold mb-2" style={{ fontSize: 11, letterSpacing: "0.5px" }}>CATEGORY COMPARISON</p>
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
                        {cat.icon ? <cat.icon className="w-3.5 h-3.5 text-ink/85" /> : <span style={{ fontSize: 14 }}>{cat.emoji}</span>}
                        <span className="text-ink/80 font-medium" style={{ fontSize: 12 }}>{cat.name}</span>
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
                      <span className="text-ink/30 w-8" style={{ fontSize: 9 }}>Now</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)" }}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                          animate={{ width: `${maxAmt > 0 ? (cat.amount / maxAmt) * 100 : 0}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          style={{ background: cat.color }} />
                      </div>
                      <span className="text-ink/60 w-14 text-right font-semibold" style={{ fontSize: 10 }}>{fmtINR(cat.amount)}</span>
                    </div>
                    {/* Last month bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-ink/20 w-8" style={{ fontSize: 9 }}>Prev</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)" }}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                          animate={{ width: `${maxAmt > 0 ? (prevAmt / maxAmt) * 100 : 0}%` }}
                          transition={{ duration: 0.6, delay: 0.15 }}
                          style={{ background: cat.color, opacity: 0.35 }} />
                      </div>
                      <span className="text-ink/35 w-14 text-right" style={{ fontSize: 10 }}>{fmtINR(prevAmt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Insight cards */}
            {(() => {
              let highestIncrease = { name: "", pct: 0, emoji: "", icon: undefined as any };
              let highestDecrease = { name: "", pct: 0, emoji: "", icon: undefined as any };
              mainData.forEach(cat => {
                const prev = compareData.find(c => c.id === cat.id);
                if (!prev || prev.amount === 0) return;
                const pct = Math.round(((cat.amount - prev.amount) / prev.amount) * 100);
                if (pct > highestIncrease.pct) highestIncrease = { name: cat.name, pct, emoji: cat.emoji, icon: cat.icon };
                if (pct < highestDecrease.pct) highestDecrease = { name: cat.name, pct, emoji: cat.emoji, icon: cat.icon };
              });
              return (
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  {highestIncrease.pct > 0 && (
                    <div className="rounded-2xl px-3 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-rose-400" />
                        <span style={{ fontSize: 10, color: "#F87171", fontWeight: 700 }}>MOST INCREASED</span>
                      </div>
                      <div className="text-ink font-semibold flex items-center gap-1.5" style={{ fontSize: 13 }}>
                        {highestIncrease.icon ? <highestIncrease.icon className="w-3.5 h-3.5" /> : highestIncrease.emoji} {highestIncrease.name}
                      </div>
                      <p style={{ fontSize: 11, color: "#F87171" }}>+{highestIncrease.pct}%</p>
                    </div>
                  )}
                  {highestDecrease.pct < 0 && (
                    <div className="rounded-2xl px-3 py-3" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingDown className="w-3 h-3 text-emerald-400" />
                        <span style={{ fontSize: 10, color: "#4ADE80", fontWeight: 700 }}>MOST DECREASED</span>
                      </div>
                      <div className="text-ink font-semibold flex items-center gap-1.5" style={{ fontSize: 13 }}>
                        {highestDecrease.icon ? <highestDecrease.icon className="w-3.5 h-3.5" /> : highestDecrease.emoji} {highestDecrease.name}
                      </div>
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
            <p className="text-ink/38 font-semibold flex items-center gap-1.5" style={{ fontSize: 11, letterSpacing: "0.5px" }}>
              {drillCat
                ? <>{drillCat.icon ? <drillCat.icon className="w-3 h-3" /> : drillCat.emoji} {drillCat.name} BREAKDOWN</>
                : `${chartType === "expense" ? "EXPENSE" : "INCOME"} BREAKDOWN`}
            </p>
            {selectedSeg && (
              <button onClick={() => setSelectedSeg(null)}
                className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "var(--divider)", fontSize: 11, color: "color-mix(in srgb, var(--ink) 40%, transparent)" }}>
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
                    isSelected={selectedSeg === cat.id}
                    compareAmt={compareCat?.amount}
                    showCompare={compareMode && !drillCat}
                    isIncome={chartType === "income"}
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
              <p className="text-ink/55 font-semibold" style={{ fontSize: 13 }}>
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

      {/* Custom Date Range Picker */}
      <AnimatePresence>
        {showDatePicker && (
          <DateRangePicker
            startDate={customStart}
            endDate={customEnd}
            onSelect={(s, e) => {
              setCustomStart(s);
              setCustomEnd(e);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

