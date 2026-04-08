import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, AlertCircle, Bot, TrendingUp } from "lucide-react";

export function BudgetScreen() {
  const [currentMonth, setCurrentMonth] = useState("March 2026");

  const budgets = [
    { category: "Food & Dining", budgeted: 0, spent: 0, color: "#7C5CFF", emoji: "🍔" },
    { category: "Transport", budgeted: 0, spent: 0, color: "#4CC9F0", emoji: "🚗" },
    { category: "Bills", budgeted: 0, spent: 0, color: "#FFA500", emoji: "⚡" },
    { category: "Shopping", budgeted: 0, spent: 0, color: "#FF6B6B", emoji: "🛍️" },
  ];

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const budgetLeft = totalBudgeted - totalSpent;
  const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  // Find pressure category
  const pressureCategory = budgets.reduce((prev, current) => {
    const prevPercent = prev.budgeted > 0 ? (prev.spent / prev.budgeted) * 100 : 0;
    const currentPercent = current.budgeted > 0 ? (current.spent / current.budgeted) * 100 : 0;
    return currentPercent > prevPercent ? current : prev;
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

      {/* Budget Summary */}
      <div className="bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] rounded-2xl p-6">
        <h3 className="text-white/80 text-sm mb-2">Budget Remaining</h3>
        <p className="text-4xl font-bold text-white mb-4">₹{budgetLeft.toLocaleString()}</p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-full h-3 overflow-hidden mb-3">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-white/80">
          <span>₹{totalSpent.toLocaleString()} spent</span>
          <span>₹{totalBudgeted.toLocaleString()} budgeted</span>
        </div>
      </div>

      {/* Pressure Category Alert */}
      {pressureCategory.budgeted > 0 && (pressureCategory.spent / pressureCategory.budgeted) * 100 > 75 && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium mb-1">Pressure Alert</p>
              <p className="text-sm text-white/60">
                {pressureCategory.category} is at{" "}
                {((pressureCategory.spent / pressureCategory.budgeted) * 100).toFixed(0)}% 
                (₹{pressureCategory.spent.toLocaleString()} of ₹{pressureCategory.budgeted.toLocaleString()})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Budget Suggestions */}
      <div className="bg-gradient-to-br from-[#7C5CFF]/20 to-[#4CC9F0]/20 border border-[#7C5CFF]/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#7C5CFF]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Suggestions</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-[#7C5CFF]">•</span>
                <span>Based on last month, increase Transport budget by ₹1,000</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7C5CFF]">•</span>
                <span>You're doing great with Bills! Consider allocating ₹900 to savings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7C5CFF]">•</span>
                <span>Shopping trend shows you can reduce budget to ₹4,500</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Budget Button */}
      <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30">
        <Plus className="w-5 h-5" />
        <span>Add Budget</span>
      </button>

      {/* Budget List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Category Budgets</h3>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentSpent = budget.budgeted > 0 ? (budget.spent / budget.budgeted) * 100 : 0;
            const remaining = budget.budgeted - budget.spent;
            const isOverBudget = percentSpent > 100;
            const isPressure = percentSpent > 75;

            return (
              <div
                key={budget.category}
                className={`bg-[#1B2130] rounded-2xl p-5 border ${
                  isOverBudget
                    ? "border-[#EF4444]/50"
                    : isPressure
                    ? "border-[#FFA500]/50"
                    : "border-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{budget.emoji}</span>
                    <div>
                      <h4 className="text-white font-semibold">{budget.category}</h4>
                      <p className="text-xs text-white/50">
                        {remaining >= 0 ? `₹${remaining.toLocaleString()} left` : `₹${Math.abs(remaining).toLocaleString()} over`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      ₹{budget.spent.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/50">
                      of ₹{budget.budgeted.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-full h-2.5 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(percentSpent, 100)}%`,
                      backgroundColor: isOverBudget ? "#EF4444" : isPressure ? "#FFA500" : budget.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={isOverBudget ? "text-[#EF4444]" : isPressure ? "text-[#FFA500]" : "text-white/50"}>
                    {percentSpent.toFixed(0)}% used
                  </span>
                  {isPressure && !isOverBudget && (
                    <span className="text-[#FFA500]">⚠️ High usage</span>
                  )}
                  {isOverBudget && (
                    <span className="text-[#EF4444]">❌ Over budget</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}