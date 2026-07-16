import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Check, AlertCircle, Sparkles, Star, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "../services/api";
import { startRazorpayCheckout } from "../services/razorpay";

interface PremiumFeatureGateProps {
  children: React.ReactNode;
  featureName: string;
  benefits: string[];
  requiredTier?: "Basic" | "Premium";
  onUnlock?: () => void;
}

export function PremiumFeatureGate({
  children,
  featureName,
  benefits,
  requiredTier = "Premium",
  onUnlock,
}: PremiumFeatureGateProps) {
  const [currentUser, setCurrentUser] = useState(() => authAPI.getCurrentUser());
  const [step, setStep] = useState<"benefits" | "payment" | "success">("benefits");
  
  // Billing cycle
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<"Basic" | "Premium">("Premium");
  const [couponCode, setCouponCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user is unlocked
  const tierLevels: Record<string, number> = {
    "free": 0,
    "basic": 0,
    "pro": 2,
    "premium": 2,
  };

  const userTier = (currentUser?.subscription_tier || "Free").toLowerCase();
  const userLevel = tierLevels[userTier] || 0;
  const requiredLevel = tierLevels[requiredTier.toLowerCase()] || 2;
  const isUnlocked = userLevel >= requiredLevel || currentUser?.email?.toLowerCase() === "nidhiflow.in@gmail.com";

  if (isUnlocked) {
    return <>{children}</>;
  }

  // Prices
  const basePrices = {
    Basic: 0,
    Premium: billingCycle === "monthly" ? 99 : 999, // 99/mo or 999/yr
  };

  const currentPrice = basePrices[selectedPlan];
  const finalPrice = discountApplied ? Math.floor(currentPrice * 0.5) : currentPrice;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "FINLY50") {
      setDiscountApplied(true);
      toast.success("Coupon code 'FINLY50' applied successfully! 50% discount applied.");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    await startRazorpayCheckout({
      plan: selectedPlan,
      amountInRupees: finalPrice,
      description: `Upgrade to ${selectedPlan} Subscription (${billingCycle})`,
      themeColor: selectedPlan === "Premium" ? "#D4A24C" : "#6FBE9B",
      prefill: {
        name: currentUser?.name || "Finly User",
        email: currentUser?.email || "user@example.com",
        contact: currentUser?.phone || "",
      },
      onSuccess: (user) => {
        toast.success(`Success! Welcome to Finly ${selectedPlan}!`);
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          setCurrentUser(user);
        }
        setStep("success");
        if (onUnlock) onUnlock();
        // Reload page to reflect subscription unlock everywhere after a brief pause
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      },
      onError: (message) => {
        toast.error(message);
        setIsProcessing(false);
      },
      onDismiss: () => {
        toast.info("Payment cancelled.");
        setIsProcessing(false);
      },
    });
  };

  return (
    <div className="relative w-full h-full min-h-[70vh] flex flex-col justify-center items-center overflow-hidden">
      {/* Blurred background view of premium feature content */}
      <div className="absolute inset-0 filter blur-[10px] scale-[1.02] select-none pointer-events-none opacity-20 z-0 w-full h-full">
        {children}
      </div>

      {/* Glassmorphic Overlay Layer */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px] z-10 w-full h-full" />

      {/* Main Premium Card Content */}
      <div className="relative z-20 max-w-sm w-full mx-auto px-5 py-4">
        <AnimatePresence mode="wait">
          {step === "benefits" && (
            <motion.div
              key="benefits"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="bg-[var(--surface)] border border-[#D4A24C]/35 rounded-3xl p-6 shadow-2xl shadow-black/40 relative overflow-hidden"
            >
              {/* Gold/Bronze decorative background glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D4A24C]/15 rounded-full filter blur-xl" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4A24C] to-[#E2725B] flex items-center justify-center mb-4 shadow-lg shadow-[#D4A24C]/25">
                  <Crown className="w-7 h-7 text-[#241B0A]" />
                </div>
                
                <span className="text-[10px] font-bold tracking-widest text-[#D4A24C] uppercase mb-1">
                  Premium Feature
                </span>
                
                <h3 className="text-xl font-bold text-ink mb-2">
                  Unlock {featureName}
                </h3>
                
                <p className="text-xs text-ink/60 mb-5 max-w-[260px] leading-relaxed">
                  Upgrade your subscription to access this feature and supercharge your financial freedom.
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-3 mb-6 bg-[var(--bg-deep)]/50 p-4 rounded-2xl border border-[var(--divider)]">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#D4A24C]/10 border border-[#D4A24C]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[#D4A24C]" />
                    </div>
                    <span className="text-xs text-ink/80 leading-normal">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setStep("payment")}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4A24C] to-[#E2725B] rounded-xl text-white font-bold text-sm shadow-lg shadow-[#D4A24C]/25 active:scale-98 hover:brightness-105 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-black animate-spin-slow" />
                  <span>Unlock Benefits Now</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="bg-[var(--surface)] border border-[var(--divider)] rounded-3xl p-6 shadow-2xl shadow-black/40"
            >
              {/* Back Button */}
              <button
                onClick={() => setStep("benefits")}
                className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to benefits</span>
              </button>

              <h3 className="text-lg font-bold text-ink mb-1">
                Choose Subscription Plan
              </h3>
              <p className="text-xs text-ink/50 mb-4 leading-snug">
                Select your preferred upgrade to activate {featureName}.
              </p>

              {/* Billing toggle */}
              <div className="flex bg-[var(--bg-deep)] p-1 rounded-xl border border-[var(--divider)] mb-4 justify-center">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-[var(--surface)] text-ink shadow-sm border border-[var(--divider)]"
                      : "text-ink/50 hover:text-ink/80"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    billingCycle === "yearly"
                      ? "bg-[var(--surface)] text-ink shadow-sm border border-[var(--divider)]"
                      : "text-ink/50 hover:text-ink/80"
                  }`}
                >
                  Yearly
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#6FBE9B]/15 text-[#6FBE9B]">
                    -20%
                  </span>
                </button>
              </div>

              {/* Plans selector list */}
              <div className="space-y-2.5 mb-4">
                {/* Basic Tier Option */}
                <div
                  className="w-full text-left p-3.5 rounded-2xl border border-[var(--divider)] opacity-60 flex justify-between items-center bg-[var(--surface-raised)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center">
                      <Star className="w-4 h-4 text-ink/40" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-ink">Finly Basic</div>
                      <div className="text-[10px] text-ink/50">Current Plan</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs text-ink">Free</div>
                  </div>
                </div>

                {/* Premium Tier Option */}
                <button
                  onClick={() => setSelectedPlan("Premium")}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex justify-between items-center relative overflow-hidden ${
                    selectedPlan === "Premium"
                      ? "border-[#D4A24C] bg-[#D4A24C]/5 shadow-md shadow-[#D4A24C]/5"
                      : "border-[var(--divider)] hover:border-ink/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D4A24C]/10 flex items-center justify-center">
                      <Crown className={`w-4 h-4 ${selectedPlan === "Premium" ? "text-[#D4A24C]" : "text-ink/40"}`} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-ink">Finly Premium</div>
                      <div className="text-[10px] text-ink/50">Full AI Agent & advisor tools</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs text-ink">
                      {billingCycle === "monthly" ? "₹99" : "₹999"}
                    </div>
                    <div className="text-[9px] text-ink/40">
                      {billingCycle === "monthly" ? "/month" : "/year"}
                    </div>
                  </div>
                  <div className="absolute top-0 right-3 px-1.5 py-0.5 bg-[#D4A24C] text-[8px] font-bold text-black rounded-b-md">
                    Ultimate
                  </div>
                </button>
              </div>

              {/* Coupon Slot */}
              <div className="space-y-1.5 mb-4">
                <label className="block text-[10px] font-semibold text-ink/50 uppercase px-1">Discount Coupon</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. FINLY50)"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    disabled={discountApplied}
                    className="flex-1 px-3 py-2 bg-[var(--bg-deep)] border border-[var(--divider)] rounded-xl text-xs text-ink uppercase placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={discountApplied || !couponCode.trim()}
                    className="px-3.5 py-2 bg-[var(--bg-deep)] border border-[var(--divider)] text-ink text-xs font-semibold rounded-xl hover:bg-ink/5 disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>
                {discountApplied && (
                  <p className="text-[10px] text-[#6FBE9B] font-medium px-1 flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Promo FINLY50 Applied (50% Off Total)</span>
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-[var(--bg-deep)]/40 p-3.5 rounded-2xl border border-[var(--divider)] mb-5 space-y-1.5">
                <div className="flex justify-between text-xs text-ink/60">
                  <span>Subtotal:</span>
                  <span>₹{currentPrice.toLocaleString()}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-xs text-[#6FBE9B]">
                    <span>Coupon Discount (50%):</span>
                    <span>-₹{(currentPrice - finalPrice).toLocaleString()}</span>
                  </div>
                )}
                <div className="h-px bg-[var(--divider)] my-1" />
                <div className="flex justify-between text-sm font-bold text-ink">
                  <span>Total Amount:</span>
                  <span className="text-[#D4A24C]">₹{finalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Proceed */}
              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#4285F4] text-white font-bold text-sm rounded-xl active:scale-98 hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-white" />
                    <span>Proceed to Pay (Razorpay)</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--surface)] border border-green-500/30 rounded-3xl p-6 text-center shadow-2xl shadow-black/40"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#6FBE9B]" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Upgrade Confirmed!</h3>
              <p className="text-xs text-ink/60 mb-4 max-w-[260px] mx-auto leading-relaxed">
                Thank you for upgrading! You are now subscribed to Finly {selectedPlan} and features are fully unlocked.
              </p>
              <p className="text-[10px] text-ink/30 italic">Unlocking feature and reloading...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
