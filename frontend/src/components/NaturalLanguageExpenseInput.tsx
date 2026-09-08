import { useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { api } from "../api/axios";
import { AddExpenseModal, ExpensePrefill } from "./AddExpenseModal";

const EXAMPLES = [
  "Spent ₹450 on Zomato",
  "Paid 250 for Uber yesterday",
  "Netflix subscription ₹649",
];

export function NaturalLanguageExpenseInput({ onCreated }: { onCreated: () => void }) {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<ExpensePrefill | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setIsParsing(true);
    setError(null);
    try {
      const res = await api.post("/expenses/parse", { text });
      setPrefill(res.data.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Couldn't understand that. Try adding it manually instead."
      );
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-ink-700">
        <Sparkles className="h-4 w-4 text-brand-500" />
        <span className="text-sm font-medium">What did you spend money on?</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLES[0]}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={isParsing || !text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setText(ex)}
            type="button"
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-ink-500 hover:bg-slate-200"
          >
            {ex}
          </button>
        ))}
      </div>

      {prefill && (
        <AddExpenseModal
          onClose={() => setPrefill(null)}
          onCreated={() => {
            onCreated();
            setText("");
          }}
          prefill={prefill}
        />
      )}
    </div>
  );
}
