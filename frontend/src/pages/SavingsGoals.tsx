import { useEffect, useState } from "react";
import { ArrowLeft, Wallet, Plus, X, PiggyBank } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { SavingsGoalProgress } from "../types/finance";

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function fetchGoals() {
    setIsLoading(true);
    api
      .get("/goals")
      .then((res) => setGoals(res.data.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchGoals();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/goals", {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        targetDate: targetDate || undefined,
      });
      setShowForm(false);
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setTargetDate("");
      fetchGoals();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not create this goal.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    await api.delete(`/goals/${id}`);
    fetchGoals();
  }

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
            <span className="font-semibold text-ink-900">Savings Goals</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            New goal
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <PiggyBank className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-ink-700">No savings goals yet</p>
            <p className="mt-1 text-sm text-ink-500">Set a target — like a laptop or a trip — and track your progress.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((g) => (
              <div key={g.goalId} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-ink-900">{g.name}</span>
                    {g.isComplete && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Complete!
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(g.goalId)}
                    className="rounded-lg p-1 text-ink-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  ₹{g.currentAmount.toLocaleString("en-IN")} of ₹{g.targetAmount.toLocaleString("en-IN")}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.min(g.progressPercent, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-500">{g.progressPercent}% there</p>
                {g.requiredMonthlySavings !== null && (
                  <p className="mt-1 text-xs text-ink-500">
                    Save ₹{g.requiredMonthlySavings.toLocaleString("en-IN")}/month to hit your target
                    {g.targetDate ? ` by ${g.targetDate}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-900">New savings goal</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-ink-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-700">Goal name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Laptop"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-700">Target (₹)</label>
                  <input
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    type="number"
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="70000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700">Saved so far (₹)</label>
                  <input
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="28000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Target date (optional)</label>
                <input
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                Create goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
