import { useState } from "react";
import { ArrowLeft, Wallet, Loader2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [monthlyIncome, setMonthlyIncome] = useState(String(user?.monthlyIncome ?? ""));
  const [savingsGoalAmount, setSavingsGoalAmount] = useState(String(user?.savingsGoalAmount ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.put("/auth/me", {
        name,
        currency,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : 0,
        savingsGoalAmount: savingsGoalAmount ? parseFloat(savingsGoalAmount) : 0,
      });
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/dashboard" className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-ink-900">Profile & Settings</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink-700">Email</label>
              <input
                value={user?.email || ""}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-ink-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Monthly income</label>
                <input
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink-700">Overall savings goal</label>
              <input
                value={savingsGoalAmount}
                onChange={(e) => setSavingsGoalAmount(e.target.value)}
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {saved && (
              <div className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                <Check className="h-4 w-4" />
                Saved
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-medium text-ink-700">Privacy</h3>
          <p className="mt-1 text-sm text-ink-500">
            Your financial data is only ever visible to you. We minimize what's sent to external AI
            services, and every calculation is computed deterministically on our servers.
          </p>
        </div>
      </main>
    </div>
  );
}
