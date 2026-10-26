"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { userLoginSchema } from "@e-com/shared/schemas";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    // Validate using shared zod schema
    const validation = userLoginSchema.shape.body.safeParse({
      email,
      password,
    });

    if (!validation.success) {
      const errors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((err) => {
        const fieldName = err.path[0] as "email" | "password";
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await login(validation.data);
      router.push(redirectUrl);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "Invalid email or password. Please verify your credentials.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {serverError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 rounded-none animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs font-mono leading-relaxed">{serverError}</div>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-700"
        >
          EMAIL ADDRESS <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="client@vendorvogue.com"
          className={`w-full px-4 py-3 bg-neutral-50 border ${
            fieldErrors.email ? "border-red-500 bg-red-50/20" : "border-neutral-300"
          } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white transition-all`}
        />
        {fieldErrors.email && (
          <p className="text-[10px] font-mono text-red-600 mt-1">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-700"
          >
            PASSWORD <span className="text-red-500">*</span>
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="••••••••••••"
            className={`w-full px-4 py-3 pr-11 bg-neutral-50 border ${
              fieldErrors.password ? "border-red-500 bg-red-50/20" : "border-neutral-300"
            } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white transition-all`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-[10px] font-mono text-red-600 mt-1">{fieldErrors.password}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 px-6 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 text-xs font-bold uppercase tracking-[0.22em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AUTHENTICATING...</span>
          </>
        ) : (
          <span>SIGN IN TO CLIENT ACCOUNT</span>
        )}
      </button>

      {/* Switch to Register */}
      <div className="text-center pt-4">
        <p className="text-xs text-neutral-500 font-light">
          Don't have an account?{" "}
          <Link
            href={`/register${redirectUrl !== "/account" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="font-medium text-black hover:underline uppercase tracking-wider text-[11px]"
          >
            CREATE ONE HERE
          </Link>
        </p>
      </div>
    </form>
  );
}
