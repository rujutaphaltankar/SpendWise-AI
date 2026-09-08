import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Trash2, Wallet, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { Expense, PaginatedResult, EXPENSE_CATEGORIES } from "../types/finance";
import { AddExpenseModal } from "../components/AddExpenseModal";
import { NaturalLanguageExpenseInput } from "../components/NaturalLanguageExpenseInput";

export default function Transactions() {
  const [data, setData] = useState<PaginatedResult<Expense> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get("/expenses", { params });
      setData(res.data.data);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-ink-900">Transactions</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Add expense
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <NaturalLanguageExpenseInput onCreated={fetchExpenses} />
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search merchant, note..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Wallet className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-ink-700">No expenses yet</p>
              <p className="mt-1 text-sm text-ink-500">
                Add your first expense to start tracking your spending.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-ink-500">
                  <th className="px-4 py-3 font-medium">Merchant</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((expense) => (
                  <tr key={expense._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{expense.merchant}</div>
                      {expense.description && (
                        <div className="text-xs text-ink-500">{expense.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {new Date(expense.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{expense.paymentMethod || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-900">
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="rounded-lg p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-ink-500">
            <span>
              Page {data.page} of {data.totalPages} · {data.total} total
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {showAddModal && (
        <AddExpenseModal onClose={() => setShowAddModal(false)} onCreated={fetchExpenses} />
      )}
    </div>
  );
}
