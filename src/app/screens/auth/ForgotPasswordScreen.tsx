import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOTP = () => {
    setStep("otp");
  };

  const handleVerifyOTP = () => {
    setStep("password");
  };

  const handleResetPassword = () => {
    navigate("/login");
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
        <h1 className="text-3xl font-bold text-white mb-2">Reset password</h1>
        <p className="text-white/50">
          {step === "email" && "Enter your email to receive a reset code"}
          {step === "otp" && "Verify the code sent to your email"}
          {step === "password" && "Create a new password"}
        </p>
      </div>

      <div className="flex-1">
        {step === "email" && (
          <>
            <div className="space-y-4 mb-6">
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
            </div>

            <button
              onClick={handleSendOTP}
              className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30 mb-4"
            >
              Send Reset Code
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="bg-[#1B2130] border border-white/10 rounded-2xl p-6 mb-6">
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

              <button className="w-full text-sm text-[#7C5CFF] hover:text-[#9D7EFF] mb-4">
                Resend Code
              </button>

              <button
                onClick={handleVerifyOTP}
                className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30"
              >
                Verify Code
              </button>
            </div>
          </>
        )}

        {step === "password" && (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-white/70 mb-2 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
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

              <div>
                <label className="text-sm text-white/70 mb-2 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#1B2130] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#7C5CFF] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              className="w-full py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9D7EFF] rounded-xl text-white font-semibold shadow-lg shadow-[#7C5CFF]/30"
            >
              Reset Password
            </button>
          </>
        )}

        <button
          onClick={() => navigate("/login")}
          className="w-full py-4 mt-4 bg-[#1B2130] border border-white/10 rounded-xl text-white font-semibold"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}