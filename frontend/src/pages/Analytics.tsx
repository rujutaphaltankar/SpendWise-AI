import { useEffect, useState } from "react";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { api } from "../api/axios";
import {
  AnalyticsSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
  DailySpendingItem,
} from "../types/finance";

const COLORS = [
  "#1f9d72",
  "#3fb88b",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#84cc16",
  "#f97316",
  "#64748b",
  "#a855f7",
];

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdownItem[]>([]);
  const [trend, setTrend] = useState<MonthlyTrendItem[]>([]);
  const [daily, setDaily] = useState<DailySpendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/summary"),
      api.get("/analytics/categories"),
      api.get("/analytics/trends?months=6"),
    ])
      .then(([summaryRes, categoriesRes, trendsRes]) => {
        setSummary(summaryRes.data.data);
        setCategories(categoriesRes.data.data);
        setTrend(trendsRes.data.data.monthlyTrend);
        setDaily(trendsRes.data.data.dailySpending);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link to="/dashboard" className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-ink-900">Analytics</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <SummaryCard
                icon={<Trophy className="h-4 w-4" />}
                label="Top category (this month)"
                value={summary?.topCategory ? summary.topCategory.category : "—"}
                sub={summary?.topCategory ? `₹${summary.topCategory.total.toLocaleString("en-IN")}` : undefined}
              />
              <SummaryCard
                icon={<Zap className="h-4 w-4" />}
                label="Biggest transaction"
                value={
                  summary?.biggestTransaction ? `₹${summary.biggestTransaction.amount.toLocaleString("en-IN")}` : "—"
                }
                sub={summary?.biggestTransaction?.merchant}
              />
              <SummaryCard
                icon={
                  (summary?.monthComparison.changeAmount ?? 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )
                }
                label="vs. last month"
                value={
                  summary?.monthComparison.changePercent !== null &&
                  summary?.monthComparison.changePercent !== undefined
                    ? `${summary.monthComparison.changePercent > 0 ? "+" : ""}${summary.monthComparison.changePercent}%`
                    : "—"
                }
                sub={`₹${summary?.monthComparison.currentMonthTotal.toLocaleString("en-IN")} this month`}
              />
              <SummaryCard
                icon={<Wallet className="h-4 w-4" />}
                label="Savings rate"
                value={`${summary?.savingsRate ?? 0}%`}
                sub={`₹${(summary?.availableBalance ?? 0).toLocaleString("en-IN")} available`}
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-medium text-ink-700">Spending by category</h3>
                <p className="text-xs text-ink-500">This calendar month</p>
                {categories.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <div className="mt-4 flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie
                          data={categories}
                          dataKey="total"
                          nameKey="category"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {categories.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5 text-sm">
                      {categories.slice(0, 6).map((c, i) => (
                        <div key={c.category} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="truncate text-ink-700">{c.category}</span>
                          </div>
                          <span className="shrink-0 text-ink-500">{c.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-medium text-ink-700">Income vs. expenses</h3>
                <p className="text-xs text-ink-500">Last 6 months</p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trend} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="totalIncome" name="Income" stroke="#1f9d72" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="totalExpenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                <h3 className="text-sm font-medium text-ink-700">Daily spending</h3>
                <p className="text-xs text-ink-500">This calendar month</p>
                {daily.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={daily} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                        tickFormatter={(d: string) => d.slice(8)}
                      />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                      <Bar dataKey="total" fill="#1f9d72" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-ink-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 truncate text-xl font-semibold text-ink-900">{value}</p>
      {sub && <p className="truncate text-xs text-ink-500">{sub}</p>}
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-40 flex-col items-center justify-center text-center">
      <p className="text-sm text-ink-500">No data yet for this period.</p>
      <Link to="/transactions" className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-700">
        Add an expense
      </Link>
    </div>
  );
}
