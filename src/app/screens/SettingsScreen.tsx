import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { User, Moon, Sun, DollarSign, Calendar as CalendarIcon, Download, Shield, Cloud, Key, LogOut, Trash2, ChevronRight, Crown, Camera, RefreshCw, Tag } from "lucide-react";
import { toast } from "sonner";
import { authAPI, transactionsAPI, accountsAPI, categoriesAPI, budgetsAPI, savingsGoalsAPI, settingsAPI, autoBackupAPI, couponsAPI } from "../services/api";
import { exportTransactionsPDF } from "../utils/pdf";
import { CouponSuccessModal } from "../components/CouponSuccessModal";

export function SettingsScreen() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("finly-theme");
    return saved !== "light"; // default to dark
  });
  const [currency, setCurrency] = useState("INR");
  const [weekStart, setWeekStart] = useState("Sunday");
  const [dashboardRefresh, setDashboardRefresh] = useState(() => {
    const saved = localStorage.getItem("finly-dashboard-refresh");
    return saved ? saved.charAt(0).toUpperCase() + saved.slice(1) : "Monthly";
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [showDashboardRefreshModal, setShowDashboardRefreshModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => authAPI.getCurrentUser());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [redeemedCode, setRedeemedCode] = useState("PG1011");
  const [expiresAt, setExpiresAt] = useState<string | undefined>();

  // Google Drive state variables
  const [isGDriveConnected, setIsGDriveConnected] = useState(() => {
    return !!localStorage.getItem("google_access_token");
  });
  const [showGDriveModal, setShowGDriveModal] = useState(false);
  const [gdriveClientId, setGdriveClientId] = useState(() => localStorage.getItem("finly-google-client-id") || import.meta.env.VITE_GOOGLE_CLIENT_ID || "");
  const [backupFiles, setBackupFiles] = useState<any[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Automatic (server-side, daily) Google Drive backup state
  const [isAutoBackupConnected, setIsAutoBackupConnected] = useState(false);
  const [isAutoBackupLoading, setIsAutoBackupLoading] = useState(false);

  useEffect(() => {
    autoBackupAPI.getStatus().then(res => setIsAutoBackupConnected(!!res?.connected)).catch(() => {});

    // Handle the redirect back from Google's consent screen (?gdrive=connected|error)
    const params = new URLSearchParams(window.location.search);
    const gdrive = params.get("gdrive");
    if (gdrive === "connected") {
      toast.success("Automatic daily backup to Google Drive enabled!");
      setIsAutoBackupConnected(true);
    } else if (gdrive === "error") {
      toast.error("Failed to connect Google Drive for automatic backup. Please try again.");
    }
    if (gdrive) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnectAutoBackup = () => {
    window.location.href = autoBackupAPI.getConnectUrl();
  };

  const handleDisconnectAutoBackup = async () => {
    try {
      setIsAutoBackupLoading(true);
      await autoBackupAPI.disconnect();
      setIsAutoBackupConnected(false);
      toast.success("Automatic daily backup disabled");
    } catch (e: any) {
      toast.error(e?.message || "Failed to disconnect");
    } finally {
      setIsAutoBackupLoading(false);
    }
  };

  const handleRunAutoBackupNow = async () => {
    try {
      setIsAutoBackupLoading(true);
      await autoBackupAPI.runNow();
      toast.success("Backup uploaded to Google Drive");
    } catch (e: any) {
      toast.error(e?.message || "Backup failed");
    } finally {
      setIsAutoBackupLoading(false);
    }
  };

  useEffect(() => {
    // Inject Google Identity Services client script dynamically
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem("google_access_token");
      if (!token) return;

      const files = await listBackupsFromDrive(token);
      setBackupFiles(files);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to retrieve Google Drive backups");
    }
  };

  const handleOpenGDriveModal = async () => {
    setShowGDriveModal(true);
    if (isGDriveConnected) {
      fetchBackups();
    }
  };

  const handleConnectGDrive = () => {
    if (!gdriveClientId.trim()) {
      toast.error("Please enter a valid Google Client ID");
      return;
    }

    try {
      localStorage.setItem("finly-google-client-id", gdriveClientId);

      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: gdriveClientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: (resp: any) => {
          if (resp.access_token) {
            localStorage.setItem("google_access_token", resp.access_token);
            setIsGDriveConnected(true);
            toast.success("Successfully connected to Google Drive!");
            fetchBackups();
          } else {
            toast.error("Authentication failed: Access token missing");
          }
        },
        error_callback: (err: any) => {
          console.error(err);
          toast.error("OAuth authorization failed");
        }
      });
      tokenClient.requestAccessToken();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to initialize Google login. Ensure Client ID is valid.");
    }
  };

  const handleDisconnectGDrive = () => {
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("finly-google-client-id");
    localStorage.removeItem("gdrive_mode");
    localStorage.removeItem("gdrive_user");
    setIsGDriveConnected(false);
    setBackupFiles([]);
    toast.success("Disconnected Google Drive");
  };

  const handleBackupNow = async () => {
    try {
      setIsBackingUp(true);
      toast.loading("Preparing backup data...");

      const [transactions, accounts, categories, budgets, goals] = await Promise.all([
        transactionsAPI.getAll({}),
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
        budgetsAPI.get(),
        savingsGoalsAPI.getAll()
      ]);

      const backupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        transactions,
        accounts,
        categories,
        budgets,
        goals
      };

      toast.loading("Uploading backup to Google Drive...");

      const token = localStorage.getItem("google_access_token");
      if (!token) throw new Error("Google session expired. Please reconnect.");

      await uploadBackupToDrive(token, backupData);
      toast.dismiss();
      toast.success("Backup uploaded to Google Drive successfully!");
      fetchBackups();
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message || "Failed to complete backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleLocalBackupDownload = async () => {
    try {
      toast.loading("Preparing backup file...");
      const [transactions, accounts, categories, budgets, goals] = await Promise.all([
        transactionsAPI.getAll({}),
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
        budgetsAPI.get(),
        savingsGoalsAPI.getAll()
      ]);
      const backupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        transactions,
        accounts,
        categories,
        budgets,
        goals
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finly-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("Backup file downloaded — keep it safe for disaster recovery");
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message || "Failed to prepare backup file");
    }
  };

  const handleLocalRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!window.confirm("Restoring this backup will replace ALL your current categories, accounts, transactions, budgets, and goals in this account. Do you want to proceed?")) {
      return;
    }

    try {
      setIsRestoring(true);
      toast.loading("Reading backup file...");
      const text = await file.text();
      const backupData = JSON.parse(text);

      toast.loading("Restoring financial data...");
      const res = await settingsAPI.restore(backupData);
      toast.dismiss();
      if (res && res.message) {
        toast.success("Data restored successfully!");
        window.location.reload();
      } else {
        toast.error("Restore failed");
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message?.includes("JSON") ? "That file isn't a valid Finly backup" : (e?.message || "Failed to restore backup"));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreBackup = async (fileId: string) => {
    if (!window.confirm("Restoring this backup will replace ALL your current categories, accounts, transactions, budgets, and goals. Do you want to proceed?")) {
      return;
    }

    try {
      setIsRestoring(true);
      toast.loading("Downloading backup...");

      let backupData: any = null;

      const token = localStorage.getItem("google_access_token");
      if (!token) throw new Error("Google session expired. Please reconnect.");
      backupData = await downloadBackupFromDrive(token, fileId);

      toast.loading("Restoring financial databases...");
      const res = await settingsAPI.restore(backupData);
      toast.dismiss();
      if (res && res.message) {
        toast.success("Database restored successfully!");
        setShowGDriveModal(false);
        window.location.reload();
      } else {
        toast.error("Restore failed");
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message || "Failed to restore backup");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenProfileModal = () => {
    setProfileName(currentUser?.name || "");
    setProfileEmail(currentUser?.email || "");
    setProfilePhone(currentUser?.phone || "");
    setProfilePhoto(currentUser?.photo || "");
    setShowProfileModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsUpdating(true);
      toast.loading("Updating profile...");
      const res = await authAPI.updateProfile({
        name: profileName,
        email: profileEmail || undefined,
        phone: profilePhone || undefined,
        photo: profilePhoto || undefined,
      });
      toast.dismiss();
      if (res && res.message) {
        toast.success(res.message);
        setCurrentUser(authAPI.getCurrentUser());
        setShowProfileModal(false);
      } else {
        toast.error("Profile update failed");
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter a coupon code first");
      return;
    }
    const code = couponCode.trim().toUpperCase();
    try {
      setIsRedeeming(true);
      const res = await couponsAPI.redeem(code);
      if (res?.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
        setCurrentUser(res.user);
        setExpiresAt(res.user.subscription_expires_at);
      }
      setRedeemedCode(code);
      setCouponCode("");
      setShowCouponModal(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to redeem coupon");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("Exporting data...");
      const [transactions, accounts, categories] = await Promise.all([
        transactionsAPI.getAll({}),
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);

      if (!Array.isArray(transactions)) {
        throw new Error("Transactions is not an array");
      }
      if (!Array.isArray(accounts)) {
        throw new Error("Accounts is not an array");
      }
      if (!Array.isArray(categories)) {
        throw new Error("Categories is not an array");
      }

      if (transactions.length === 0) {
        toast.dismiss();
        toast.error("No transactions to export");
        return;
      }

      const accountNameById = new Map((accounts || []).map((a: any) => [a.id, a.name]));
      const categoryNameById = new Map((categories || []).map((c: any) => [c.id, c.name]));
      // Generate CSV
      const headers = ["Date", "Type", "Amount", "Note", "Category", "Account"];
      const rows = transactions.map((t: any) => [
        String(t.date || "").substring(0, 10),
        String(t.type || ""),
        String(t.amount || "0"),
        `"${String(t.note || t.description || "").replace(/"/g, '""')}"`,
        `"${String(categoryNameById.get(t.category_id) || t.category_id || "").replace(/"/g, '""')}"`,
        `"${String(accountNameById.get(t.account_id) || "").replace(/"/g, '""')}"`,
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
      console.error("CSV Export error:", e);
      toast.dismiss();
      toast.error("Failed to export data");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("Generating PDF...");
      const [transactions, accounts, categories] = await Promise.all([
        transactionsAPI.getAll({}),
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);

      if (!Array.isArray(transactions)) {
        throw new Error("Transactions is not an array");
      }
      if (!Array.isArray(accounts)) {
        throw new Error("Accounts is not an array");
      }
      if (!Array.isArray(categories)) {
        throw new Error("Categories is not an array");
      }

      if (transactions.length === 0) {
        toast.dismiss();
        toast.error("No transactions to export");
        return;
      }
      const accountNameById = new Map((accounts || []).map((a: any) => [a.id, a.name]));
      const categoryNameById = new Map((categories || []).map((c: any) => [c.id, c.name]));
      exportTransactionsPDF(transactions, accountNameById, categoryNameById);
      toast.dismiss();
      toast.success("PDF exported successfully");
    } catch (e) {
      console.error("PDF Export error:", e);
      toast.dismiss();
      toast.error("Failed to export PDF");
    }
  };

  const settingsSections: {
    title: string;
    items: {
      icon: any;
      label: string;
      value: any;
      isToggle?: boolean;
      action: () => void;
    }[];
  }[] = [
    {
      title: "Profile",
      items: [
        { icon: User, label: "Edit Profile", value: currentUser?.name || "User", action: handleOpenProfileModal },
        { icon: Crown, label: "Upgrade Plan", value: null, action: () => navigate("/dashboard/subscriptions") },
        ...(currentUser?.email === "admin_finly" ? [
          { icon: Shield, label: "Admin Dashboard", value: null, action: () => navigate("/dashboard/admin") }
        ] : []),
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: darkMode ? Moon : Sun, label: "Dark Mode", value: darkMode, isToggle: true, action: handleThemeToggle },
        { icon: DollarSign, label: "Currency", value: currency, action: () => setShowCurrencyModal(true) },
        { icon: CalendarIcon, label: "Week Starts On", value: weekStart, action: () => setShowWeekModal(true) },
        { icon: RefreshCw, label: "Dashboard Refresh", value: dashboardRefresh, action: () => setShowDashboardRefreshModal(true) },
      ],
    },
    {
      title: "Data & Export",
      items: [
        { icon: Download, label: "Export CSV", value: null, action: handleExportCSV },
        { icon: Download, label: "Export PDF", value: null, action: handleExportPDF },
      ],
    },
    {
      title: "Backup & Sync",
      items: [
        {
          icon: Cloud,
          label: "Automatic Daily Backup",
          value: isAutoBackupConnected ? "Connected" : "Not Connected",
          action: () => {
            if (isAutoBackupLoading) return;
            if (isAutoBackupConnected) {
              if (window.confirm("Disable automatic daily backup to Google Drive?")) handleDisconnectAutoBackup();
            } else {
              handleConnectAutoBackup();
            }
          },
        },
        ...(isAutoBackupConnected ? [
          { icon: RefreshCw, label: "Run Backup Now", value: null, action: handleRunAutoBackupNow },
        ] : []),
        { icon: Download, label: "Local Backup", value: null, action: handleLocalBackupDownload },
        { icon: Download, label: "Restore from Backup", value: null, action: () => document.getElementById("local-restore-upload")?.click() },
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
      {/* Hidden input for local JSON backup restore (disaster recovery into a new account) */}
      <input
        id="local-restore-upload"
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleLocalRestoreFile}
        disabled={isRestoring}
      />

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#D4A24C] to-[#D4A24C] rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-ink/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            {currentUser?.photo ? (
              <img src={currentUser.photo} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-ink" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">{currentUser?.name || "User"}</h2>
            <p className="text-ink/80 text-sm">{currentUser?.email || "user@example.com"}</p>
          </div>
        </div>
      </div>

      {/* Coupon Redemption */}
      <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--divider)] flex items-center gap-3">
        <Tag className="w-5 h-5 text-[#D4A24C] flex-shrink-0" />
        <input
          type="text"
          value={couponCode}
          onChange={e => setCouponCode(e.target.value)}
          placeholder="Have a coupon code?"
          className="flex-1 min-w-0 px-3 py-2 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-lg text-ink text-sm placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none"
          disabled={isRedeeming}
        />
        <button
          onClick={handleRedeemCoupon}
          disabled={isRedeeming || !couponCode.trim()}
          className="px-4 py-2 bg-[#D4A24C] rounded-lg text-black text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all flex-shrink-0"
        >
          {isRedeeming ? "Applying..." : "Redeem"}
        </button>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-ink/50 mb-3 uppercase tracking-wider px-1">
            {section.title}
          </h3>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] overflow-hidden">
            {section.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-4 py-4 hover:bg-ink/5 transition-colors ${
                    index !== section.items.length - 1 ? "border-b border-[var(--divider)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-ink/70" />
                    <span className="text-ink font-medium">{item.label}</span>
                  </div>

                  {item.isToggle ? (
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-7 rounded-full p-1 transition-all duration-300"
                      style={{
                        background: item.value
                          ? "linear-gradient(135deg,#D4A24C,#D4A24C)"
                          : "var(--divider)",
                        boxShadow: item.value ? "0 2px 10px rgba(212,162,76,0.4)" : "none",
                      }}
                    >
                      <motion.div
                        animate={{ x: item.value ? 20 : 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                      >
                        {item.value
                          ? <Moon className="w-3 h-3 text-[#D4A24C]" />
                          : <Sun className="w-3 h-3 text-gray-400" />
                        }
                      </motion.div>
                    </motion.div>
                  ) : item.value ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink/50">{item.value}</span>
                      <ChevronRight className="w-4 h-4 text-ink/40" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-ink/40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Privacy Notice */}
      <button
        onClick={() => navigate("/privacy")}
        className="w-full text-left bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]"
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#D4A24C] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-ink font-semibold mb-2">Privacy & AI</h3>
            <p className="text-sm text-ink/60 leading-relaxed">
              Your data is encrypted in transit and never sold. AI features (chat, insights, receipt scanning) send only the data needed to a third-party AI provider. See our full privacy policy for exactly what's collected and shared.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-ink/40 flex-shrink-0 mt-1" />
        </div>
      </button>

      {/* Export Options */}
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]">
        <h3 className="text-ink font-semibold mb-3">Export Data</h3>
        <div className="space-y-2">
          <button onClick={handleExportCSV} className="w-full py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink text-sm font-medium hover:border-[#D4A24C]/30">
            Export All Data (CSV)
          </button>
          <button onClick={handleExportCSV} className="w-full py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink text-sm font-medium hover:border-[#D4A24C]/30">
            Export Last 30 Days
          </button>
          <button onClick={() => toast.info("Custom range export coming soon")} className="w-full py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink text-sm font-medium hover:border-[#D4A24C]/30">
            Export Custom Range
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[#EF4444]/20">
        <h3 className="text-[#EF4444] font-semibold mb-3">Danger Zone</h3>
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink font-medium hover:border-[#EF4444]/30"
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
        <p className="text-sm text-ink/50">Finly v1.0.0</p>
        <p className="text-xs text-ink/30 mt-1">Made with ❤️ for better finances</p>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative max-w-sm w-full bg-[var(--surface)] rounded-2xl p-6 border border-[#EF4444]/30">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-[#EF4444]" />
            </div>
            <h2 className="text-xl font-bold text-ink text-center mb-2">Delete Account?</h2>
            <p className="text-sm text-ink/60 text-center mb-6">
              This will permanently delete all your data including transactions, budgets, and goals. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  authAPI.deleteAccount?.();
                  authAPI.logout();
                  navigate("/login");
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
          <div className="relative max-w-sm w-full bg-[var(--surface)] rounded-2xl p-6 border border-[var(--divider)]">
            <h2 className="text-lg font-bold text-ink mb-4">Select Currency</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)"].map(c => {
                const code = c.split(" ")[0];
                return (
                  <button key={c} onClick={() => { setCurrency(code); setShowCurrencyModal(false); toast.success(`Currency set to ${code}`); }}
                    className="w-full text-left px-4 py-3 rounded-xl transition-colors hover:bg-ink/5"
                    style={{
                      background: currency === code ? "rgba(212,162,76,0.15)" : "transparent",
                      border: currency === code ? "1px solid rgba(212,162,76,0.4)" : "1px solid transparent",
                      color: "var(--ink)",
                    }}>
                    {c}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowCurrencyModal(false)}
              className="w-full mt-4 py-3 rounded-xl text-ink/50 font-medium"
              style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Week Start Modal */}
      {showWeekModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWeekModal(false)} />
          <div className="relative max-w-sm w-full bg-[var(--surface)] rounded-2xl p-6 border border-[var(--divider)]">
            <h2 className="text-lg font-bold text-ink mb-4">Week Starts On</h2>
            <div className="space-y-2">
              {["Sunday", "Monday", "Saturday"].map(day => (
                <button key={day} onClick={() => { setWeekStart(day); setShowWeekModal(false); toast.success(`Week starts on ${day}`); }}
                  className="w-full text-left px-4 py-3 rounded-xl transition-colors hover:bg-ink/5"
                  style={{
                    background: weekStart === day ? "rgba(212,162,76,0.15)" : "transparent",
                    border: weekStart === day ? "1px solid rgba(212,162,76,0.4)" : "1px solid transparent",
                    color: "var(--ink)",
                  }}>
                  {day}
                </button>
              ))}
            </div>
            <button onClick={() => setShowWeekModal(false)}
              className="w-full mt-4 py-3 rounded-xl text-ink/50 font-medium"
              style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Refresh Modal */}
      {showDashboardRefreshModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDashboardRefreshModal(false)} />
          <div className="relative max-w-sm w-full bg-[var(--surface)] rounded-2xl p-6 border border-[var(--divider)]">
            <h2 className="text-lg font-bold text-ink mb-1">Dashboard Refresh</h2>
            <p className="text-ink/50 text-xs mb-4">Controls when the dashboard's default month view resets to today.</p>
            <div className="space-y-2">
              {[
                { label: "Monthly", desc: "Always opens on the current month" },
                { label: "Yearly", desc: "Resets to the current month once a year" },
                { label: "Never", desc: "Always resumes the last month you viewed" },
              ].map(opt => (
                <button key={opt.label}
                  onClick={() => {
                    setDashboardRefresh(opt.label);
                    localStorage.setItem("finly-dashboard-refresh", opt.label.toLowerCase());
                    setShowDashboardRefreshModal(false);
                    toast.success(`Dashboard refresh set to ${opt.label}`);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl transition-colors hover:bg-ink/5"
                  style={{
                    background: dashboardRefresh === opt.label ? "rgba(212,162,76,0.15)" : "transparent",
                    border: dashboardRefresh === opt.label ? "1px solid rgba(212,162,76,0.4)" : "1px solid transparent",
                    color: "var(--ink)",
                  }}>
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-ink/40 text-xs mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowDashboardRefreshModal(false)}
              className="w-full mt-4 py-3 rounded-xl text-ink/50 font-medium"
              style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          <div className="relative max-w-md w-full bg-[var(--surface)] rounded-2xl p-6 border border-[var(--divider)] shadow-2xl">
            <h2 className="text-xl font-bold text-ink mb-4">Edit Profile</h2>

            {/* Avatar Upload / Edit */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById("avatar-upload")?.click()}>
                <div className="w-24 h-24 rounded-full bg-[var(--bg-deep)] border-2 border-[#D4A24C] flex items-center justify-center overflow-hidden relative">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-ink/40" />
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                {/* Floating camera icon */}
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#D4A24C] flex items-center justify-center shadow-lg border border-[var(--surface)]">
                  <Camera className="w-4 h-4 text-black" />
                </div>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={isUpdating}
              />
              <p className="text-xs text-ink/40 mt-2">Click to upload photo</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none"
                  disabled={isUpdating}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink font-medium hover:bg-ink/5 active:scale-95 transition-all"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-gradient-to-r from-[#D4A24C] to-[#D4A24C] rounded-xl text-ink font-semibold shadow-lg shadow-[#D4A24C]/25 active:scale-95 transition-all disabled:opacity-50"
                disabled={isUpdating || !profileName.trim()}
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Backup Modal */}
      {showGDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGDriveModal(false)} />
          <div className="relative max-w-md w-full bg-[var(--surface)] rounded-2xl p-6 border border-[var(--divider)] shadow-2xl">
            <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#4285F4]" />
              <span>Google Drive Backup</span>
            </h2>

            {!isGDriveConnected ? (
              <div className="space-y-4">
                <p className="text-sm text-ink/60 leading-relaxed">
                  Backup your transactions, accounts, and budgets securely to your personal Google Drive account.
                </p>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-[#4285F4]">
                  💡 <strong>Developer Note:</strong> Enter your Google Client ID below to connect your Google Drive.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Google OAuth Client ID</label>
                  <input
                    type="text"
                    value={gdriveClientId}
                    onChange={e => setGdriveClientId(e.target.value)}
                    placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none text-xs"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleConnectGDrive}
                    className="w-full py-3 bg-[#4285F4] rounded-xl text-white text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                    disabled={!gdriveClientId.trim()}
                  >
                    Connect GDrive
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div>
                    <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Status</p>
                    <p className="text-sm text-ink font-medium mt-0.5">Linked to Google Cloud</p>
                  </div>
                  <button
                    onClick={handleDisconnectGDrive}
                    className="px-3 py-1.5 bg-[var(--bg-deep)] border border-[#EF4444]/30 text-[#EF4444] rounded-lg text-xs font-medium hover:bg-[#EF4444]/10 active:scale-95 transition-all"
                  >
                    Disconnect
                  </button>
                </div>

                <button
                  onClick={handleBackupNow}
                  disabled={isBackingUp}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4A24C] to-[#D4A24C] rounded-xl text-ink font-semibold shadow-lg shadow-[#D4A24C]/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Cloud className="w-4 h-4 text-black animate-pulse" />
                  <span>{isBackingUp ? "Backing up..." : "Backup Data Now"}</span>
                </button>

                <div>
                  <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2.5 px-1">Available Backups</h3>
                  {backupFiles.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-[var(--divider)] rounded-xl">
                      <p className="text-xs text-ink/30">No backups found on Google Drive</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {backupFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl">
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="text-xs font-semibold text-ink truncate">{file.name}</p>
                            <p className="text-[10px] text-ink/40 mt-0.5">
                              {new Date(file.createdTime).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRestoreBackup(file.id)}
                            disabled={isRestoring}
                            className="px-3 py-1.5 bg-[#D4A24C]/10 border border-[#D4A24C]/30 text-[#D4A24C] rounded-lg text-xs font-semibold hover:bg-[#D4A24C]/20 active:scale-95 transition-all flex-shrink-0"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGDriveModal(false)}
              className="w-full mt-4 py-3 rounded-xl text-ink/40 text-sm font-medium hover:bg-ink/5"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <CouponSuccessModal
        isOpen={showCouponModal}
        couponCode={redeemedCode}
        expiresAt={expiresAt}
        onClose={() => {
          setShowCouponModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}

// ─── Google Drive API Helpers ──────────────────────────────────────────────────
const listBackupsFromDrive = async (accessToken: string) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name+contains+'finly-backup-'+and+mimeType='application/json'&orderBy=createdTime+desc&fields=files(id,name,createdTime)`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) throw new Error("Failed to list backups");
  const data = await response.json();
  return data.files || [];
};

const uploadBackupToDrive = async (accessToken: string, backupData: any) => {
  const metadata = {
    name: `finly-backup-${new Date().toISOString().split("T")[0]}.json`,
    mimeType: "application/json",
  };
  const file = new Blob([JSON.stringify(backupData)], { type: "application/json" });
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!response.ok) throw new Error("Failed to upload backup");
  return response.json();
};

const downloadBackupFromDrive = async (accessToken: string, fileId: string) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to download file");
  return response.json();
};

