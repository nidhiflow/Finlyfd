// Single switch for the payments/premium feature, mirrored from the backend's
// PAYMENTS_ENABLED. While false: PremiumFeatureGate unlocks everything for free,
// and the Subscriptions screen hides checkout in favor of a "temporarily free" notice.
export const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === "true";
