import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";

// Root redirect (smart entry point) — kept as a static import since it's the
// very first thing every cold visit hits; everything past it loads on demand
// per route, so the initial bundle only ships what the current screen needs.
import { RootRedirect } from "./screens/RootRedirect";

export const router = createBrowserRouter([
  // ── Root: evaluates state and redirects to the right screen ──
  {
    path: "/",
    Component: RootRedirect,
  },

  // ── Onboarding (4-slide intro for first-time users) ──
  {
    path: "/onboarding",
    lazy: () => import("./screens/OnboardingScreen").then((m) => ({ Component: m.OnboardingScreen })),
  },

  // ── Privacy Policy & Terms of Service (public, no auth required — linked
  // from Settings, checkout, and the Play Store listing) ──
  {
    path: "/privacy",
    lazy: () => import("./screens/PrivacyPolicyScreen").then((m) => ({ Component: m.PrivacyPolicyScreen })),
  },
  {
    path: "/terms",
    lazy: () => import("./screens/TermsOfServiceScreen").then((m) => ({ Component: m.TermsOfServiceScreen })),
  },

  // ── Auth ──
  {
    path: "/login",
    Component: AuthLayout,
    children: [{ index: true, lazy: () => import("./screens/auth/LoginScreen").then((m) => ({ Component: m.LoginScreen })) }],
  },
  {
    path: "/signup",
    Component: AuthLayout,
    children: [{ index: true, lazy: () => import("./screens/auth/SignupScreen").then((m) => ({ Component: m.SignupScreen })) }],
  },
  {
    path: "/forgot-password",
    Component: AuthLayout,
    children: [{ index: true, lazy: () => import("./screens/auth/ForgotPasswordScreen").then((m) => ({ Component: m.ForgotPasswordScreen })) }],
  },
  {
    path: "/quick-auth-setup",
    Component: AuthLayout,
    children: [{ index: true, lazy: () => import("./screens/auth/QuickAuthSetupScreen").then((m) => ({ Component: m.QuickAuthSetupScreen })) }],
  },
  {
    path: "/quick-login",
    Component: AuthLayout,
    children: [{ index: true, lazy: () => import("./screens/auth/QuickLoginScreen").then((m) => ({ Component: m.QuickLoginScreen })) }],
  },

  // ── Main app ──
  {
    path: "/dashboard",
    Component: MainLayout,
    children: [
      { index: true, lazy: () => import("./screens/DashboardScreen").then((m) => ({ Component: m.DashboardScreen })) },

      { path: "time-machine", lazy: () => import("./screens/TimeMachineScreen").then((m) => ({ Component: m.TimeMachineScreen })) },
      { path: "transactions", lazy: () => import("./screens/TransactionsScreen").then((m) => ({ Component: m.TransactionsScreen })) },
      { path: "add-transaction", lazy: () => import("./screens/AddTransactionScreen").then((m) => ({ Component: m.AddTransactionScreen })) },
      { path: "edit-transaction/:id", lazy: () => import("./screens/AddTransactionScreen").then((m) => ({ Component: m.AddTransactionScreen })) },
      { path: "recurring", lazy: () => import("./screens/RecurringTransactionsScreen").then((m) => ({ Component: m.RecurringTransactionsScreen })) },
      { path: "reports", lazy: () => import("./screens/ReportsScreen").then((m) => ({ Component: m.ReportsScreen })) },
      { path: "categories", lazy: () => import("./screens/CategoriesScreen").then((m) => ({ Component: m.CategoriesScreen })) },
      { path: "accounts", lazy: () => import("./screens/AccountsScreen").then((m) => ({ Component: m.AccountsScreen })) },
      { path: "calendar", lazy: () => import("./screens/CalendarScreen").then((m) => ({ Component: m.CalendarScreen })) },
      { path: "budget", lazy: () => import("./screens/BudgetScreen").then((m) => ({ Component: m.BudgetScreen })) },
      { path: "goals", lazy: () => import("./screens/GoalsScreen").then((m) => ({ Component: m.GoalsScreen })) },
      { path: "ai-agent", lazy: () => import("./screens/AIAgentScreen").then((m) => ({ Component: m.AIAgentScreen })) },
      { path: "settings", lazy: () => import("./screens/SettingsScreen").then((m) => ({ Component: m.SettingsScreen })) },
      { path: "subscriptions", lazy: () => import("./screens/SubscriptionsScreen").then((m) => ({ Component: m.SubscriptionsScreen })) },
      { path: "admin", lazy: () => import("./screens/AdminScreen").then((m) => ({ Component: m.AdminScreen })) },
    ],
  },

  // ── Fallback: any unknown URL → root redirect ──
  {
    path: "*",
    Component: RootRedirect,
  },
]);
