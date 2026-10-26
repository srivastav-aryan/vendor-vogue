import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an exclusive Vendor Vogue client account for seamless checkout, order tracking, and private drops.",
};

function RegisterFormFallback() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-neutral-100 rounded-none w-full" />
        <div className="h-12 bg-neutral-100 rounded-none w-full" />
      </div>
      <div className="h-12 bg-neutral-100 rounded-none w-full" />
      <div className="h-12 bg-neutral-100 rounded-none w-full" />
      <div className="h-12 bg-neutral-200 rounded-none w-full" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      heading="CREATE ACCOUNT"
      subheading="Register for an exclusive client account to access private releases, priority courier shipping, and address management."
      editorialQuote="“Design is not just what it looks like and feels like. Design is how it works.”"
      editorialSub="EXCLUSIVE MEMBERSHIP / FW26"
      imageSrc="/images/authimg.jpg"
    >
      <Suspense fallback={<RegisterFormFallback />}>
        <RegisterForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
