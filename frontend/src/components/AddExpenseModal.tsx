import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { api } from "../api/axios";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../types/finance";
import { FormError } from "./FormError";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  merchant: z.string().trim().min(1, "Merchant is required"),
  category: z.enum(EXPENSE_CATEGORIES),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export interface ExpensePrefill {
  amount?: number | null;
  merchant?: string;
  category?: string;
  date?: string;
  paymentMethod?: string | null;
  description?: string | null;
  confidence?: number;
  receiptUrl?: string;
  lineItems?: { name: string; price: number }[];
}

export function AddExpenseModal({
  onClose,
  onCreated,
  prefill,
}: {
  onClose: () => void;
  onCreated: () => void;
  prefill?: ExpensePrefill;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: prefill?.date || new Date().toISOString().slice(0, 10),
      amount: prefill?.amount ?? undefined,
      merchant: prefill?.merchant && prefill.merchant !== "Unknown merchant" ? prefill.merchant : undefined,
      category: (prefill?.category as FormValues["category"]) || undefined,
      paymentMethod: (prefill?.paymentMethod as FormValues["paymentMethod"]) || undefined,
      description: prefill?.description || undefined,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await api.post("/expenses", {
        ...values,
        source: prefill?.receiptUrl ? "receipt" : prefill ? "natural-language" : "manual",
        receiptUrl: prefill?.receiptUrl,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setServerError(err?.response?.data?.message || "Could not save this expense.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">
            {prefill ? "Review expense" : "Add expense"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {prefill && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {prefill.receiptUrl ? "Extracted from your receipt" : "AI extracted this from what you typed"}
              {typeof prefill.confidence === "number" &&
                ` (${Math.round(prefill.confidence * 100)}% confidence)`}
              . Double-check before saving.
            </span>
          </div>
        )}

        {prefill?.receiptUrl && (
          <div className="mb-4 flex gap-3">
            <img
              src={`${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "")}${prefill.receiptUrl}`}
              alt="Receipt"
              className="h-24 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
            />
            {prefill.lineItems && prefill.lineItems.length > 0 && (
              <div className="flex-1 rounded-lg bg-slate-50 p-2 text-xs">
                {prefill.lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-ink-600">
                    <span className="truncate">{item.name}</span>
                    <span>₹{item.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-700">Amount (₹)</label>
              <input
                {...register("amount")}
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="450"
              />
              <FormError message={errors.amount?.message} />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">Date</label>
              <input
                {...register("date")}
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <FormError message={errors.date?.message} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-700">Merchant</label>
            <input
              {...register("merchant")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Zomato"
            />
            <FormError message={errors.merchant?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-700">Category</label>
              <select
                {...register("category")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Select...</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <FormError message={errors.category?.message} />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">Payment method</label>
              <select
                {...register("paymentMethod")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Optional</option>
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-700">Note (optional)</label>
            <input
              {...register("description")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Dinner with friends"
            />
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save expense
          </button>
        </form>
      </div>
    </div>
  );
}
