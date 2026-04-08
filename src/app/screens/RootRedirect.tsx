import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authAPI } from "../services/api";
import { localAuthService } from "../services/authLocal";

/**
 * SmartRoot — lives at path "/" and "/*" (catch-all)
 * Evaluates user state and sends them to the right screen instantly.
 *
 * Rules:
 *  1. URL param ?reset=1                          → clear flags, go to /onboarding
 *  2. Authenticated + session valid + quick auth  → /quick-login
 *  3. Authenticated (no quick auth or expired)    → /dashboard
 *  4. Onboarding already completed (localStorage) → /login
 *  5. New visitor (nothing set)                   → /onboarding
 */
export function RootRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Allow ?reset=1 to force the onboarding again (useful in preview / testing)
    if (searchParams.get("reset") === "1") {
      localStorage.removeItem("finly_onboarding_done");
      authAPI.logout();
      localAuthService.clearAll();
      navigate("/onboarding", { replace: true });
      return;
    }

    const isAuthed = authAPI.isAuthenticated();

    if (isAuthed) {
      if (
        localAuthService.isQuickAuthEnabled() &&
        localAuthService.isSessionValid()
      ) {
        navigate("/quick-login", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
      return;
    }

    const onboardingDone = localStorage.getItem("finly_onboarding_done");
    if (onboardingDone === "true") {
      navigate("/login", { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  }, [navigate, searchParams]);

  // Brief animated splash while evaluating
  return (
    <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] flex items-center justify-center shadow-2xl shadow-[#7C5CFF]/40">
            <span className="text-white font-black text-2xl">F</span>
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#7C5CFF]/30 to-[#4CC9F0]/30 blur-lg -z-10 animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          {[0, 200, 400].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF]/60"
              style={{
                animation: `dotBounce 0.9s ${delay}ms infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-7px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}