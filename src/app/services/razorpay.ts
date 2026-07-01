import { paymentsAPI, User } from "./api";

interface StartCheckoutParams {
  plan: "Pro" | "Premium";
  amountInRupees: number;
  description: string;
  themeColor?: string;
  prefill: { name?: string; email?: string; contact?: string };
  onSuccess: (user: User | undefined) => void;
  onError: (message: string) => void;
  onDismiss?: () => void;
}

export async function startRazorpayCheckout(params: StartCheckoutParams) {
  if (!(window as any).Razorpay) {
    params.onError("Razorpay payment SDK not loaded yet. Please try again in a few seconds.");
    return;
  }

  let order;
  try {
    order = await paymentsAPI.createOrder({
      amount: Math.round(params.amountInRupees * 100),
      currency: "INR",
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
          plan: params.plan,
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
