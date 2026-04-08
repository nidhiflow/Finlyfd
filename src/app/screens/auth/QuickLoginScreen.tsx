import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Fingerprint,
  Delete,
  AlertCircle,
  ChevronDown,
  ShieldAlert,
  Lock,
  Check,
} from "lucide-react";
import { localAuthService } from "../../services/authLocal";
import { authAPI } from "../../services/api";

type AuthState =
  | "idle"
  | "scanning"
  | "biometric-success"
  | "mpin-success"
  | "error";

function PinDots({
  length,
  filled,
  error,
  success,
  shake,
}: {
  length: number;
  filled: number;
  error?: boolean;
  success?: boolean;
  shake?: boolean;
}) {
  return (
    <div
      className={`flex gap-5 justify-center py-5 ${shake ? "animate-shake" : ""}`}
    >
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
            i < filled
              ? success
                ? "bg-emerald-400 border-emerald-400 scale-125"
                : error
                ? "bg-red-500 border-red-500 scale-110"
                : "bg-gradient-to-br from-[#7C5CFF] to-[#9D7EFF] border-[#7C5CFF] scale-110"
              : "border-white/25 bg-transparent"
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
    <div className="grid grid-cols-3 gap-3 px-6">
      {keys.flat().map((key, idx) => {
        if (key === "") return <div key={idx} />;
        if (key === "del") {
          return (
            <button
              key={idx}
              onClick={onDelete}
              disabled={disabled}
              className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 active:bg-white/10 transition-all disabled:opacity-30"
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
            className="h-16 rounded-2xl bg-white/5 border border-white/10 text-white text-xl font-medium active:scale-95 active:bg-[#7C5CFF]/30 transition-all disabled:opacity-30 hover:bg-white/10"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

function BiometricButton({
  onPress,
  scanning,
  success,
}: {
  onPress: () => void;
  scanning: boolean;
  success: boolean;
}) {
  return (
    <button
      onClick={onPress}
      disabled={scanning}
      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
        success
          ? "bg-emerald-500/20 border-2 border-emerald-400"
          : scanning
          ? "bg-[#7C5CFF]/20 border-2 border-[#7C5CFF]"
          : "bg-white/5 border-2 border-white/20 hover:border-[#7C5CFF]/50 hover:bg-[#7C5CFF]/10 active:scale-95"
      }`}
    >
      {/* Pulse rings when scanning */}
      {scanning && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-[#7C5CFF]/50 animate-ping-slow" />
          <div className="absolute -inset-3 rounded-full border border-[#7C5CFF]/25 animate-ping-slower" />
        </>
      )}

      {success ? (
        <Check className="w-8 h-8 text-emerald-400" />
      ) : (
        <Fingerprint
          className={`w-8 h-8 transition-colors ${
            scanning ? "text-[#7C5CFF]" : "text-white/50"
          }`}
        />
      )}
    </button>
  );
}

export function QuickLoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "true";

  const [pin, setPin] = useState("");
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [visible, setVisible] = useState(false);

  const mpinLength = localAuthService.getMPINLength();
  const biometricEnabled = localAuthService.isBiometricEnabled();
  const user = authAPI.getCurrentUser();
  const userName = user?.name?.split(" ")[0] ?? "there";
  const sessionEmail = localAuthService.getSessionEmail() || user?.email || "";

  useEffect(() => {
    // Redirect if quick auth not set up
    if (!localAuthService.isQuickAuthEnabled()) {
      navigate("/login", { replace: true });
      return;
    }
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [navigate]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSuccess = useCallback(() => {
    localAuthService.updateLastActivity();
    setAuthState("mpin-success");
    setTimeout(() => navigate("/dashboard"), 600);
  }, [navigate]);

  const handleBiometricSuccess = useCallback(() => {
    localAuthService.updateLastActivity();
    setAuthState("biometric-success");
    setTimeout(() => navigate("/dashboard"), 700);
  }, [navigate]);

  const handleDigit = useCallback(
    async (digit: string) => {
      if (authState !== "idle" && authState !== "error") return;
      if (pin.length >= mpinLength) return;

      setError("");
      setAuthState("idle");
      const next = pin + digit;
      setPin(next);

      if (next.length === mpinLength) {
        // Auto-verify
        setTimeout(async () => {
          const valid = await localAuthService.verifyMPIN(next);
          if (valid) {
            handleSuccess();
          } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setAuthState("error");
            triggerShake();
            setError(
              newAttempts >= 3
                ? "Too many attempts. Use password instead."
                : "Incorrect PIN. Try again."
            );
            setTimeout(() => {
              setPin("");
              setAuthState("idle");
            }, 900);
          }
        }, 80);
      }
    },
    [pin, mpinLength, attempts, authState, handleSuccess]
  );

  const handleDelete = useCallback(() => {
    if (authState === "scanning" || authState === "mpin-success" || authState === "biometric-success") return;
    setPin((p) => p.slice(0, -1));
    setError("");
    setAuthState("idle");
  }, [authState]);

  const handleBiometric = useCallback(async () => {
    if (authState !== "idle" && authState !== "error") return;
    setAuthState("scanning");
    setError("");
    setPin("");

    try {
      const success = await localAuthService.authenticateWithBiometric();
      if (success) {
        handleBiometricSuccess();
      } else {
        setAuthState("error");
        setError("Biometric authentication failed. Try your PIN.");
        triggerShake();
        setTimeout(() => setAuthState("idle"), 1000);
      }
    } catch {
      setAuthState("error");
      setError("Biometric not available. Use your PIN instead.");
      setTimeout(() => setAuthState("idle"), 1000);
    }
  }, [authState, handleBiometricSuccess]);

  const scanning = authState === "scanning";
  const biometricSuccess = authState === "biometric-success";
  const pinSuccess = authState === "mpin-success";
  const hasError = authState === "error";

  const maskedEmail = sessionEmail
    ? sessionEmail.replace(/(.{2}).*(@.*)/, "$1•••$2")
    : "";

  return (
    <div
      className={`flex flex-col min-h-screen bg-[#0D0F14] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {/* ── Background accent ──────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#7C5CFF]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#4CC9F0]/5 rounded-full blur-3xl" />
      </div>

      {/* ── Session expired banner ──────────────────────── */}
      {sessionExpired && (
        <div className="mx-6 mt-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 text-sm font-medium">Session Expired</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              You've been inactive for over 24 hours. Verify your identity to
              continue.
            </p>
          </div>
        </div>
      )}

      {/* ── User avatar & greeting ──────────────────────── */}
      <div className="flex flex-col items-center pt-16 pb-4 px-6">
        {/* Avatar */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] flex items-center justify-center shadow-xl shadow-[#7C5CFF]/30">
            <span className="text-3xl font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Secure badge */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0D0F14] border border-[#7C5CFF]/40 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-[#7C5CFF]" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white">
          Welcome back, {userName}
        </h2>
        {maskedEmail && (
          <p className="text-white/40 text-sm mt-1">{maskedEmail}</p>
        )}

        {/* Session status */}
        {!sessionExpired && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-emerald-400/80 text-xs">
              Session active · {localAuthService.getTimeSinceLastActivity()}
            </p>
          </div>
        )}
      </div>

      {/* ── PIN area ────────────────────────────────────── */}
      <div className="flex flex-col items-center px-6 flex-1">
        <p className="text-white/50 text-sm mb-1">
          Enter your {mpinLength}-digit PIN
        </p>

        <PinDots
          length={mpinLength}
          filled={scanning ? 0 : pin.length}
          error={hasError}
          success={pinSuccess}
          shake={shake}
        />

        {/* Error / Success message */}
        {error && !scanning && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-3 w-full max-w-xs">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {scanning && (
          <div className="flex items-center gap-2 bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 rounded-xl px-4 py-2.5 mb-3 w-full max-w-xs">
            <div className="w-4 h-4 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-[#7C5CFF] text-sm">Verifying biometrics…</p>
          </div>
        )}

        {(pinSuccess || biometricSuccess) && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 mb-3 w-full max-w-xs">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-400 text-sm">Authenticated! Redirecting…</p>
          </div>
        )}
      </div>

      {/* ── Keypad ──────────────────────────────────────── */}
      <div className="pb-4">
        <Keypad
          onPress={handleDigit}
          onDelete={handleDelete}
          disabled={scanning || pinSuccess || biometricSuccess}
        />
      </div>

      {/* ── Biometric button ─────────────────────────────── */}
      {biometricEnabled && (
        <div className="flex flex-col items-center pb-5">
          <BiometricButton
            onPress={handleBiometric}
            scanning={scanning}
            success={biometricSuccess}
          />
          <p className="text-white/40 text-xs mt-2.5">
            {scanning ? "Scanning…" : "Use biometrics"}
          </p>
        </div>
      )}

      {/* ── Bottom actions ───────────────────────────────── */}
      <div className="px-6 pb-8 space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/8" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-[#0D0F14] text-xs text-white/30">
              or
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm hover:border-white/20 hover:text-white/80 transition-all"
        >
          Use Password Instead
          <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
        </button>

        <p className="text-center text-xs text-white/25">
          Not you?{" "}
          <button
            onClick={() => {
              authAPI.logout();
              localAuthService.clearAll();
              navigate("/login");
            }}
            className="text-[#7C5CFF]/70 hover:text-[#7C5CFF]"
          >
            Switch account
          </button>
        </p>
      </div>

      {/* Animation styles */}
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
        .animate-shake { animation: shake 0.6s ease-in-out; }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 1.2s ease-out infinite;
        }

        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .animate-ping-slower {
          animation: ping-slower 1.6s ease-out infinite 0.3s;
        }
      `}</style>
    </div>
  );
}
