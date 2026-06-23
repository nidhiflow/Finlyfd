import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Target, Rocket, Settings2, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtINR = (n: number, compact = false) => {
  if (compact) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  }
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

export function WealthSimulatorScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"time" | "amount">("time");

  // Inputs
  const [targetAmount, setTargetAmount] = useState<number>(10000000); // 1 Crore default
  const [startingAmount, setStartingAmount] = useState<number>(50000); // 50k default
  const [monthlyContrib, setMonthlyContrib] = useState<number>(25000); // 25k default
  const [targetYears, setTargetYears] = useState<number>(10);
  const [expectedReturn, setExpectedReturn] = useState<number>(12); // 12% default

  // ─── Math Logic ─────────────────────────────────────────────────────────────
  // Monthly rate
  const r = expectedReturn / 100 / 12;

  // Mode: TIME (Solving for n months)
  // n = log((FV * r + PMT) / (P * r + PMT)) / log(1 + r)
  const calculateMonthsToGoal = () => {
    if (targetAmount <= startingAmount) return 0;
    if (r === 0) return (targetAmount - startingAmount) / monthlyContrib;
    
    const num = (targetAmount * r + monthlyContrib);
    const den = (startingAmount * r + monthlyContrib);
    if (den <= 0) return Infinity;
    
    const n = Math.log(num / den) / Math.log(1 + r);
    return Math.max(0, n);
  };

  // Mode: AMOUNT (Solving for PMT given n months)
  // PMT = (FV - P * (1+r)^n) * (r / ((1+r)^n - 1))
  const calculateRequiredMonthly = () => {
    const n = targetYears * 12;
    if (n <= 0) return 0;
    if (r === 0) return Math.max(0, (targetAmount - startingAmount) / n);
    
    const factor = Math.pow(1 + r, n);
    const pmt = (targetAmount - startingAmount * factor) * (r / (factor - 1));
    return Math.max(0, pmt);
  };

  const computedMonths = mode === "time" ? calculateMonthsToGoal() : targetYears * 12;
  const computedMonthly = mode === "time" ? monthlyContrib : calculateRequiredMonthly();
  
  const totalYears = computedMonths / 12;
  const isImpossible = computedMonths === Infinity;

  // ─── Chart Data Generation ──────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (isImpossible) return [];
    
    const data = [];
    const maxMonths = Math.min(Math.ceil(computedMonths), 600); // cap at 50 years to prevent infinite loops
    let currentP = startingAmount;
    let totalInvested = startingAmount;
    
    // Sample 20-30 points across the timeline for performance
    const step = Math.max(1, Math.floor(maxMonths / 30));
    
    for (let m = 0; m <= maxMonths; m += step) {
      data.push({
        month: m,
        year: (m / 12).toFixed(1),
        invested: totalInvested,
        returns: Math.max(0, currentP - totalInvested),
        total: currentP,
      });
      
      // Fast forward 'step' months
      for (let i = 0; i < step && m + i < maxMonths; i++) {
        currentP = currentP * (1 + r) + computedMonthly;
        totalInvested += computedMonthly;
      }
    }
    
    // Ensure final target point is included
    if (maxMonths % step !== 0) {
      data.push({
        month: maxMonths,
        year: (maxMonths / 12).toFixed(1),
        invested: totalInvested,
        returns: Math.max(0, targetAmount - totalInvested),
        total: targetAmount,
      });
    }
    
    return data;
  }, [startingAmount, computedMonthly, r, targetAmount, computedMonths, isImpossible]);

  const finalInvested = startingAmount + (computedMonthly * computedMonths);
  const finalReturns = Math.max(0, targetAmount - finalInvested);

  // ─── UI Helpers ─────────────────────────────────────────────────────────────
  const inputCls = "w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3.5 text-ink placeholder:text-ink/30 focus:outline-none focus:border-[#D4A24C] transition-colors font-fraunces tabular-nums text-lg font-semibold";
  const labelCls = "text-ink/50 text-xs mb-1.5 block font-medium uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] pb-10">
      {/* Header */}
      <div className="sticky top-0 z-30 pt-12 pb-4 px-5 bg-[var(--bg-deep)]/90 backdrop-blur-md border-b border-ink/5">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center mb-4 transition-colors hover:bg-ink/10">
          <ArrowLeft className="w-5 h-5 text-ink/70" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[linear-gradient(135deg,rgba(212,162,76,0.2),rgba(212,162,76,0.05))] border border-[#D4A24C]/30 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-[#D4A24C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">Wealth Simulator</h1>
            <p className="text-ink/40 text-xs">Project your financial future</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        
        {/* Mode Toggle */}
        <div className="flex p-1 rounded-2xl bg-ink/5 border border-ink/5">
          <button onClick={() => setMode("time")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === "time" ? "bg-[var(--surface)] text-ink shadow-sm border border-ink/10" : "text-ink/40"}`}>
            <Clock className="w-4 h-4" /> When will I reach it?
          </button>
          <button onClick={() => setMode("amount")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === "amount" ? "bg-[var(--surface)] text-ink shadow-sm border border-ink/10" : "text-ink/40"}`}>
            <Target className="w-4 h-4" /> How much to save?
          </button>
        </div>

        {/* Big Result Card */}
        <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--ink) 4%, transparent), transparent)", border: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)" }}>
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#D4A24C]/10 blur-3xl pointer-events-none" />
          
          {isImpossible ? (
            <div className="text-center py-4">
              <p className="text-rose-400 font-semibold mb-1">Goal is mathematically impossible</p>
              <p className="text-ink/40 text-xs">Increase your monthly contribution or expected return.</p>
            </div>
          ) : (
            <>
              <p className="text-ink/40 text-xs font-semibold uppercase tracking-wider mb-2">
                {mode === "time" ? "You will reach your goal in" : "You need to save"}
              </p>
              <h2 className="font-fraunces text-4xl font-bold text-ink tracking-tight mb-6">
                {mode === "time" ? (
                  <span className="text-[#D4A24C]">
                    {Math.floor(totalYears)}<span className="text-2xl text-ink/50 font-medium tracking-normal">yrs</span> {Math.ceil(computedMonths % 12)}<span className="text-2xl text-ink/50 font-medium tracking-normal">mo</span>
                  </span>
                ) : (
                  <span className="text-[#D4A24C]">
                    {fmtINR(computedMonthly)}<span className="text-2xl text-ink/50 font-medium tracking-normal">/mo</span>
                  </span>
                )}
              </h2>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink/5">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full bg-ink/20" />
                    <p className="text-ink/40 text-[10px] uppercase font-bold tracking-wider">Your Money</p>
                  </div>
                  <p className="font-fraunces tabular-nums font-semibold text-ink/80 text-sm">{fmtINR(finalInvested)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <p className="text-ink/40 text-[10px] uppercase font-bold tracking-wider">Market Returns</p>
                  </div>
                  <p className="font-fraunces tabular-nums font-semibold text-[#22C55E] text-sm">+{fmtINR(finalReturns)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Target Goal</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 font-fraunces text-lg">₹</span>
                <input type="number" className={`${inputCls} pl-8`} value={targetAmount || ""} onChange={e => setTargetAmount(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Already Saved</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 font-fraunces text-lg">₹</span>
                <input type="number" className={`${inputCls} pl-8`} value={startingAmount || ""} onChange={e => setStartingAmount(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {mode === "time" ? (
            <div>
              <label className={labelCls}>Monthly Savings</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 font-fraunces text-lg">₹</span>
                <input type="number" className={`${inputCls} pl-8`} value={monthlyContrib || ""} onChange={e => setMonthlyContrib(Number(e.target.value))} />
              </div>
            </div>
          ) : (
            <div>
              <label className={labelCls}>Target Time (Years)</label>
              <div className="relative">
                <input type="number" className={inputCls} value={targetYears || ""} onChange={e => setTargetYears(Number(e.target.value))} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/30 font-semibold text-sm">years</span>
              </div>
            </div>
          )}

          <div className="bg-ink/5 p-4 rounded-2xl border border-ink/5">
            <div className="flex justify-between items-center mb-3">
              <label className="text-ink/60 text-sm font-semibold flex items-center gap-2"><Settings2 className="w-4 h-4 text-[#D4A24C]" /> Expected Annual Return</label>
              <span className="text-ink font-bold font-fraunces text-lg text-[#D4A24C]">{expectedReturn}%</span>
            </div>
            <input 
              type="range" min="0" max="25" step="0.5" 
              value={expectedReturn} 
              onChange={e => setExpectedReturn(Number(e.target.value))}
              className="w-full h-2 bg-ink/10 rounded-lg appearance-none cursor-pointer accent-[#D4A24C]"
            />
            <div className="flex justify-between mt-2 text-ink/30 text-[10px] font-semibold">
              <span>0% (Cash)</span>
              <span>12% (Mutual Funds)</span>
              <span>25% (High Risk)</span>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        {!isImpossible && chartData.length > 0 && (
          <div className="pt-6 border-t border-ink/5">
            <h3 className="text-ink/80 font-bold mb-6">Growth Projection</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ink)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--ink)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" opacity={0.5} />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--ink)', opacity: 0.4, fontSize: 10 }}
                    tickFormatter={(val) => `Yr ${val}`}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--ink)', opacity: 0.4, fontSize: 10 }}
                    tickFormatter={(val) => fmtINR(val, true)}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number, name: string) => [fmtINR(value), name === 'invested' ? 'Your Money' : 'Total Value']}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Area type="monotone" dataKey="invested" stroke="var(--ink)" strokeOpacity={0.3} strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" stackId="1" />
                  <Area type="monotone" dataKey="returns" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorReturns)" stackId="1" />
                  <ReferenceLine y={targetAmount} stroke="#D4A24C" strokeDasharray="3 3" opacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-ink/30 text-[10px] mt-2 flex justify-center items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Assumes monthly compounding. Taxes & inflation not included.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
