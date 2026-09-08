import {
  LogOut,
  Wallet,
  TrendingUp,
  PiggyBank,
  Receipt,
  BarChart3,
  ScanLine,
  Target,
  Sparkles,
  Bot,
  Settings as SettingsIcon,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";
import { FinancialSummary } from "../types/finance";

const NAV_LINKS = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/receipts/scan", label: "Scan Receipt", icon: ScanLine },
  { to: "/budgets", label: "Budgets", icon: Wallet },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/income/summary")
      .then((res) => setSummary(res.data.data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-ink-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-ink-900 dark:text-slate-100">SpendWise AI</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto mt-3 flex max-w-6xl flex-wrap gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-slate-100">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-ink-500 dark:text-slate-300">
          This month's numbers, calculated from your recorded income and expenses.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-ink-500 dark:text-slate-300">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">This month's income</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-slate-100">
              {isLoading ? "…" : `₹${(summary?.totalIncome ?? 0).toLocaleString("en-IN")}`}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-ink-500 dark:text-slate-300">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">This month's spending</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-slate-100">
              {isLoading ? "…" : `₹${(summary?.totalExpenses ?? 0).toLocaleString("en-IN")}`}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-ink-500 dark:text-slate-300">
              <PiggyBank className="h-4 w-4" />
              <span className="text-sm">Available balance</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-slate-100">
              {isLoading ? "…" : `₹${(summary?.availableBalance ?? 0).toLocaleString("en-IN")}`}
            </p>
            {!isLoading && summary && (
              <p className="text-xs text-ink-500 dark:text-slate-400">Savings rate: {summary.savingsRate}%</p>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <div className="flex items-center gap-2 text-brand-700">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Want the full picture?</span>
          </div>
          <p className="mt-1 text-sm text-brand-700">
            Check <Link to="/insights" className="underline">AI Insights</Link> for a spending forecast and anomaly alerts, or ask the{" "}
            <Link to="/assistant" className="underline">Assistant</Link> a question about your money.
          </p>
        </div>
      </main>
    </div>
  );
}
