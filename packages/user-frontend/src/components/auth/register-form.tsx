"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { userRegistrationSchema } from "@e-com/shared/schemas";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  const register = useAuthStore((s) => s.register);

  const [formData, setFormData] = React.useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    // Validate using shared zod schema
    const validation = userRegistrationSchema.shape.body.safeParse(formData);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const fieldName = err.path[0] as string;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await register(validation.data);
      router.push(redirectUrl);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "Registration failed. An account with this email may already exist.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {serverError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 rounded-none animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs font-mono leading-relaxed">{serverError}</div>
        </div>
      )}

      {/* Name Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="firstname"
            className="block text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-700"
          >
            FIRST NAME <span className="text-red-500">*</span>
          </label>
          <input
            id="firstname"
            name="firstname"
            type="text"
            autoComplete="given-name"
            value={formData.firstname}
            onChange={handleChange}
            placeholder="John"
            className={`w-full px-4 py-3 bg-neutral-50 border ${
              fieldErrors.firstname ? "border-red-500 bg-red-50/20" : "border-neutral-300"
            } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white transition-all`}
          />
          {fieldErrors.firstname && (
            <p className="text-[10px] font-mono text-red-600 mt-1">{fieldErrors.firstname}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="lastname"
            className="block text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-700"
          >
            LAST NAME <span className="text-red-500">*</span>
          </label>
          <input
            id="lastname"
            name="lastname"
            type="text"
            autoComplete="family-name"
            value={formData.lastname}
            onChange={handleChange}
            placeholder="Doe"
            className={`w-full px-4 py-3 bg-neutral-50 border ${
              fieldErrors.lastname ? "border-red-500 bg-red-50/20" : "border-neutral-300"
            } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white transition-all`}
          />
          {fieldErrors.lastname && (
            <p className="text-[10px] font-mono text-red-600 mt-1">{fieldErrors.lastname}</p>
          )}
        </div>
      </div>

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
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="client@vendorvogue.com"
          className={`w-full px-4 py-3 bg-neutral-50 border ${
            fieldErrors.email ? "border-red-500 bg-red-50/20" : "border-neutral-300"
          } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white transition-all`}
        />
        {fieldErrors.email && (
          <p className="text-[10px] font-mono text-red-600 mt-1">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password Grid */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-700"
          >
            PASSWORD <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
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
          {fieldErrors.password ? (
            <p className="text-[10px] font-mono text-red-600 mt-1">{fieldErrors.password}</p>
          ) : (
            <p className="text-[10px] font-mono text-neutral-400 mt-1">
              8-16 chars with 1 uppercase, 1 lowercase, 1 number & 1 special character
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-700"
          >
            CONFIRM PASSWORD <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••••••"
              className={`w-full px-4 py-3 pr-11 bg-neutral-50 border ${
                fieldErrors.confirmPassword ? "border-red-500 bg-red-50/20" : "border-neutral-300"
              } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1 transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-[10px] font-mono text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 px-6 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 text-xs font-bold uppercase tracking-[0.22em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] mt-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>CREATING ACCOUNT...</span>
          </>
        ) : (
          <span>CREATE CLIENT PROFILE</span>
        )}
      </button>

      {/* Switch to Login */}
      <div className="text-center pt-3">
        <p className="text-xs text-neutral-500 font-light">
          Already registered?{" "}
          <Link
            href={`/login${redirectUrl !== "/account" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="font-medium text-black hover:underline uppercase tracking-wider text-[11px]"
          >
            SIGN IN TO YOUR ACCOUNT
          </Link>
        </p>
      </div>
    </form>
  );
}
