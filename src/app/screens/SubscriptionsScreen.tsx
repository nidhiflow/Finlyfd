import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Crown, Shield, Star, Tag, Zap } from "lucide-react";
import { toast } from "sonner";
import { authAPI, couponsAPI } from "../services/api";
import { startRazorpayCheckout } from "../services/razorpay";
const plans = [
  {
    id: "basic",
    name: "Finly Basic",
    icon: Shield,
    description: "Perfect for getting started with personal finance.",
    features: [
      "Track up to 2 accounts",
      "Basic budgeting",
      "Monthly reports",
      "Manual transaction entry",
    ],
    notIncluded: ["AI Insights", "Custom categories", "Recurring Transactions"],
    color: "var(--ink-muted)",
  },
  {
    id: "premium",
    name: "Finly Premium",
    icon: Crown,
    description: "The ultimate financial operating system.",
    features: [
      "Everything in Basic",
      "Unlimited accounts & categories",
      "Recurring Transactions",
      "Advanced AI Agent & Insights",
      "Priority 24/7 Support",
      "Early access to new features",
    ],
    notIncluded: [],
    color: "#D4A24C", // Gold
    popular: true,
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

    const tier = "Premium";
    const amountInRupees = billingCycle === "yearly" ? 999 : 99;
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
          const user = authAPI.getCurrentUser();
          const userTier = (user?.subscription_tier || "Free").toLowerCase();
          const isAdmin = user?.email?.toLowerCase() === "nidhiflow.in@gmail.com";
          
          let buttonText = "";
          let buttonVariant = "solid";
          let isCurrentPlan = false;

          if (plan.id === "basic") {
            if (userTier === "free" || userTier === "basic") {
              buttonText = "Current Plan";
              buttonVariant = "outline";
              isCurrentPlan = true;
            } else {
              buttonText = "Basic Plan";
              buttonVariant = "outline";
              isCurrentPlan = true;
            }
          } else if (plan.id === "premium") {
            if (userTier === "premium" || userTier === "pro" || isAdmin) {
              buttonText = "Current Plan (Premium)";
              buttonVariant = "outline";
              isCurrentPlan = true;
            } else {
              buttonText = "Upgrade to Premium";
              buttonVariant = "solid";
            }
          }
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`relative bg-[var(--surface)] rounded-3xl p-6 border ${
                isPopular ? "border-[#D4A24C]/50 shadow-lg shadow-[#D4A24C]/5" : "border-[var(--divider)]"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#D4A24C] to-[#E2725B] rounded-full">
                  <span className="text-xs font-bold text-white">RECOMMENDED</span>
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
                    {plan.id === "premium"
                      ? billingCycle === "yearly"
                        ? "₹999"
                        : "₹99"
                      : "Free"}
                  </span>
                  <span className="text-ink/50 text-sm">
                    {plan.id === "premium"
                      ? billingCycle === "yearly"
                        ? "/year"
                        : "/month"
                      : "forever"}
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
                disabled={processingPlan !== null || isCurrentPlan}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${
                  buttonVariant === "solid"
                    ? "bg-gradient-to-r from-[#D4A24C] to-[#E2725B] text-white shadow-lg shadow-[#D4A24C]/20 hover:opacity-90 active:scale-98"
                    : "bg-[var(--bg-deep)] text-ink border border-[var(--divider)] cursor-default"
                }`}
              >
                {processingPlan === plan.id ? "Processing..." : buttonText}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
