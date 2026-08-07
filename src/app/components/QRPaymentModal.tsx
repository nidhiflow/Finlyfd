import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Clock, QrCode, RefreshCw, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { paymentsAPI } from "../services/api";

interface QRPaymentModalProps {
  isOpen: boolean;
  plan: "Pro" | "Premium";
  billingCycle: "monthly" | "yearly";
  onClose: () => void;
  onSuccess: () => void;
}

type QrState = "loading" | "pending" | "paid" | "expired" | "error";

const POLL_INTERVAL_MS = 4000;

export function QRPaymentModal({ isOpen, plan, billingCycle, onClose, onSuccess }: QRPaymentModalProps) {
  const [state, setState] = useState<QrState>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const qrCodeIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollRef.current = null;
    countdownRef.current = null;
  };

  const generateQr = async () => {
    setState("loading");
    setImageUrl(null);
    clearTimers();
    try {
      const qr = await paymentsAPI.createQr({ plan, billingCycle });
      qrCodeIdRef.current = qr.qr_code_id;
      setImageUrl(qr.image_url);
      setAmount(qr.amount);
      setState("pending");
      setSecondsLeft(Math.max(0, Math.round(qr.close_by * 1000 - Date.now()) / 1000));

      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === null) return prev;
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      pollRef.current = setInterval(async () => {
        const qrCodeId = qrCodeIdRef.current;
        if (!qrCodeId) return;
        try {
          const res = await paymentsAPI.getQrStatus(qrCodeId);
          if (res.status === "paid") {
            clearTimers();
            setState("paid");
            toast.success("Payment received!");
            onSuccess();
          } else if (res.status === "expired") {
            clearTimers();
            setState("expired");
          }
        } catch {
          // Transient network/API error — keep polling rather than flipping to an error state.
        }
      }, POLL_INTERVAL_MS);
    } catch (e: any) {
      setState("error");
      toast.error(e?.message || "Failed to generate QR code");
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateQr();
    } else {
      clearTimers();
    }
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, plan, billingCycle]);

  if (!isOpen) return null;

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 0;
  const seconds = secondsLeft !== null ? Math.floor(secondsLeft % 60) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--divider)] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden text-center z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-ink/40 hover:text-ink hover:bg-ink/10 transition-all"
            aria-label="Close QR payment"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink/5 border border-[var(--divider)] mb-4">
            <QrCode className="w-4 h-4 text-[#6FBE9B]" />
            <span className="text-sm font-medium text-ink">Scan to pay</span>
          </div>

          <h2 className="text-xl font-bold text-ink mb-1">
            Finly {plan} — {billingCycle === "yearly" ? "Yearly" : "Monthly"}
          </h2>
          {amount !== null && (
            <p className="text-ink/60 text-sm mb-5">₹{(amount / 100).toFixed(0)} via any UPI app</p>
          )}

          <div className="relative w-56 h-56 mx-auto mb-5 rounded-2xl bg-white flex items-center justify-center overflow-hidden">
            {state === "loading" && <RefreshCw className="w-8 h-8 text-ink/30 animate-spin" />}
            {state === "pending" && imageUrl && (
              <img src={imageUrl} alt="Scan to pay with UPI" className="w-full h-full object-contain" />
            )}
            {state === "paid" && (
              <div className="flex flex-col items-center gap-2 text-[#6FBE9B]">
                <CheckCircle2 className="w-14 h-14" />
                <span className="text-sm font-semibold">Payment received</span>
              </div>
            )}
            {(state === "expired" || state === "error") && (
              <div className="flex flex-col items-center gap-2 text-ink/50">
                <XCircle className="w-14 h-14" />
                <span className="text-sm font-semibold">
                  {state === "expired" ? "QR code expired" : "Something went wrong"}
                </span>
              </div>
            )}
          </div>

          {state === "pending" && secondsLeft !== null && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-ink/50 mb-4">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Expires in {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </div>
          )}

          {(state === "expired" || state === "error") && (
            <button
              onClick={generateQr}
              className="w-full py-3.5 bg-[#6FBE9B] text-[#0a1410] font-bold text-sm rounded-2xl shadow-lg shadow-[#6FBE9B]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Generate new QR</span>
            </button>
          )}

          {state === "paid" && (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-[#6FBE9B] text-[#0a1410] font-bold text-sm rounded-2xl shadow-lg shadow-[#6FBE9B]/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Done
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
