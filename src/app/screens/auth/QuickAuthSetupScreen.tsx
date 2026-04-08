import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Fingerprint,
  Shield,
  ChevronRight,
  Check,
  Delete,
  ArrowLeft,
  Zap,
  Lock,
  AlertCircle,
} from "lucide-react";
import { localAuthService } from "../../services/authLocal";
import { authAPI } from "../../services/api";

type Step = "setup" | "mpin-length" | "mpin-create" | "mpin-confirm" | "success";

function PinDots({
  length,
  filled,
  error,
  shake,
}: {
  length: number;
  filled: number;
  error?: boolean;
  shake?: boolean;
}) {
  return (
    <div
      className={`flex gap-4 justify-center py-6 transition-all ${
        shake ? "animate-shake" : ""
      }`}
    >
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
            i < filled
              ? error
                ? "bg-red-500 border-red-500 scale-110"
                : "bg-gradient-to-br from-[#7C5CFF] to-[#9D7EFF] border-[#7C5CFF] scale-110"
              : "border-white/30 bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

function Keypad({
  onPress,
  onDelete,
  disabled,
}: {
  onPress: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"],
  ];

  return (
    <div className="grid grid-cols-3 gap-3 px-8">
      {keys.flat().map((key, idx) => {
        if (key === "") {
          return <div key={idx} />;
        }
        if (key === "del") {
          return (
            <button
              key={idx}
              onClick={onDelete}
              disabled={disabled}
              className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            >
              <Delete className="w-5 h-5 text-white/60" />
            </button>
          );
        }
        return (
          <button
            key={idx}
            onClick={() => onPress(key)}
            disabled={disabled}
            className="h-16 rounded-2xl bg-white/5 border border-white/10 text-white text-xl font-medium active:scale-95 active:bg-[#7C5CFF]/20 transition-all disabled:opacity-40 hover:bg-white/10"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

export function QuickAuthSetupScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("setup");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [mpinLength, setMpinLength] = useState<4 | 6>(6);
  const [mpinDone, setMpinDone] = useState(false);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pinError, setPinError] = useState("");
  const [shake, setShake] = useState(false);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleDigit = (digit: string) => {
    if (confirming) {
      if (confirmPin.length >= mpinLength) return;
      const next = confirmPin + digit;
      setConfirmPin(next);
      if (next.length === mpinLength) {
        setTimeout(() => verifyConfirmPin(next), 100);
      }
    } else {
      if (pin.length >= mpinLength) return;
      const next = pin + digit;
      setPin(next);
      if (next.length === mpinLength) {
        setTimeout(() => moveToConfirm(), 100);
      }
    }
  };

  const handleDelete = () => {
    if (confirming) {
      setConfirmPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => p.slice(0, -1));
    }
    setPinError("");
  };

  const moveToConfirm = () => {
    setStep("mpin-confirm");
    setConfirming(true);
    setConfirmPin("");
    setPinError("");
  };

  const verifyConfirmPin = async (entered: string) => {
    if (entered === pin) {
      await localAuthService.setupMPIN(entered);
      setMpinDone(true);
      setStep("setup");
      setConfirming(false);
      setPin("");
      setConfirmPin("");
      setPinError("");
    } else {
      setPinError("PINs don't match. Try again.");
      triggerShake();
      setTimeout(() => {
        setConfirmPin("");
        setPinError("");
      }, 900);
    }
  };

  const handleBiometricToggle = () => {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    localAuthService.setBiometricEnabled(next);
  };

  const handleContinue = () => {
    localAuthService.updateLastActivity();
    const user = authAPI.getCurrentUser();
    if (user?.email) localAuthService.saveSessionEmail(user.email);
    setStep("success");
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  const backToSetup = () => {
    setStep("setup");
    setPin("");
    setConfirmPin("");
    setConfirming(false);
    setPinError("");
  };

  const currentFilled = confirming ? confirmPin.length : pin.length;

  return (
    <div
      className={`flex flex-col min-h-screen bg-[#0D0F14] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* ── Setup Screen ────────────────────────────────────── */}
      {step === "setup" && (
        <div className="flex flex-col min-h-screen px-6">
          {/* Header */}
          <div className="pt-16 pb-8">
            <div className="relative w-20 h-20 mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] flex items-center justify-center shadow-2xl shadow-[#7C5CFF]/40">
                <Shield className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#7C5CFF]/30 to-[#4CC9F0]/30 blur-md -z-10" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Secure your account
            </h1>
            <p className="text-white/50 leading-relaxed">
              Set up quick and secure access so you can log in instantly
            </p>
          </div>

          <div className="flex-1 space-y-4">
            {/* Biometric Card */}
            <button
              onClick={handleBiometricToggle}
              className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 ${
                biometricEnabled
                  ? "bg-[#7C5CFF]/10 border-[#7C5CFF]/50 shadow-lg shadow-[#7C5CFF]/10"
                  : "bg-[#1B2130] border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                    biometricEnabled
                      ? "bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] shadow-lg shadow-[#7C5CFF]/30"
                      : "bg-white/5"
                  }`}
                >
                  <Fingerprint
                    className={`w-7 h-7 ${
                      biometricEnabled ? "text-white" : "text-white/40"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold">
                      Biometric Authentication
                    </p>
                    {/* Toggle */}
                    <div
                      className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                        biometricEnabled ? "bg-[#7C5CFF]" : "bg-white/20"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                          biometricEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-white/50 text-sm mt-0.5">
                    Fingerprint or Face ID
                  </p>
                </div>
              </div>
              {biometricEnabled && (
                <div className="mt-3 flex items-center gap-2 text-[#7C5CFF] text-sm">
                  <Check className="w-4 h-4" />
                  <span>Biometric enabled</span>
                </div>
              )}
            </button>

            {/* MPIN Card */}
            <button
              onClick={() => setStep("mpin-length")}
              className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 ${
                mpinDone
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                  : "bg-[#1B2130] border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                    mpinDone
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30"
                      : "bg-white/5"
                  }`}
                >
                  {mpinDone ? (
                    <Check className="w-7 h-7 text-white" />
                  ) : (
                    <Lock className="w-7 h-7 text-white/40" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold">MPIN Protection</p>
                    {mpinDone ? (
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                        {mpinLength}-digit PIN set
                      </span>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                  <p className="text-white/50 text-sm mt-0.5">
                    {mpinDone
                      ? "Tap to change your PIN"
                      : `Set a ${mpinLength}-digit secure PIN`}
                  </p>
                </div>
              </div>
            </button>

            {/* Security badge */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFF]/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-[#7C5CFF]" />
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                Your PIN is stored locally as a SHA-256 hash and never
                transmitted to our servers.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="py-6 space-y-3">
            {(biometricEnabled || mpinDone) ? (
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30 active:scale-[0.98] transition-transform"
              >
                Continue to Finly →
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30 active:scale-[0.98] transition-transform"
              >
                Set Up Later
              </button>
            )}
            <button
              onClick={handleSkip}
              className="w-full py-3 text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* ── MPIN Length Picker ───────────────────────────────── */}
      {step === "mpin-length" && (
        <div className="flex flex-col min-h-screen px-6">
          <div className="pt-14 pb-8 flex items-center gap-4">
            <button
              onClick={backToSetup}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Choose PIN length</h1>
              <p className="text-white/40 text-sm">Select your preferred security level</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {(
              [
                {
                  len: 4 as const,
                  label: "4-Digit PIN",
                  desc: "Fast and convenient access",
                  badge: "Recommended",
                },
                {
                  len: 6 as const,
                  label: "6-Digit PIN",
                  desc: "Higher security, more combinations",
                  badge: "More secure",
                },
              ] as const
            ).map(({ len, label, desc, badge }) => (
              <button
                key={len}
                onClick={() => {
                  setMpinLength(len);
                  setPin("");
                  setConfirmPin("");
                  setStep("mpin-create");
                  setConfirming(false);
                }}
                className={`w-full p-5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  mpinLength === len
                    ? "bg-[#7C5CFF]/10 border-[#7C5CFF]/50"
                    : "bg-[#1B2130] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{label}</p>
                    <p className="text-white/50 text-sm mt-0.5">{desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-[#7C5CFF] bg-[#7C5CFF]/10 px-2 py-1 rounded-full">
                      {badge}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: len }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-2.5 rounded-full bg-[#7C5CFF]/40 border border-[#7C5CFF]/60"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MPIN Create / Confirm ────────────────────────────── */}
      {(step === "mpin-create" || step === "mpin-confirm") && (
        <div className="flex flex-col min-h-screen">
          {/* Top bar */}
          <div className="px-6 pt-14 pb-6 flex items-center gap-4">
            <button
              onClick={step === "mpin-create" ? backToSetup : () => {
                setStep("mpin-create");
                setConfirming(false);
                setConfirmPin("");
                setPinError("");
              }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Icon */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7C5CFF] to-[#9D7EFF] flex items-center justify-center shadow-2xl shadow-[#7C5CFF]/40">
                <Lock className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-[#7C5CFF]/20 blur-lg -z-10" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-1">
              {step === "mpin-create"
                ? `Create your ${mpinLength}-digit PIN`
                : "Confirm your PIN"}
            </h2>
            <p className="text-white/50 text-sm text-center">
              {step === "mpin-create"
                ? "Choose a PIN you'll remember"
                : "Re-enter your PIN to confirm"}
            </p>

            {/* Pin dots */}
            <PinDots
              length={mpinLength}
              filled={currentFilled}
              error={!!pinError}
              shake={shake}
            />

            {/* Error */}
            {pinError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{pinError}</p>
              </div>
            )}

            {/* Progress indicator */}
            <div className="flex gap-1 mb-6">
              {["Create", "Confirm"].map((label, i) => {
                const active =
                  (i === 0 && step === "mpin-create") ||
                  (i === 1 && step === "mpin-confirm");
                const done =
                  i === 0 && step === "mpin-confirm";
                return (
                  <div key={label} className="flex items-center gap-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        done
                          ? "w-12 bg-[#7C5CFF]"
                          : active
                          ? "w-12 bg-[#7C5CFF]"
                          : "w-12 bg-white/10"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keypad */}
          <div className="pb-10">
            <Keypad onPress={handleDigit} onDelete={handleDelete} />
          </div>
        </div>
      )}

      {/* ── Success Screen ──────────────────────────────────── */}
      {step === "success" && (
        <div className="flex flex-col min-h-screen px-6 items-center justify-center text-center">
          {/* Animated success ring */}
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] flex items-center justify-center shadow-2xl shadow-[#7C5CFF]/40 animate-pulse-slow">
              <Check className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-full bg-[#7C5CFF]/20 blur-xl scale-125" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            You're all set!
          </h1>
          <p className="text-white/50 mb-10 max-w-xs leading-relaxed">
            Your account is secured. Quick access is ready for your next login.
          </p>

          {/* What's enabled */}
          <div className="w-full space-y-3 mb-10">
            {biometricEnabled && (
              <div className="flex items-center gap-4 bg-[#1B2130] border border-white/10 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] flex items-center justify-center flex-shrink-0">
                  <Fingerprint className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Biometric Login</p>
                  <p className="text-white/40 text-sm">Fingerprint / Face ID enabled</p>
                </div>
                <Check className="w-5 h-5 text-emerald-400 ml-auto" />
              </div>
            )}

            {mpinDone && (
              <div className="flex items-center gap-4 bg-[#1B2130] border border-white/10 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">MPIN Protection</p>
                  <p className="text-white/40 text-sm">{mpinLength}-digit PIN configured</p>
                </div>
                <Check className="w-5 h-5 text-emerald-400 ml-auto" />
              </div>
            )}

            {!biometricEnabled && !mpinDone && (
              <div className="flex items-center gap-4 bg-[#1B2130] border border-white/10 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white/40" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Standard Login</p>
                  <p className="text-white/40 text-sm">Password authentication</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30 active:scale-[0.98] transition-transform"
          >
            Open Finly →
          </button>
        </div>
      )}

      {/* CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        
        @keyframes pulse-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,92,255,0.4); }
          50% { box-shadow: 0 0 0 20px rgba(124,92,255,0); }
        }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
