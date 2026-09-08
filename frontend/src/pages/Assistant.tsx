import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Wallet, Send, Loader2, Bot, User } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { ChatMessage } from "../types/finance";

const SUGGESTIONS = [
  "How much did I spend on food this month?",
  "What was my biggest expense?",
  "Which subscriptions do I have?",
  "How much can I spend this week?",
];

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question: string) {
    if (!question.trim() || isSending) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setIsSending(true);

    try {
      const res = await api.post("/assistant/chat", { question });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.data.answer }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err?.response?.data?.message || "I couldn't process that question." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link to="/dashboard" className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-ink-900">AI Financial Assistant</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-6 py-6">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <Bot className="mx-auto h-8 w-8 text-brand-500" />
              <p className="mt-3 text-sm font-medium text-ink-700">Ask me about your finances</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-ink-600 hover:bg-slate-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <Bot className="h-4 w-4 text-brand-600" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-brand-500 text-white" : "bg-white text-ink-700 border border-slate-200"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <User className="h-4 w-4 text-ink-600" />
                </div>
              )}
            </div>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your spending..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-white hover:bg-brand-600 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </main>
    </div>
  );
}
