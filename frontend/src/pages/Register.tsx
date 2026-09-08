import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wallet, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FormError } from "../components/FormError";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[a-z]/, "Needs a lowercase letter")
    .regex(/[0-9]/, "Needs a number"),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerUser(values.name, values.email, values.password);
      navigate("/onboarding");
    } catch (err: any) {
      setServerError(err?.response?.data?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-ink-900">SpendWise AI</span>
        </div>

        <h1 className="text-2xl font-semibold text-ink-900">Create your account</h1>
        <p className="mt-1 text-sm text-ink-500">
          Understand your spending. Predict your future.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700">Full name</label>
            <input
              {...register("name")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Rujuta Phaltankar"
            />
            <FormError message={errors.name?.message} />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-700">Email</label>
            <input
              {...register("email")}
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="you@example.com"
            />
            <FormError message={errors.email?.message} />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-700">Password</label>
            <input
              {...register("password")}
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
            />
            <FormError message={errors.password?.message} />
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
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
