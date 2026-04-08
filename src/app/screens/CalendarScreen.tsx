import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState("March 2026");
  const [selectedDate, setSelectedDate] = useState<number | null>(15);

  const daysInMonth = 31;
  const firstDayOfWeek = 6; // Saturday (0-6, where 0 is Sunday)

  const dayTransactions = {
    15: [
      { name: "Swiggy", amount: -450, type: "expense" },
      { name: "Salary", amount: 50000, type: "income" },
    ],
    14: [
      { name: "Uber", amount: -320, type: "expense" },
    ],
  };

  const dayStats = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const income = day === 1 ? 50000 : day % 7 === 0 ? 5000 : 0;
    const expense = Math.floor(Math.random() * 2000) + 200;
    return { day, income, expense };
  });

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <button className="w-10 h-10 rounded-xl bg-[#1B2130] flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-xl font-semibold text-white">{currentMonth}</h2>
        <button className="w-10 h-10 rounded-xl bg-[#1B2130] flex items-center justify-center">
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
      {selectedDate && dayTransactions[selectedDate as keyof typeof dayTransactions] && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            March {selectedDate}, 2026
          </h3>

          <div className="space-y-3">
            {dayTransactions[selectedDate as keyof typeof dayTransactions].map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-[#1B2130] rounded-xl border border-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{tx.name}</p>
                  <p className="text-xs text-white/50 capitalize">{tx.type}</p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    tx.type === "income" ? "text-[#22C55E]" : "text-white"
                  }`}
                >
                  {tx.type === "income" ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Day Summary */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Income</p>
              <p className="text-xl font-bold text-[#22C55E]">₹50,000</p>
            </div>
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Expense</p>
              <p className="text-xl font-bold text-[#EF4444]">₹450</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
