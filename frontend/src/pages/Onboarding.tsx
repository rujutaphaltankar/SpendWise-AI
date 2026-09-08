import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowRight, Loader2 } from "lucide-react";
import { api } from "../api/axios";

export default function Onboarding() {
  const navigate = useNavigate();
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [savingsGoalAmount, setSavingsGoalAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.put("/auth/me", {
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : 0,
        savingsGoalAmount: savingsGoalAmount ? parseFloat(savingsGoalAmount) : 0,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-ink-900">SpendWise AI</span>
        </div>

        <h1 className="text-2xl font-semibold text-ink-900">Let's set up your finances</h1>
        <p className="mt-1 text-sm text-ink-500">
          This helps us calculate your savings rate and budget progress accurately. You can always change
          this later in Settings.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700">Monthly income (₹)</label>
            <input
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="25000"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-700">Overall savings goal (₹, optional)</label>
            <input
              value={savingsGoalAmount}
              onChange={(e) => setSavingsGoalAmount(e.target.value)}
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="70000"
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Continue to dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full text-center text-sm text-ink-500 hover:text-ink-700"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
