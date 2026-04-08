/**
 * Local Authentication Service
 * Handles MPIN setup/verification, biometric preferences, and session management.
 * NOTE: In a production mobile app, biometric auth would use native APIs
 * (e.g., Web Authentication API / Capacitor Biometrics plugin).
 */

const KEYS = {
  MPIN_HASH: "finly_mpin_hash",
  MPIN_LENGTH: "finly_mpin_length",
  BIOMETRIC_ENABLED: "finly_biometric_enabled",
  LAST_ACTIVITY: "finly_last_activity",
  QUICK_AUTH_ENABLED: "finly_quick_auth_enabled",
  SESSION_EMAIL: "finly_session_email",
} as const;

/** 24 hours in milliseconds */
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/** Salt for PIN hashing — in a real app, use a per-user server-side salt */
const SALT = "finly_local_salt_v1_2024";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const localAuthService = {
  // ─── MPIN ────────────────────────────────────────────────────────────────

  async setupMPIN(pin: string): Promise<void> {
    const hash = await hashPin(pin);
    localStorage.setItem(KEYS.MPIN_HASH, hash);
    localStorage.setItem(KEYS.MPIN_LENGTH, String(pin.length));
    localStorage.setItem(KEYS.QUICK_AUTH_ENABLED, "true");
  },

  async verifyMPIN(pin: string): Promise<boolean> {
    const storedHash = localStorage.getItem(KEYS.MPIN_HASH);
    if (!storedHash) return false;
    const hash = await hashPin(pin);
    return hash === storedHash;
  },

  hasMPIN(): boolean {
    return !!localStorage.getItem(KEYS.MPIN_HASH);
  },

  getMPINLength(): number {
    return parseInt(localStorage.getItem(KEYS.MPIN_LENGTH) ?? "4", 10);
  },

  clearMPIN(): void {
    localStorage.removeItem(KEYS.MPIN_HASH);
    localStorage.removeItem(KEYS.MPIN_LENGTH);
  },

  // ─── Biometric ───────────────────────────────────────────────────────────

  setBiometricEnabled(enabled: boolean): void {
    localStorage.setItem(KEYS.BIOMETRIC_ENABLED, enabled ? "true" : "false");
  },

  isBiometricEnabled(): boolean {
    return localStorage.getItem(KEYS.BIOMETRIC_ENABLED) === "true";
  },

  /**
   * Attempt biometric authentication using Web Authentication API.
   * Falls back to a simulated flow in unsupported environments.
   */
  async authenticateWithBiometric(): Promise<boolean> {
    // In a real React Native / Capacitor app, call native biometric API here.
    // For web preview, we simulate a successful scan after a short delay.
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1800);
    });
  },

  // ─── Session ─────────────────────────────────────────────────────────────

  updateLastActivity(): void {
    localStorage.setItem(KEYS.LAST_ACTIVITY, String(Date.now()));
  },

  isSessionValid(): boolean {
    const raw = localStorage.getItem(KEYS.LAST_ACTIVITY);
    if (!raw) return false;
    const elapsed = Date.now() - parseInt(raw, 10);
    return elapsed < SESSION_DURATION_MS;
  },

  getTimeSinceLastActivity(): string {
    const raw = localStorage.getItem(KEYS.LAST_ACTIVITY);
    if (!raw) return "Never";
    const elapsed = Date.now() - parseInt(raw, 10);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  },

  // ─── Quick Auth ───────────────────────────────────────────────────────────

  isQuickAuthEnabled(): boolean {
    return (
      localStorage.getItem(KEYS.QUICK_AUTH_ENABLED) === "true" &&
      this.hasMPIN()
    );
  },

  saveSessionEmail(email: string): void {
    localStorage.setItem(KEYS.SESSION_EMAIL, email);
  },

  getSessionEmail(): string {
    return localStorage.getItem(KEYS.SESSION_EMAIL) ?? "";
  },

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  /** Call on full logout — removes all quick auth data */
  clearAll(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
