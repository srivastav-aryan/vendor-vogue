import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Client Sign In",
  description: "Sign in to your Vendor Vogue client account to access orders and saved addresses.",
};

function LoginFormFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-neutral-100 rounded-none w-full" />
      <div className="h-12 bg-neutral-100 rounded-none w-full" />
      <div className="h-12 bg-neutral-200 rounded-none w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthSplitLayout
      heading="CLIENT SIGN IN"
      subheading="Sign in with your email and password to manage your curated wardrobe, active orders, and shipping book."
      editorialQuote="“Simplicity is the ultimate sophistication. Tailoring form, structure, and material into timeless expressions.”"
      editorialSub="MEMBER PORTAL / AUTUMN 2026"
      imageSrc="/images/authimg.jpg"
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
