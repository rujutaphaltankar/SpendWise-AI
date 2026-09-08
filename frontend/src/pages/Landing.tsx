import { Link } from "react-router-dom";
import {
  Wallet,
  Sparkles,
  Receipt,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Bot,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

const FEATURES = [
  { icon: Sparkles, title: "Natural-language entry", desc: "Just type \"Spent ₹450 on Zomato\" — no forms." },
  { icon: ScanLine, title: "Receipt scanning", desc: "Snap a photo. OCR reads the merchant, total, and line items." },
  { icon: TrendingUp, title: "Spending predictions", desc: "Interpretable models forecast next month's spend." },
  { icon: BarChart3, title: "Anomaly detection", desc: "Get flagged when a transaction looks unusual." },
  { icon: Bot, title: "AI financial assistant", desc: "Ask plain-English questions about your own verified data." },
  { icon: ShieldCheck, title: "Privacy-first", desc: "Your data stays yours. Minimal data ever reaches external AI." },
];

const STEPS = [
  { title: "Add expenses", desc: "Manually, by typing naturally, or by scanning a receipt." },
  { title: "We categorize & analyze", desc: "Deterministic rules plus AI fallback sort every transaction." },
  { title: "Get real insight", desc: "Budgets, forecasts, and anomaly alerts — all backed by real numbers." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-ink-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-ink-900 dark:text-slate-100">SpendWise AI</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="text-sm font-medium text-ink-700 hover:text-ink-900 dark:text-slate-300 dark:hover:text-white">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-ink-900 dark:text-slate-100 sm:text-5xl">
          Understand your spending.
          <br />
          Predict your future.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500 dark:text-slate-300">
          SpendWise AI turns everyday transactions into intelligent financial insights — built for students
          and young professionals in India.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600"
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Feature overview */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-ink-900 dark:text-slate-100">Everything you need, nothing you don't</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <Icon className="h-5 w-5 text-brand-600 dark:text-brand-300" />
              </div>
              <h3 className="mt-4 font-medium text-ink-900 dark:text-slate-100">{title}</h3>
              <p className="mt-1 text-sm text-ink-500 dark:text-slate-300">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900/80">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-semibold text-ink-900 dark:text-slate-100">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-3 font-medium text-ink-900 dark:text-slate-100">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-500 dark:text-slate-300">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy/security section */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-brand-500" />
        <h2 className="mt-4 text-2xl font-semibold text-ink-900 dark:text-slate-100">Your financial data stays yours</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 dark:text-slate-300">
          Passwords are hashed, never stored in plain text. Every request is scoped to your account only.
          We minimize what's ever sent to external AI services, and financial calculations are always
          computed deterministically on our servers — never left to an AI model to guess.
        </p>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-100 bg-brand-500 px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold text-white">Ready to see where your money goes?</h2>
        <Link
          to="/register"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          Create your free account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-ink-400 dark:text-slate-400">
        <div className="flex items-center justify-center gap-2">
          <Receipt className="h-3.5 w-3.5" />
          <span>SpendWise AI — a demo financial intelligence project</span>
        </div>
      </footer>
    </div>
  );
}
