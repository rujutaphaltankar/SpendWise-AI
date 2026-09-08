import { useRef, useState } from "react";
import { ArrowLeft, Wallet, Upload, Loader2, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { AddExpenseModal, ExpensePrefill } from "../components/AddExpenseModal";

export default function ReceiptScanner() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<ExpensePrefill | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const res = await api.post("/receipts/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPrefill(res.data.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Couldn't read this receipt. You can still add the expense manually."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link to="/dashboard" className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-ink-900">Receipt Scanner</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
          {preview ? (
            <img src={preview} alt="Receipt preview" className="mx-auto max-h-72 rounded-lg object-contain" />
          ) : (
            <ScanLine className="mx-auto h-10 w-10 text-slate-300" />
          )}

          <p className="mt-4 text-sm font-medium text-ink-900">
            {isProcessing ? "Reading your receipt..." : "Upload a photo of your receipt"}
          </p>
          <p className="mt-1 text-sm text-ink-500">JPEG, PNG, or WebP — up to 5MB</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {preview ? "Choose a different receipt" : "Choose a file"}
          </button>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </main>

      {prefill && (
        <AddExpenseModal
          onClose={() => setPrefill(null)}
          onCreated={() => {
            setPreview(null);
            setPrefill(null);
          }}
          prefill={prefill}
        />
      )}
    </div>
  );
}
