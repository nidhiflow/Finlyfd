import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, ChevronLeft, ChevronRight, AlertCircle, Bot, X, Pencil, Trash2 } from "lucide-react";
import { budgetsAPI, categoriesAPI } from "../services/api";
import { toast } from "sonner";

interface BudgetItem {
  id: string;
  category_id: string;
  category: string;
  budgeted: number;
  spent: number;
  color: string;
  emoji: string;
}

export function BudgetScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetItem | null>(null);
  const [showDelete, setShowDelete] = useState<BudgetItem | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const monthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}`;

  const loadBudgets = async () => {
    setIsLoading(true);
    try {
      const data = await budgetsAPI.get(monthStr);
      const mapped = (data.categories || []).map((b: any) => ({
        id: b.id,
        category_id: b.category_id,
        category: b.category_name || "Uncategorized",
        budgeted: parseFloat(b.amount || "0"),
        spent: parseFloat(b.spent || "0"),
        color: b.color || "#7C5CFF",
        emoji: b.icon || "🍔",
      }));
      setBudgets(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load budgets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories((data || []).filter((c: any) => c.type === "expense"));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, [currentDate]);

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const budgetLeft = totalBudgeted - totalSpent;
  const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const pressureCategory = budgets.length > 0 ? budgets.reduce((prev, current) => {
    const prevPercent = prev.budgeted > 0 ? (prev.spent / prev.budgeted) * 100 : 0;
    const currentPercent = current.budgeted > 0 ? (current.spent / current.budgeted) * 100 : 0;
    return currentPercent > prevPercent ? current : prev;
  }) : null;

  const navigateMonth = (dir: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + dir);
    setCurrentDate(next);
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await budgetsAPI.delete(showDelete.id);
      toast.success("Budget deleted");
      loadBudgets();
    } catch (e) {
      toast.error("Failed to delete budget");
    }
    setShowDelete(null);
  };

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

      {/* Budget Summary */}
      <div className="bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] rounded-2xl p-6">
        <h3 className="text-white/80 text-sm mb-2">Budget Remaining</h3>
        <p className="text-4xl font-bold text-white mb-4">₹{budgetLeft.toLocaleString()}</p>
        <div className="bg-white/10 backdrop-blur-sm rounded-full h-3 overflow-hidden mb-3">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(percentUsed, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm text-white/80">
          <span>₹{totalSpent.toLocaleString()} spent</span>
          <span>₹{totalBudgeted.toLocaleString()} budgeted</span>
        </div>
      </div>

      {/* Pressure Category Alert */}
      {pressureCategory && pressureCategory.budgeted > 0 && (pressureCategory.spent / pressureCategory.budgeted) * 100 > 75 && (
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
      <button
        onClick={() => { setEditBudget(null); setShowModal(true); }}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30"
      >
        <Plus className="w-5 h-5" />
        <span>Add Budget</span>
      </button>

      {/* Budget List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Category Budgets</h3>
        {budgets.length === 0 && !isLoading && (
          <div className="flex flex-col items-center py-8">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-white/50 text-sm">No budgets set for this month</p>
            <p className="text-white/30 text-xs mt-1">Tap "Add Budget" to get started</p>
          </div>
        )}
        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentSpent = budget.budgeted > 0 ? (budget.spent / budget.budgeted) * 100 : 0;
            const remaining = budget.budgeted - budget.spent;
            const isOverBudget = percentSpent > 100;
            const isPressure = percentSpent > 75;

            return (
              <div
                key={budget.id}
                className={`bg-[#1B2130] rounded-2xl p-5 border ${
                  isOverBudget ? "border-[#EF4444]/50" : isPressure ? "border-[#FFA500]/50" : "border-white/5"
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
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="text-white font-semibold">₹{budget.spent.toLocaleString()}</p>
                      <p className="text-xs text-white/50">of ₹{budget.budgeted.toLocaleString()}</p>
                    </div>
                    <button onClick={() => { setEditBudget(budget); setShowModal(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-white/40" />
                    </button>
                    <button onClick={() => setShowDelete(budget)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400/50" />
                    </button>
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
                  {isPressure && !isOverBudget && <span className="text-[#FFA500]">⚠️ High usage</span>}
                  {isOverBudget && <span className="text-[#EF4444]">❌ Over budget</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Budget Modal */}
      <AnimatePresence>
        {showModal && (
          <BudgetModal
            budget={editBudget}
            month={monthStr}
            categories={categories}
            existingCategoryIds={budgets.map(b => b.category_id)}
            onClose={() => { setShowModal(false); setEditBudget(null); }}
            onSaved={() => { setShowModal(false); setEditBudget(null); loadBudgets(); }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(16px)" }}
            onClick={() => setShowDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.86, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: "linear-gradient(135deg,#1C2440,#131926)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-white font-bold text-center mb-2" style={{ fontSize: 17 }}>Delete Budget?</h3>
              <p className="text-white/42 text-center mb-6" style={{ fontSize: 13 }}>
                Remove the budget for <span className="text-white/68 font-medium">"{showDelete.category}"</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(null)}
                  className="flex-1 py-3.5 rounded-2xl font-semibold text-white/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#F72585,#EF4444)", boxShadow: "0 6px 20px rgba(247,37,133,0.38)" }}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Budget Add/Edit Modal ──────────────────────────────────────────────────────
function BudgetModal({ budget, month, categories, existingCategoryIds, onClose, onSaved }: {
  budget: BudgetItem | null;
  month: string;
  categories: any[];
  existingCategoryIds: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedCat, setSelectedCat] = useState(budget?.category_id || "");
  const [amount, setAmount] = useState(budget ? String(budget.budgeted) : "");
  const [saving, setSaving] = useState(false);

  const isEdit = !!budget;

  // Filter out categories that already have budgets (except current edit)
  const availableCats = categories.filter(c =>
    isEdit ? true : !existingCategoryIds.includes(c.id)
  );

  const handleSave = async () => {
    if (!selectedCat || !amount || parseFloat(amount) <= 0) {
      toast.error("Please select a category and enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && budget) {
        await budgetsAPI.update(budget.id, { amount: parseFloat(amount), category_id: selectedCat });
        toast.success("Budget updated");
      } else {
        await budgetsAPI.save({ category_id: selectedCat, amount: parseFloat(amount), month });
        toast.success("Budget created");
      }
      onSaved();
    } catch (e) {
      toast.error("Failed to save budget");
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-3xl"
        style={{
          background: "linear-gradient(180deg,#16203A 0%,#0E1424 100%)",
          border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none",
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-white/15" />
        </div>

        <div className="px-5 pb-8 pt-2 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold" style={{ fontSize: 19 }}>
              {isEdit ? "Edit Budget" : "Add Budget"}
            </h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-white/40 mb-2.5 block" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px" }}>
              CATEGORY
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {availableCats.map((cat: any) => (
                <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                  style={{
                    background: selectedCat === cat.id ? `${cat.color || '#7C5CFF'}28` : "rgba(255,255,255,0.04)",
                    border: selectedCat === cat.id ? `1.5px solid ${cat.color || '#7C5CFF'}55` : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <span style={{ fontSize: 20 }}>{cat.icon || "📦"}</span>
                  <span className="text-xs font-semibold truncate w-full text-center px-1"
                    style={{ color: selectedCat === cat.id ? (cat.color || '#7C5CFF') : "rgba(255,255,255,0.45)" }}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
            {availableCats.length === 0 && (
              <p className="text-white/30 text-sm text-center py-4">All categories already have budgets</p>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-white/40 mb-2 block" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px" }}>
              BUDGET AMOUNT
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold" style={{ fontSize: 18 }}>₹</span>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                className="w-full pl-10 pr-4 py-4 rounded-2xl text-white placeholder:text-white/22 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontSize: 22, fontWeight: 700,
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-semibold text-white/50"
              style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 14 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-4 rounded-2xl text-white font-bold"
              style={{
                fontSize: 14,
                background: "linear-gradient(135deg,#7C5CFF 0%,#4CC9F0 100%)",
                boxShadow: "0 6px 22px rgba(124,92,255,0.48)",
                opacity: saving ? 0.6 : 1,
              }}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "✦ Add Budget"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}