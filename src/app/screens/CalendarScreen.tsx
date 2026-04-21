import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { transactionsAPI } from "../services/api";

export function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
  const [transactions, setTransactions] = useState<any[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Day of week for first day (0=Sun, 6=Sat)
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Fetch transactions for current month
  useEffect(() => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    transactionsAPI.getAll({ month: monthStr }).then((data: any[]) => {
      setTransactions(data || []);
    }).catch(console.error);
  }, [year, month]);

  const navigateMonth = (dir: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + dir);
    setCurrentDate(next);
    setSelectedDate(null);
  };

  // Group transactions by day
  const getTransactionsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return transactions.filter((tx: any) => {
      // Handle both ISO dates and YYYY-MM-DD
      const txDate = (tx.date || "").substring(0, 10);
      return txDate === dateStr;
    });
  };

  // Day stats for calendar dots
  const dayStats = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayTxs = getTransactionsForDay(day);
    const income = dayTxs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
    const expense = dayTxs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
    return { day, income, expense, transactions: dayTxs };
  });

  // Selected day data
  const selectedDayData = selectedDate ? dayStats.find(d => d.day === selectedDate) : null;

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)} className="w-10 h-10 rounded-xl bg-[#1B2130] flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-xl font-semibold text-white">{monthLabel}</h2>
        <button onClick={() => navigateMonth(1)} className="w-10 h-10 rounded-xl bg-[#1B2130] flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#1B2130] rounded-2xl p-4 border border-white/5">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs text-white/50 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Days */}
          {dayStats.map((stat) => {
            const hasIncome = stat.income > 0;
            const hasExpense = stat.expense > 0;
            const isSelected = selectedDate === stat.day;

            return (
              <button
                key={stat.day}
                onClick={() => setSelectedDate(stat.day)}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-[#7C5CFF] text-white"
                    : "bg-[#0D0F14] text-white/70 hover:bg-[#0D0F14]/70"
                }`}
              >
                <span className="text-sm font-medium">{stat.day}</span>
                <div className="flex gap-0.5 mt-1">
                  {hasIncome && (
                    <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#22C55E]"}`} />
                  )}
                  {hasExpense && (
                    <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#EF4444]"}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && selectedDayData && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {currentDate.toLocaleDateString("en-US", { month: "long" })} {selectedDate}, {year}
          </h3>

          {selectedDayData.transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-white/50 text-sm">No transactions on this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayData.transactions.map((tx: any, i: number) => (
                <div
                  key={tx.id || i}
                  className="flex items-center justify-between p-4 bg-[#1B2130] rounded-xl border border-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{tx.note || tx.description || "Transaction"}</p>
                    <p className="text-xs text-white/50 capitalize">{tx.type}</p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === "income" ? "text-[#22C55E]" : "text-white"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}₹{Math.abs(parseFloat(tx.amount || 0)).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Day Summary */}
          {(selectedDayData.income > 0 || selectedDayData.expense > 0) && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1">Income</p>
                <p className="text-xl font-bold text-[#22C55E]">₹{selectedDayData.income.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1">Expense</p>
                <p className="text-xl font-bold text-[#EF4444]">₹{selectedDayData.expense.toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
