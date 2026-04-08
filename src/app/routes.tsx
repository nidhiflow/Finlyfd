import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";

// Root redirect (smart entry point)
import { RootRedirect } from "./screens/RootRedirect";

// Onboarding
import { OnboardingScreen } from "./screens/OnboardingScreen";

// Auth screens
import { LoginScreen } from "./screens/auth/LoginScreen";
import { SignupScreen } from "./screens/auth/SignupScreen";
import { ForgotPasswordScreen } from "./screens/auth/ForgotPasswordScreen";
import { QuickAuthSetupScreen } from "./screens/auth/QuickAuthSetupScreen";
import { QuickLoginScreen } from "./screens/auth/QuickLoginScreen";

// Main screens
import { DashboardScreen } from "./screens/DashboardScreen";
import { TransactionsScreen } from "./screens/TransactionsScreen";
import { AddTransactionScreen } from "./screens/AddTransactionScreen";
import { RecurringTransactionsScreen } from "./screens/RecurringTransactionsScreen";
import { ReportsScreen } from "./screens/ReportsScreen";
import { CategoriesScreen } from "./screens/CategoriesScreen";
import { AccountsScreen } from "./screens/AccountsScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { BudgetScreen } from "./screens/BudgetScreen";
import { GoalsScreen } from "./screens/GoalsScreen";
import { AIAgentScreen } from "./screens/AIAgentScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export const router = createBrowserRouter([
  // ── Root: evaluates state and redirects to the right screen ──
  {
    path: "/",
    Component: RootRedirect,
  },

  // ── Onboarding (4-slide intro for first-time users) ──
  {
    path: "/onboarding",
    Component: OnboardingScreen,
  },

  // ── Auth ──
  {
    path: "/login",
    Component: AuthLayout,
    children: [{ index: true, Component: LoginScreen }],
  },
  {
    path: "/signup",
    Component: AuthLayout,
    children: [{ index: true, Component: SignupScreen }],
  },
  {
    path: "/forgot-password",
    Component: AuthLayout,
    children: [{ index: true, Component: ForgotPasswordScreen }],
  },
  {
    path: "/quick-auth-setup",
    Component: AuthLayout,
    children: [{ index: true, Component: QuickAuthSetupScreen }],
  },
  {
    path: "/quick-login",
    Component: AuthLayout,
    children: [{ index: true, Component: QuickLoginScreen }],
  },

  // ── Main app ──
  {
    path: "/dashboard",
    Component: MainLayout,
    children: [
      { index: true, Component: DashboardScreen },
      { path: "transactions", Component: TransactionsScreen },
      { path: "add-transaction", Component: AddTransactionScreen },
      { path: "edit-transaction/:id", Component: AddTransactionScreen },
      { path: "recurring", Component: RecurringTransactionsScreen },
      { path: "reports", Component: ReportsScreen },
      { path: "categories", Component: CategoriesScreen },
      { path: "accounts", Component: AccountsScreen },
      { path: "calendar", Component: CalendarScreen },
      { path: "budget", Component: BudgetScreen },
      { path: "goals", Component: GoalsScreen },
      { path: "ai-agent", Component: AIAgentScreen },
      { path: "settings", Component: SettingsScreen },
    ],
  },

  // ── Fallback: any unknown URL → root redirect ──
  {
    path: "*",
    Component: RootRedirect,
  },
]);
