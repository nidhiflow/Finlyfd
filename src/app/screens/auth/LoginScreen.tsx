import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { authAPI } from "../../services/api";
import { localAuthService } from "../../services/authLocal";

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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] flex items-center justify-center mb-6 shadow-lg shadow-[#7C5CFF]/50">
          <span className="text-2xl font-bold text-white">F</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-white/50">Sign in to continue to Finly</p>
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
              <label className="text-sm text-white/70 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#1B2130] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#7C5CFF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-white/70 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-[#1B2130] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#7C5CFF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-white/40" />
                  ) : (
                    <Eye className="w-5 h-5 text-white/40" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-[#7C5CFF] hover:text-[#9D7EFF]"
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30 hover:shadow-[#7C5CFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {/* Quick login shortcut (if setup done but session expired) */}
            {sessionExpiredNotice && (
              <button
                onClick={() => navigate("/quick-login?expired=true")}
                className="w-full py-3.5 bg-[#7C5CFF]/10 border border-[#7C5CFF]/30 rounded-xl text-[#7C5CFF] text-sm font-medium hover:border-[#7C5CFF]/50 transition-all"
              >
                Use PIN / Biometric instead
              </button>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#0D0F14] text-sm text-white/50">or</span>
              </div>
            </div>

            <button className="w-full py-4 bg-[#1B2130] border border-white/10 rounded-xl text-white font-semibold hover:border-white/20 transition-colors">
              Continue with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="py-6 text-center">
            <span className="text-white/50">Don't have an account? </span>
            <button
              onClick={() => navigate("/signup")}
              className="text-[#7C5CFF] font-semibold hover:text-[#9D7EFF]"
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

            <div className="bg-[#1B2130] border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Verify OTP</h2>
              <p className="text-sm text-white/50 mb-2">
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
                    className="w-12 h-14 bg-[#0D0F14] border border-white/10 rounded-xl text-white text-center text-xl font-semibold focus:border-[#7C5CFF] focus:outline-none"
                  />
                ))}
              </div>

              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-sm text-[#7C5CFF] hover:text-[#9D7EFF] mb-4 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Resend Code"}
              </button>

              <button
                onClick={handleOTPVerify}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>

            <button
              onClick={() => setShowOTP(false)}
              className="w-full py-4 bg-[#1B2130] border border-white/10 rounded-xl text-white font-semibold"
            >
              Back to Login
            </button>
          </div>
        </>
      )}
    </div>
  );
}