import { useNavigate } from "react-router";
import { X, Target, Calendar, Bot, PiggyBank, Wallet, Grid3x3, Settings, Moon, Sun, Search, Repeat } from "lucide-react";
import { useState } from "react";

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreSheet({ isOpen, onClose }: MoreSheetProps) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);

  const menuItems = [
    { icon: Repeat, label: "Recurring", path: "/dashboard/recurring" },
    { icon: Target, label: "Budget", path: "/dashboard/budget" },
    { icon: Calendar, label: "Calendar", path: "/dashboard/calendar" },
    { icon: Bot, label: "AI Agent", path: "/dashboard/ai-agent" },
    { icon: PiggyBank, label: "Goals", path: "/dashboard/goals" },
    { icon: Wallet, label: "Accounts", path: "/dashboard/accounts" },
    { icon: Grid3x3, label: "Categories", path: "/dashboard/categories" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="max-w-md mx-auto bg-[#1B2130] rounded-t-3xl border-t border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">More</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Quick Actions</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleNavigate("/dashboard/reports")}
                className="flex-1 py-2.5 rounded-xl bg-[#0D0F14] border border-white/5 text-sm text-white hover:border-[#7C5CFF]/30"
              >
                Reports
              </button>
              <button
                onClick={() => handleNavigate("/dashboard/transactions")}
                className="flex-1 py-2.5 rounded-xl bg-[#0D0F14] border border-white/5 text-sm text-white hover:border-[#7C5CFF]/30"
              >
                <Search className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Explore</p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#7C5CFF]" />
                    </div>
                    <span className="text-white font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="px-6 py-4 border-t border-white/5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#0D0F14] border border-white/5"
            >
              <span className="text-white font-medium">Dark Mode</span>
              <div className="flex items-center gap-2">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-[#7C5CFF]" />
                ) : (
                  <Sun className="w-5 h-5 text-[#4CC9F0]" />
                )}
                <div
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    darkMode ? "bg-[#7C5CFF]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      darkMode ? "translate-x-6" : ""
                    }`}
                  />
                </div>
              </div>
            </button>
          </div>

          {/* Safe area padding */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}