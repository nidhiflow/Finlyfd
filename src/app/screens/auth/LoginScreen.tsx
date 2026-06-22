import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { authAPI } from "../../services/api";
import { localAuthService } from "../../services/authLocal";
import { toast } from "sonner";

export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    // If quick auth is set up AND session is still valid → go directly to quick login
    if (localAuthService.isQuickAuthEnabled()) {
      if (localAuthService.isSessionValid()) {
        navigate("/quick-login", { replace: true });
        return;
      }
      // Session expired but quick auth exists → show login with notice
      setSessionExpiredNotice(true);
    }
  }, [navigate]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      
      if (response.requireOTP) {
        // Backend requires OTP
        setShowOTP(true);
      } else if (response.token && response.user) {
        // Successful login — save session data
        localAuthService.saveSessionEmail(email);
        localAuthService.updateLastActivity();

        // If quick auth is already configured, go to quick-login (it will redirect to dashboard)
        if (localAuthService.isQuickAuthEnabled()) {
          navigate("/quick-login");
        } else {
          // First time login after long gap — offer quick auth setup
          navigate("/quick-auth-setup");
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authAPI.verifyLoginOTP({ email, otp: otpCode });
      localAuthService.saveSessionEmail(email);
      localAuthService.updateLastActivity();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setLoading(true);

    try {
      await authAPI.login({ email, password });
    } catch (err: any) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6">
      {/* Logo & Header */}
      <div className="pt-16 pb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A24C] to-[#D4A24C] flex items-center justify-center mb-6 shadow-lg shadow-[#D4A24C]/50">
          <span className="text-2xl font-bold text-ink">F</span>
        </div>
        <h1 className="text-3xl font-bold text-ink mb-2">Welcome back</h1>
        <p className="text-ink/50">Sign in to continue to Finly</p>
      </div>

      {!showOTP ? (
        <>
          {/* Session expired notice */}
          {sessionExpiredNotice && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 mb-4">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 text-sm font-medium">Session Expired</p>
                <p className="text-amber-400/70 text-xs mt-0.5">
                  You've been inactive for over 24 hours. Please sign in again for security.
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-4 flex-1">
            {/* Demo credentials info */}
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4">
              <p className="text-blue-400 text-sm font-medium mb-1">Demo Credentials</p>
              <p className="text-blue-400/70 text-xs">
                Email: demo@finly.app<br />
                Password: demo123
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-ink/70 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#1B2130] border border-ink/10 rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-ink/70 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-[#1B2130] border border-ink/10 rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-ink/40" />
                  ) : (
                    <Eye className="w-5 h-5 text-ink/40" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-[#D4A24C] hover:text-[#D4A24C]"
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#D4A24C] to-[#D4A24C] rounded-xl text-ink font-semibold shadow-lg shadow-[#D4A24C]/30 hover:shadow-[#D4A24C]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {/* Quick login shortcut (if setup done but session expired) */}
            {sessionExpiredNotice && (
              <button
                onClick={() => navigate("/quick-login?expired=true")}
                className="w-full py-3.5 bg-[#D4A24C]/10 border border-[#D4A24C]/30 rounded-xl text-[#D4A24C] text-sm font-medium hover:border-[#D4A24C]/50 transition-all"
              >
                Use PIN / Biometric instead
              </button>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#0D0F14] text-sm text-ink/50">or</span>
              </div>
            </div>

            <button
              onClick={() => toast.info("Google Sign-In coming soon! Please use email & password to sign in.")}
              className="w-full py-4 bg-[#1B2130] border border-ink/10 rounded-xl text-ink font-semibold hover:border-ink/20 transition-colors flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="py-6 text-center">
            <span className="text-ink/50">Don't have an account? </span>
            <button
              onClick={() => navigate("/signup")}
              className="text-[#D4A24C] font-semibold hover:text-[#D4A24C]"
            >
              Sign Up
            </button>
          </div>
        </>
      ) : (
        <>
          {/* OTP Verification */}
          <div className="flex-1">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-[#1B2130] border border-ink/10 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-ink mb-2">Verify OTP</h2>
              <p className="text-sm text-ink/50 mb-2">
                We've sent a code to {email}
              </p>
              <p className="text-xs text-blue-400/70 mb-6">
                Demo: Use any 6-digit code (e.g., 123456)
              </p>

              <div className="flex gap-2 justify-center mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 1 && /^\d*$/.test(value)) {
                        const newOtp = [...otp];
                        newOtp[index] = value;
                        setOtp(newOtp);
                        if (value && index < 5) {
                          document.getElementById(`otp-${index + 1}`)?.focus();
                        }
                      }
                    }}
                    className="w-12 h-14 bg-[#0D0F14] border border-ink/10 rounded-xl text-ink text-center text-xl font-semibold focus:border-[#D4A24C] focus:outline-none"
                  />
                ))}
              </div>

              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-sm text-[#D4A24C] hover:text-[#D4A24C] mb-4 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Resend Code"}
              </button>

              <button
                onClick={handleOTPVerify}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#D4A24C] to-[#D4A24C] rounded-xl text-ink font-semibold shadow-lg shadow-[#D4A24C]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>

            <button
              onClick={() => setShowOTP(false)}
              className="w-full py-4 bg-[#1B2130] border border-ink/10 rounded-xl text-ink font-semibold"
            >
              Back to Login
            </button>
          </div>
        </>
      )}
    </div>
  );
}
