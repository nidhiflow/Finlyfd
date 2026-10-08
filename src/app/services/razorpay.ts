import { paymentsAPI, User } from "./api";
import { PAYMENTS_ENABLED } from "./features";

interface StartCheckoutParams {
  plan: "Pro" | "Premium";
  billingCycle: "monthly" | "yearly";
  description: string;
  themeColor?: string;
  prefill: { name?: string; email?: string; contact?: string };
  onSuccess: (user: User | undefined) => void;
  onError: (message: string) => void;
  onDismiss?: () => void;
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let sdkPromise: Promise<void> | null = null;

// Loaded on demand (not in index.html) so every page view does not pull a third-party
// payment script, which is wasted work while payments are off and before the user pays.
function loadRazorpaySdk(): Promise<void> {
  if ((window as any).Razorpay) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = CHECKOUT_SRC;
      el.onload = () => resolve();
      el.onerror = () => { sdkPromise = null; el.remove(); reject(new Error("Razorpay SDK failed to load")); };
      document.head.appendChild(el);
    });
  }
  return sdkPromise;
}

export async function startRazorpayCheckout(params: StartCheckoutParams) {
  if (!PAYMENTS_ENABLED) {
    params.onError("Payments are temporarily disabled. All Pro features are free for now.");
    return;
  }
  try {
    await loadRazorpaySdk();
  } catch {
    params.onError("Could not load the payment window. Check your connection and try again.");
    return;
  }

  let order;
  try {
    order = await paymentsAPI.createOrder({
      plan: params.plan,
      billingCycle: params.billingCycle,
      receipt: `sub_${params.plan.toLowerCase()}_${Date.now()}`,
    });
  } catch (e: any) {
    params.onError(e?.message || "Failed to create payment order.");
    return;
  }

  const options = {
    key: order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    order_id: order.order_id,
    name: "Finly",
    description: params.description,
    image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    handler: async (response: any) => {
      try {
        const result = await paymentsAPI.verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        if (result.success) {
          params.onSuccess(result.user);
        } else {
          params.onError("Payment verification failed. Please contact support if amount was deducted.");
        }
      } catch (e: any) {
        params.onError(e?.message || "Payment verification failed.");
      }
    },
    prefill: params.prefill,
    theme: { color: params.themeColor || "#6FBE9B" },
    modal: {
      ondismiss: () => params.onDismiss?.(),
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.on("payment.failed", (response: any) => {
    params.onError(response?.error?.description || "Payment failed. Please try again.");
  });
  rzp.open();
}
