import { Outlet, useLocation, useNavigate } from "react-router";
import { ArrowLeft, Search, Bell, Bookmark, Plus, Home, FileText, BarChart3, Menu as MenuIcon, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoreSheet } from "../components/MoreSheet";
import { CategoryProvider } from "../context/CategoryContext";
import { statsAPI } from "../services/api";

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifRead, setNotifRead] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Fetch notifications
  useEffect(() => {
    statsAPI.getNotifications()
      .then(data => {
        setNotifications(data || []);
        if (data && data.length > 0) setNotifRead(false);
      })
      .catch(console.error);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path === "/dashboard/transactions") return "Transactions";
    if (path === "/dashboard/add-transaction") return "Add Transaction";
    if (path.startsWith("/dashboard/edit-transaction")) return "Edit Transaction";
    if (path === "/dashboard/reports") return "Reports";
    if (path === "/dashboard/categories") return "Categories";
    if (path === "/dashboard/accounts") return "Accounts";
    if (path === "/dashboard/calendar") return "Calendar";
    if (path === "/dashboard/budget") return "Budget";
    if (path === "/dashboard/goals") return "Goals";
    if (path === "/dashboard/ai-agent") return "AI Agent";
    if (path === "/dashboard/settings") return "Settings";
    return "Finly";
  };

  const showBackButton = location.pathname !== "/dashboard";
  const showAddButton = ["/dashboard", "/dashboard/transactions"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] pb-20">
      <CategoryProvider>
      <div className="max-w-md mx-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-[var(--bg-deep)]/95 backdrop-blur-xl border-b border-[var(--divider)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center border border-[var(--divider)] active:scale-95 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5 text-[var(--ink)]" />
                </button>
              )}
              <h1 className="text-lg font-semibold text-[var(--ink)] font-inter">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/dashboard/transactions")}
                className="w-9 h-9 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center border border-[var(--divider)]"
              >
                <Search className="w-4 h-4 text-[var(--ink-muted)]" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowNotifications(true); setNotifRead(true); }}
                className="relative w-9 h-9 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center border border-[var(--divider)]"
              >
                <Bell className="w-4 h-4 text-[var(--ink-muted)]" />
                {!notifRead && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-[var(--coral)] rounded-full"></div>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowBookmarks(true)}
                className="w-9 h-9 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center border border-[var(--divider)]"
              >
                <Bookmark className="w-4 h-4 text-[var(--ink-muted)]" />
              </motion.button>
              {showAddButton && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate("/dashboard/add-transaction")}
                  className="w-9 h-9 rounded-xl bg-[var(--gold)] flex items-center justify-center shadow-lg shadow-[var(--gold)]/20"
                >
                  <Plus className="w-4 h-4 text-[#241B0A]" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef}>
          <Outlet />
        </div>

        {/* Notifications Panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
              onClick={() => setShowNotifications(false)}
            >
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md mx-auto rounded-t-3xl"
                style={{ background: "var(--bg-deep)", border: "1px solid var(--divider)", borderBottom: "none", maxHeight: "70vh" }}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-9 h-1 rounded-full bg-ink/15" />
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <h2 className="text-ink font-bold" style={{ fontSize: 18 }}>Notifications</h2>
                  <button onClick={() => setShowNotifications(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-ink/5">
                    <X className="w-4 h-4 text-ink/50" />
                  </button>
                </div>
                <div className="px-5 pb-8 space-y-3">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-6">
                      <p className="text-ink/40" style={{ fontSize: 13 }}>No new notifications</p>
                    </div>
                  ) : notifications.map((n, i) => (
                    <motion.div key={i} whileTap={{ scale: 0.98 }}
                      className="flex items-start gap-3 p-4 rounded-2xl"
                      style={{ background: "color-mix(in srgb, var(--ink) 4%, transparent)", border: "1px solid var(--divider)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${n.color}18` }}>
                        <Bell className="w-4 h-4" style={{ color: n.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ink font-semibold" style={{ fontSize: 13 }}>{n.title}</p>
                        <p className="text-ink/50 mt-0.5" style={{ fontSize: 12 }}>{n.desc}</p>
                        <p className="text-ink/25 mt-1" style={{ fontSize: 11 }}>{n.time}</p>
                      </div>
                    </motion.div>
                  ))}
                  <div className="flex flex-col items-center py-6">
                    <p className="text-ink/30" style={{ fontSize: 13 }}>That's all for now</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookmarks Panel */}
        <AnimatePresence>
          {showBookmarks && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
              onClick={() => setShowBookmarks(false)}
            >
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md mx-auto rounded-t-3xl"
                style={{ background: "var(--bg-deep)", border: "1px solid var(--divider)", borderBottom: "none", maxHeight: "70vh" }}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-9 h-1 rounded-full bg-ink/15" />
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <h2 className="text-ink font-bold" style={{ fontSize: 18 }}>Bookmarked</h2>
                  <button onClick={() => setShowBookmarks(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-ink/5">
                    <X className="w-4 h-4 text-ink/50" />
                  </button>
                </div>
                <div className="px-5 pb-8">
                  <div className="flex flex-col items-center py-10">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)", border: "1.5px dashed var(--divider)" }}>
                      <Bookmark className="w-6 h-6 text-ink/20" />
                    </div>
                    <p className="text-ink/40 font-semibold" style={{ fontSize: 14 }}>No bookmarks yet</p>
                    <p className="text-ink/25 mt-1" style={{ fontSize: 12 }}>Star transactions to save them here</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--divider)] backdrop-blur-xl z-40">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-around px-2 py-2 relative">
              {/* Home */}
              <button
                onClick={() => navigate("/dashboard")}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                  location.pathname === "/dashboard" ? "text-[var(--gold)]" : "text-[var(--ink-muted)]"
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[10px] font-medium font-inter">Home</span>
              </button>

              {/* Ledger */}
              <button
                onClick={() => navigate("/dashboard/transactions")}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                  location.pathname === "/dashboard/transactions" ? "text-[var(--gold)]" : "text-[var(--ink-muted)]"
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-[10px] font-medium font-inter">Ledger</span>
              </button>

              {/* Center FAB */}
              <button
                onClick={() => navigate("/dashboard/add-transaction")}
                className="w-14 h-14 -mt-6 rounded-2xl bg-[var(--gold)] flex items-center justify-center shadow-lg shadow-[var(--gold)]/30"
              >
                <Plus className="w-6 h-6 text-[#241B0A]" />
              </button>

              {/* Reports */}
              <button
                onClick={() => navigate("/dashboard/reports")}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                  location.pathname === "/dashboard/reports" ? "text-[var(--gold)]" : "text-[var(--ink-muted)]"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-[10px] font-medium font-inter">Reports</span>
              </button>

              {/* More */}
              <button
                onClick={() => setShowMore(true)}
                className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl text-[var(--ink-muted)]"
              >
                <MenuIcon className="w-5 h-5" />
                <span className="text-[10px] font-medium font-inter">More</span>
              </button>
            </div>
          </div>
        </div>

        {/* More Sheet */}
        <MoreSheet isOpen={showMore} onClose={() => setShowMore(false)} />
      </div>
      </CategoryProvider>
    </div>
  );
}