import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { User, Moon, Sun, DollarSign, Calendar as CalendarIcon, Download, Shield, Cloud, Key, LogOut, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { authAPI, transactionsAPI } from "../services/api";

export function SettingsScreen() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("finly-theme");
    return saved !== "light"; // default to dark
  });
  const [currency, setCurrency] = useState("INR");
  const [weekStart, setWeekStart] = useState("Sunday");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const user = authAPI.getCurrentUser();

  // Apply theme on mount and change
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    localStorage.setItem("finly-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    // Toggle class for CSS
    if (darkMode) {
      document.documentElement.classList.remove("light-mode");
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.documentElement.classList.add("light-mode");
    }
  }, [darkMode]);

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    toast.success(darkMode ? "Light mode enabled" : "Dark mode enabled");
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate("/auth/login");
    toast.success("Logged out successfully");
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("Exporting data...");
      const transactions = await transactionsAPI.getAll({});
      if (!transactions || transactions.length === 0) {
        toast.dismiss();
        toast.error("No transactions to export");
        return;
      }
      // Generate CSV
      const headers = ["Date", "Type", "Amount", "Note", "Category"];
      const rows = transactions.map((t: any) => [
        t.date?.substring(0, 10) || "",
        t.type || "",
        t.amount || "0",
        `"${(t.note || t.description || "").replace(/"/g, '""')}"`,
        t.category_id || "",
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finly-transactions-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("Data exported successfully");
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to export data");
    }
  };

  const settingsSections = [
    {
      title: "Profile",
      items: [
        { icon: User, label: "Edit Profile", value: user?.name || "User", action: () => toast.info("Profile editing coming soon") },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: darkMode ? Moon : Sun, label: "Dark Mode", value: darkMode, isToggle: true, action: handleThemeToggle },
        { icon: DollarSign, label: "Currency", value: currency, action: () => setShowCurrencyModal(true) },
        { icon: CalendarIcon, label: "Week Starts On", value: weekStart, action: () => setShowWeekModal(true) },
      ],
    },
    {
      title: "Data & Export",
      items: [
        { icon: Download, label: "Export CSV", value: null, action: handleExportCSV },
      ],
    },
    {
      title: "Backup & Sync",
      items: [
        { icon: Cloud, label: "Google Drive Backup", value: "Not Connected", action: () => toast.info("Google Drive backup coming soon") },
        { icon: Download, label: "Local Backup", value: null, action: handleExportCSV },
        { icon: Download, label: "Restore from Backup", value: null, action: () => toast.info("Restore coming soon") },
      ],
    },
    {
      title: "Security",
      items: [
        { icon: Key, label: "Change Password", value: null, action: () => toast.info("Password change coming soon") },
      ],
    },
  ];

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name || "User"}</h2>
            <p className="text-white/80 text-sm">{user?.email || "user@example.com"}</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider px-1">
            {section.title}
          </h3>
          <div className="bg-[#1B2130] rounded-2xl border border-white/5 overflow-hidden">
            {section.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors ${
                    index !== section.items.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-white/70" />
                    <span className="text-white font-medium">{item.label}</span>
                  </div>

                  {item.isToggle ? (
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-7 rounded-full p-1 transition-all duration-300"
                      style={{
                        background: item.value
                          ? "linear-gradient(135deg,#7C5CFF,#4CC9F0)"
                          : "rgba(255,255,255,0.15)",
                        boxShadow: item.value ? "0 2px 10px rgba(124,92,255,0.4)" : "none",
                      }}
                    >
                      <motion.div
                        animate={{ x: item.value ? 20 : 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                      >
                        {item.value
                          ? <Moon className="w-3 h-3 text-[#7C5CFF]" />
                          : <Sun className="w-3 h-3 text-gray-400" />
                        }
                      </motion.div>
                    </motion.div>
                  ) : item.value ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/50">{item.value}</span>
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Privacy Notice */}
      <div className="bg-[#1B2130] rounded-2xl p-5 border border-white/5">
        <div className="flex items-start gap-3 mb-3">
          <Shield className="w-5 h-5 text-[#7C5CFF] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold mb-2">Privacy & AI</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Your financial data is encrypted end-to-end and stored securely. AI features process data locally when possible. We never share your data with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-[#1B2130] rounded-2xl p-5 border border-white/5">
        <h3 className="text-white font-semibold mb-3">Export Data</h3>
        <div className="space-y-2">
          <button onClick={handleExportCSV} className="w-full py-3 bg-[#0D0F14] border border-white/10 rounded-xl text-white text-sm font-medium hover:border-[#7C5CFF]/30">
            Export All Data (CSV)
          </button>
          <button onClick={handleExportCSV} className="w-full py-3 bg-[#0D0F14] border border-white/10 rounded-xl text-white text-sm font-medium hover:border-[#7C5CFF]/30">
            Export Last 30 Days
          </button>
          <button onClick={() => toast.info("Custom range export coming soon")} className="w-full py-3 bg-[#0D0F14] border border-white/10 rounded-xl text-white text-sm font-medium hover:border-[#7C5CFF]/30">
            Export Custom Range
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#1B2130] rounded-2xl p-5 border border-[#EF4444]/20">
        <h3 className="text-[#EF4444] font-semibold mb-3">Danger Zone</h3>
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0D0F14] border border-white/10 rounded-xl text-white font-medium hover:border-[#EF4444]/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] font-medium hover:bg-[#EF4444]/20"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center py-4">
        <p className="text-sm text-white/50">Finly v1.0.0</p>
        <p className="text-xs text-white/30 mt-1">Made with ❤️ for better finances</p>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative max-w-sm w-full bg-[#1B2130] rounded-2xl p-6 border border-[#EF4444]/30">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-[#EF4444]" />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Delete Account?</h2>
            <p className="text-sm text-white/60 text-center mb-6">
              This will permanently delete all your data including transactions, budgets, and goals. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-[#0D0F14] border border-white/10 rounded-xl text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  authAPI.deleteAccount?.();
                  authAPI.logout();
                  navigate("/auth/login");
                  toast.success("Account deleted");
                }}
                className="flex-1 py-3 bg-[#EF4444] rounded-xl text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCurrencyModal(false)} />
          <div className="relative max-w-sm w-full bg-[#1B2130] rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4">Select Currency</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)"].map(c => {
                const code = c.split(" ")[0];
                return (
                  <button key={c} onClick={() => { setCurrency(code); setShowCurrencyModal(false); toast.success(`Currency set to ${code}`); }}
                    className="w-full text-left px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
                    style={{
                      background: currency === code ? "rgba(124,92,255,0.15)" : "transparent",
                      border: currency === code ? "1px solid rgba(124,92,255,0.4)" : "1px solid transparent",
                      color: "white",
                    }}>
                    {c}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowCurrencyModal(false)}
              className="w-full mt-4 py-3 rounded-xl text-white/50 font-medium"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Week Start Modal */}
      {showWeekModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWeekModal(false)} />
          <div className="relative max-w-sm w-full bg-[#1B2130] rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4">Week Starts On</h2>
            <div className="space-y-2">
              {["Sunday", "Monday", "Saturday"].map(day => (
                <button key={day} onClick={() => { setWeekStart(day); setShowWeekModal(false); toast.success(`Week starts on ${day}`); }}
                  className="w-full text-left px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
                  style={{
                    background: weekStart === day ? "rgba(124,92,255,0.15)" : "transparent",
                    border: weekStart === day ? "1px solid rgba(124,92,255,0.4)" : "1px solid transparent",
                    color: "white",
                  }}>
                  {day}
                </button>
              ))}
            </div>
            <button onClick={() => setShowWeekModal(false)}
              className="w-full mt-4 py-3 rounded-xl text-white/50 font-medium"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}