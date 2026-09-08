import { useEffect, useState } from "react";
import { ArrowLeft, Wallet, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { BudgetProgress, EXPENSE_CATEGORIES } from "../types/finance";

export default function Budgets() {
  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function fetchBudgets() {
    setIsLoading(true);
    api
      .get("/budgets")
      .then((res) => setBudgets(res.data.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchBudgets();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/budgets", {
        category: category || null,
        amount: parseFloat(amount),
      });
      setShowForm(false);
      setCategory("");
      setAmount("");
      fetchBudgets();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not create this budget.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    await api.delete(`/budgets/${id}`);
    fetchBudgets();
  }

  const statusColors: Record<string, string> = {
    "on-track": "bg-brand-500",
    warning: "bg-amber-500",
    exceeded: "bg-red-500",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-ink-900">Budgets</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            New budget
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-ink-700">No budgets set yet</p>
            <p className="mt-1 text-sm text-ink-500">Create an overall or category budget to track your spending against.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((b) => (
              <div key={b.budgetId} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-ink-900">{b.category ?? "Overall budget"}</span>
                    <span className="ml-2 text-sm text-ink-500">
                      ₹{b.spent.toLocaleString("en-IN")} / ₹{b.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        b.status === "exceeded" ? "text-red-600" : b.status === "warning" ? "text-amber-600" : "text-brand-600"
                      }`}
                    >
                      {b.percentUsed}%
                    </span>
                    <button
                      onClick={() => handleDelete(b.budgetId)}
                      className="rounded-lg p-1 text-ink-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${statusColors[b.status]}`}
                    style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-500">
                  {b.remaining >= 0
                    ? `₹${b.remaining.toLocaleString("en-IN")} remaining`
                    : `₹${Math.abs(b.remaining).toLocaleString("en-IN")} over budget`}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-900">New budget</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-ink-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Overall (all categories)</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Monthly budget (₹)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="5000"
                />
              </div>
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                Create budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
