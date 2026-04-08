import { useState } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authAPI } from "../../services/api";

export function SignupScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ALLOWED_DOMAINS = [
    // Gmail
    "gmail.com",
    // Outlook / Microsoft
    "outlook.com", "hotmail.com", "live.com", "msn.com", "outlook.in",
    // Yahoo
    "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "yahoo.in", "ymail.com",
    // iCloud / Apple
    "icloud.com", "me.com", "mac.com",
    // ProtonMail
    "protonmail.com", "proton.me",
    // Other major providers
    "zoho.com", "aol.com", "gmx.com", "gmx.net", "tutanota.com",
    "rediffmail.com", "fastmail.com",
  ];

  const isOfficialEmail = (emailVal: string) => {
    const domain = emailVal.trim().split("@")[1]?.toLowerCase();
    return domain ? ALLOWED_DOMAINS.includes(domain) : false;
  };

  const handleSignup = async () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!isOfficialEmail(email)) {
      setError(
        "Please use an official email provider — Gmail, Outlook, Yahoo, iCloud, or ProtonMail."
      );
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.signup({ email, password, name, phone });
      setShowOTP(true);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
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
      await authAPI.verifySignupOTP({ email, otp: otpCode });
      navigate("/quick-auth-setup");   // ← go to quick-auth setup instead of dashboard
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
      await authAPI.signup({ email, password, name, phone });
      setError(""); // Clear any errors
      // Show success message (optional)
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

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6">
      <div className="pt-16 pb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] flex items-center justify-center mb-6 shadow-lg shadow-[#7C5CFF]/50">
          <span className="text-2xl font-bold text-white">F</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
        <p className="text-white/50">Start managing your finances smarter</p>
      </div>

      {!showOTP ? (
        <>
          <div className="space-y-4 flex-1">
            {/* Demo info */}
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4">
              <p className="text-blue-400 text-sm font-medium mb-1">Demo Mode</p>
              <p className="text-blue-400/70 text-xs">
                Already have an account? Use demo@finly.app / demo123 to sign in
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-white/70 mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#1B2130] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#7C5CFF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-white/70 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className={`w-full pl-12 pr-4 py-3.5 bg-[#1B2130] border rounded-xl text-white placeholder:text-white/30 focus:outline-none transition-colors ${
                    email && !isOfficialEmail(email)
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-[#7C5CFF]"
                  }`}
                />
              </div>
              {email && !isOfficialEmail(email) && (
                <p className="text-red-400 text-xs mt-1.5 pl-1">
                  Use Gmail, Outlook, Yahoo, iCloud, or ProtonMail
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-white/70 mb-2 block">Phone</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="123-456-7890"
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
                  placeholder="Create a password"
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

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30 hover:shadow-[#7C5CFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="text-xs text-white/40 text-center px-4">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <div className="py-6 text-center">
            <span className="text-white/50">Already have an account? </span>
            <button
              onClick={() => navigate("/login")}
              className="text-[#7C5CFF] font-semibold hover:text-[#9D7EFF]"
            >
              Sign In
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            
            <div className="bg-[#1B2130] border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Verify Your Email</h2>
              <p className="text-sm text-white/50 mb-2">
                Enter the 6-digit code sent to {email}
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
                    onChange={(e) => handleOTPChange(index, e.target.value)}
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
                {loading ? "Verifying..." : "Verify & Get Started"}
              </button>
            </div>

            <button
              onClick={() => setShowOTP(false)}
              className="w-full py-4 bg-[#1B2130] border border-white/10 rounded-xl text-white font-semibold"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}