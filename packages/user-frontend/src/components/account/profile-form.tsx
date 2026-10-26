"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Loader2, Lock, ArrowRight, UserCheck } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { updateProfileSchema } from "@e-com/shared/schemas";

export function ProfileForm() {
  const { user, updateProfile } = useAuthStore();

  const [firstname, setFirstname] = React.useState(user?.firstname || "");
  const [lastname, setLastname] = React.useState(user?.lastname || "");
  const [phone, setPhone] = React.useState(user?.phone || "");

  const [fieldErrors, setFieldErrors] = React.useState<{ firstname?: string; lastname?: string; phone?: string }>({});
  const [statusMessage, setStatusMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state if user profile changes
  React.useEffect(() => {
    if (user) {
      setFirstname(user.firstname || "");
      setLastname(user.lastname || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setFieldErrors({});

    const payload = {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      phone: phone.trim() ? phone.trim() : undefined,
    };

    // Validate with shared schema
    const validation = updateProfileSchema.shape.body.safeParse(payload);
    if (!validation.success) {
      const errors: { firstname?: string; lastname?: string; phone?: string } = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as "firstname" | "lastname" | "phone";
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile(validation.data);
      setStatusMessage({
        type: "success",
        text: "Profile updated successfully.",
      });
      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.data?.message || err?.message || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white border border-neutral-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-10 max-w-2xl">
      <div className="pb-6 mb-8 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-400">
            CLIENT CREDENTIALS
          </span>
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-[0.1em] text-black mt-1">
            PERSONAL INFORMATION
          </h2>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-200/60 text-[10px] font-mono uppercase tracking-wider text-neutral-700 self-start sm:self-auto">
          <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
          <span>PROFILE ACTIVE</span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 mb-6 flex items-start gap-3 border text-xs font-mono animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label
              htmlFor="firstname"
              className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700 font-medium"
            >
              FIRST NAME <span className="text-rose-500">*</span>
            </label>
            <input
              id="firstname"
              type="text"
              value={firstname}
              onChange={(e) => {
                setFirstname(e.target.value);
                if (fieldErrors.firstname) setFieldErrors((p) => ({ ...p, firstname: undefined }));
              }}
              className={`w-full px-4 py-3 bg-neutral-50/70 border ${
                fieldErrors.firstname
                  ? "border-rose-500 bg-rose-50/20"
                  : "border-neutral-300 hover:border-neutral-400"
              } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all rounded-none`}
            />
            {fieldErrors.firstname && (
              <p className="text-[10px] font-mono text-rose-600 mt-1">{fieldErrors.firstname}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lastname"
              className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700 font-medium"
            >
              LAST NAME <span className="text-rose-500">*</span>
            </label>
            <input
              id="lastname"
              type="text"
              value={lastname}
              onChange={(e) => {
                setLastname(e.target.value);
                if (fieldErrors.lastname) setFieldErrors((p) => ({ ...p, lastname: undefined }));
              }}
              className={`w-full px-4 py-3 bg-neutral-50/70 border ${
                fieldErrors.lastname
                  ? "border-rose-500 bg-rose-50/20"
                  : "border-neutral-300 hover:border-neutral-400"
              } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all rounded-none`}
            />
            {fieldErrors.lastname && (
              <p className="text-[10px] font-mono text-rose-600 mt-1">{fieldErrors.lastname}</p>
            )}
          </div>
        </div>

        {/* Read-Only Email with security badge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="email"
              className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700 font-medium"
            >
              EMAIL ADDRESS
            </label>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              <span>PRIMARY ID</span>
            </span>
          </div>
          <div className="relative">
            <input
              id="email"
              type="email"
              disabled
              value={user.email}
              className="w-full px-4 py-3 bg-neutral-100/60 border border-neutral-200 text-neutral-500 text-sm cursor-not-allowed select-none rounded-none"
            />
          </div>
          <p className="text-[10px] font-mono text-neutral-400">
            Account email is linked to your security credentials and order confirmations.
          </p>
        </div>

        {/* Phone Input */}
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700 font-medium"
          >
            CONTACT PHONE
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
            }}
            placeholder="9876543210"
            className={`w-full px-4 py-3 bg-neutral-50/70 border ${
              fieldErrors.phone
                ? "border-rose-500 bg-rose-50/20"
                : "border-neutral-300 hover:border-neutral-400"
            } text-neutral-900 text-sm focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all rounded-none`}
          />
          {fieldErrors.phone ? (
            <p className="text-[10px] font-mono text-rose-600 mt-1">{fieldErrors.phone}</p>
          ) : (
            <p className="text-[10px] font-mono text-neutral-400">
              Used for delivery dispatch notifications and courier tracking updates.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-neutral-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 text-xs font-bold uppercase tracking-[0.22em] transition-all flex items-center gap-2.5 cursor-pointer shadow-xs active:scale-[0.99] group"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SAVING...</span>
              </>
            ) : (
              <>
                <span>SAVE CHANGES</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
