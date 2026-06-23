import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Shield, Users, ArrowLeft, RefreshCw, Search, Award, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { adminAPI } from "../services/api";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  subscriptions: {
    Free: number;
    Pro: number;
    Premium: number;
  };
  userList: {
    id: string;
    name: string;
    email: string;
    subscription_tier: "Free" | "Pro" | "Premium";
    created_at: string;
  }[];
}

export function AdminScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminStats = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleTierChange = async (userId: string, currentTier: string, newTier: "Free" | "Pro" | "Premium") => {
    if (currentTier === newTier) return;
    
    const promise = adminAPI.updateUserTier(userId, newTier);
    toast.promise(promise, {
      loading: `Updating user to ${newTier}...`,
      success: () => {
        // Update local stats state
        if (stats) {
          const updatedUserList = stats.userList.map(u => 
            u.id === userId ? { ...u, subscription_tier: newTier } : u
          );
          
          // Re-calculate subscriptions count
          const subscriptions = { Free: 0, Pro: 0, Premium: 0 };
          updatedUserList.forEach(u => {
            subscriptions[u.subscription_tier] = (subscriptions[u.subscription_tier] || 0) + 1;
          });

          setStats({
            ...stats,
            userList: updatedUserList,
            subscriptions
          });
        }
        return `Successfully updated subscription to ${newTier}`;
      },
      error: (err: any) => err.message || "Failed to update subscription tier"
    });
  };

  const filteredUsers = stats?.userList.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#D4A24C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] pb-24 px-5 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/dashboard/settings")} className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--divider)] hover:bg-ink/5 text-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-ink flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#D4A24C]" />
          Admin Panel
        </h1>
        <button 
          onClick={() => fetchAdminStats(true)} 
          disabled={refreshing}
          className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--divider)] hover:bg-ink/5 text-ink transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--divider)]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-ink/50 text-xs font-medium uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-bold text-ink mt-1">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--divider)]">
          <div className="w-10 h-10 rounded-xl bg-[#6FBE9B]/10 flex items-center justify-center mb-3">
            <User className="w-5 h-5 text-[#6FBE9B]" />
          </div>
          <p className="text-ink/50 text-xs font-medium uppercase tracking-wider">Active (30d)</p>
          <p className="text-2xl font-bold text-[#6FBE9B] mt-1">{stats?.activeUsers || 0}</p>
        </div>
      </div>

      {/* Subscriptions Card */}
      <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--divider)] space-y-4">
        <h3 className="text-sm font-semibold text-ink/75 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#D4A24C]" />
          Subscription Breakdown
        </h3>

        <div className="space-y-3">
          {/* Free Tier */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink/60 font-medium">Free Tier</span>
              <span className="text-ink font-bold">{stats?.subscriptions.Free || 0} users</span>
            </div>
            <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-ink/40 rounded-full" 
                style={{ width: `${stats ? (stats.subscriptions.Free / stats.totalUsers) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Pro Tier */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#6FBE9B] font-medium">Pro Tier</span>
              <span className="text-ink font-bold">{stats?.subscriptions.Pro || 0} users</span>
            </div>
            <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#6FBE9B] rounded-full" 
                style={{ width: `${stats ? (stats.subscriptions.Pro / stats.totalUsers) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Premium Tier */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#D4A24C] font-medium">Premium Tier</span>
              <span className="text-ink font-bold">{stats?.subscriptions.Premium || 0} users</span>
            </div>
            <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D4A24C] rounded-full" 
                style={{ width: `${stats ? (stats.subscriptions.Premium / stats.totalUsers) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Management List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink/75 uppercase tracking-wider px-1">
          User Management
        </h3>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/30" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-ink/10 rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none text-sm"
          />
        </div>

        {/* User Cards list */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-sm text-ink/40">
              No users found matching your search.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--divider)] flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{user.name}</h4>
                    <p className="text-xs text-ink/50 mt-0.5">{user.email}</p>
                    <p className="text-[10px] text-ink/30 mt-1">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span 
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        user.subscription_tier === "Premium" 
                          ? "bg-[#D4A24C]/10 text-[#D4A24C]" 
                          : user.subscription_tier === "Pro"
                            ? "bg-[#6FBE9B]/10 text-[#6FBE9B]"
                            : "bg-ink/5 text-ink/60"
                      }`}
                    >
                      {user.subscription_tier}
                    </span>
                  </div>
                </div>

                {/* Manage tier buttons */}
                {user.email !== "admin_finly" && (
                  <div className="pt-2 border-t border-[var(--divider)]">
                    <p className="text-[10px] font-medium text-ink/40 mb-2">Change Tier:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Free", "Pro", "Premium"] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => handleTierChange(user.id, user.subscription_tier, tier)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                            user.subscription_tier === tier
                              ? tier === "Premium"
                                ? "bg-[#D4A24C] text-[var(--bg-deep)]"
                                : tier === "Pro"
                                  ? "bg-[#6FBE9B] text-[var(--bg-deep)]"
                                  : "bg-ink/20 text-ink"
                              : "bg-[var(--bg-deep)] border border-[var(--divider)] text-ink/65 hover:border-ink/20"
                          }`}
                        >
                          {user.subscription_tier === tier && <Check className="w-3 h-3" />}
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
