import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Crown, Shield, Star, Tag, Zap } from "lucide-react";
import { toast } from "sonner";
import { authAPI, couponsAPI } from "../services/api";
import { startRazorpayCheckout } from "../services/razorpay";

const plans = [
  {
    id: "basic",
    name: "Basic",
    icon: Shield,
    price: "Free",
    period: "forever",
    description: "Perfect for getting started with personal finance.",
    features: [
      "Track up to 2 accounts",
      "Basic budgeting",
      "Monthly reports",
      "Manual transaction entry",
    ],
    notIncluded: ["Bank syncing", "AI Insights", "Custom categories"],
    color: "var(--ink-muted)",
    buttonText: "Current Plan",
    buttonVariant: "outline",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Star,
    price: "₹299",
    period: "/month",
    description: "Advanced tools for serious wealth builders.",
    features: [
      "Unlimited accounts",
      "Advanced budgeting tools",
      "Custom categories & tags",
      "Bank syncing (up to 3 banks)",
      "Basic AI Insights",
    ],
    notIncluded: ["Priority Support", "Unlimited AI interactions"],
    color: "#6FBE9B", // Mint
    buttonText: "Upgrade to Pro",
    buttonVariant: "solid",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    icon: Crown,
    price: "₹999",
    period: "/month",
    description: "The ultimate financial operating system.",
    features: [
      "Everything in Pro",
      "Unlimited bank syncing",
      "Advanced AI Agent & Insights",
      "Priority 24/7 Support",
      "Early access to new features",
      "Family sharing (up to 4 members)",
    ],
    notIncluded: [],
    color: "#D4A24C", // Gold
    buttonText: "Upgrade to Premium",
    buttonVariant: "solid",
  },
];

export function SubscriptionsScreen() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter a coupon code first");
      return;
    }
    try {
      setIsRedeeming(true);
      const res = await couponsAPI.redeem(couponCode.trim());
      if (res?.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
      }
      toast.success(res?.message || "Coupon applied!");
      setCouponCode("");
      setTimeout(() => window.location.reload(), 1200);
    } catch (e: any) {
      toast.error(e?.message || "Failed to redeem coupon");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === "basic" || processingPlan) return;

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const tier = planId === "pro" ? "Pro" : "Premium";
    const baseAmount = parseInt(plan.price.replace("₹", ""), 10);
    const amountInRupees = billingCycle === "yearly" ? Math.floor(baseAmount * 12 * 0.8) : baseAmount;
    const user = authAPI.getCurrentUser();

    setProcessingPlan(planId);
    await startRazorpayCheckout({
      plan: tier,
      amountInRupees,
      description: `Upgrade to Finly ${plan.name} (${billingCycle})`,
      themeColor: plan.color,
      prefill: {
        name: user?.name || "Finly User",
        email: user?.email || "",
        contact: user?.phone || "",
      },
      onSuccess: (updatedUser) => {
        toast.success(`Success! Welcome to Finly ${plan.name}!`);
        if (updatedUser) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        setTimeout(() => window.location.reload(), 1500);
      },
      onError: (message) => {
        toast.error(message);
        setProcessingPlan(null);
      },
      onDismiss: () => {
        toast.info("Payment cancelled.");
        setProcessingPlan(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] pb-24 px-5 pt-8">
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink/5 border border-[var(--divider)] mb-4"
        >
          <Zap className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-sm font-medium text-ink">Unlock Your Potential</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-ink mb-3"
        >
          Choose your plan
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-ink/60 text-sm max-w-xs mx-auto"
        >
          Upgrade your Finly experience with powerful tools to accelerate your wealth.
        </motion.p>
      </div>

      {/* Coupon Redemption */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--divider)] mb-8 flex items-center gap-3"
      >
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
      </motion.div>

      {/* Billing Toggle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center mb-10"
      >
        <div className="bg-[var(--surface)] p-1 rounded-xl border border-[var(--divider)] flex">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              billingCycle === "monthly"
                ? "bg-[var(--bg-deep)] text-ink shadow-sm border border-[var(--divider)]"
                : "text-ink/50 hover:text-ink/80"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billingCycle === "yearly"
                ? "bg-[var(--bg-deep)] text-ink shadow-sm border border-[var(--divider)]"
                : "text-ink/50 hover:text-ink/80"
            }`}
          >
            Yearly
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#6FBE9B]/20 text-[#6FBE9B]">
              SAVE 20%
            </span>
          </button>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="space-y-6">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const isPopular = plan.popular;
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`relative bg-[var(--surface)] rounded-3xl p-6 border ${
                isPopular ? "border-[#6FBE9B]/50 shadow-lg shadow-[#6FBE9B]/5" : "border-[var(--divider)]"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#6FBE9B] to-[#5aa886] rounded-full">
                  <span className="text-xs font-bold text-[var(--bg-deep)]">MOST POPULAR</span>
                </div>
              )}

              <div className="flex items-start gap-4 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${plan.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink mb-1">{plan.name}</h3>
                  <p className="text-ink/60 text-sm leading-tight">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-ink">
                    {plan.price !== "Free" 
                      ? billingCycle === "yearly" 
                        ? `₹${Math.floor(parseInt(plan.price.replace("₹", "")) * 12 * 0.8)}` 
                        : plan.price 
                      : "Free"}
                  </span>
                  <span className="text-ink/50 text-sm">
                    {plan.price !== "Free" && billingCycle === "yearly" ? "/year" : plan.period}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#6FBE9B] flex-shrink-0" />
                    <span className="text-sm text-ink/80">{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 opacity-40">
                    <div className="w-5 h-5 rounded-full border border-ink/20 flex flex-shrink-0" />
                    <span className="text-sm text-ink line-through">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={processingPlan !== null}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                  plan.buttonVariant === "solid"
                    ? plan.id === "premium"
                      ? "bg-gradient-to-r from-[#D4A24C] to-[#E2725B] text-white shadow-lg shadow-[#D4A24C]/20 hover:opacity-90"
                      : "bg-[#6FBE9B] text-[var(--bg-deep)] hover:bg-[#5aa886]"
                    : "bg-[var(--bg-deep)] text-ink border border-[var(--divider)]"
                }`}
              >
                {processingPlan === plan.id ? "Processing..." : plan.buttonText}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
