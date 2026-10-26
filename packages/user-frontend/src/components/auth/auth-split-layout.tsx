import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
  editorialQuote?: string;
  editorialSub?: string;
  imageSrc?: string;
}

export function AuthSplitLayout({
  children,
  heading,
  subheading,
  editorialQuote = "“Elegance is refusal. Modern architectural minimalism tailored for the contemporary wardrobe.”",
  editorialSub = "AUTUMN / WINTER 2026 EDITORIAL",
  imageSrc = "/images/authimg.jpg",
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080808] text-white">
      {/* Visual Editorial Panel (Desktop only) */}
      <div className="relative hidden lg:flex lg:w-1/2 min-h-screen flex-col justify-end p-12 xl:p-16 overflow-hidden bg-neutral-900 border-r border-white/[0.08]">
        {/* Optimized Editorial Image - Pure, vibrant, un-darkened */}
        <div className="absolute inset-0 z-0">
          <Image
            src={imageSrc}
            alt="Vendor Vogue Editorial"
            fill
            priority
            quality={90}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center scale-100 transition-transform duration-1000 ease-out hover:scale-105"
          />
          {/* Subtle bottom-focused gradient overlay to keep text legible while preserving full natural photo colors */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
        </div>

        {/* Bottom Editorial Text */}
        <div className="relative z-10 max-w-lg space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/70">
            {editorialSub}
          </p>
          <blockquote className="text-xl xl:text-2xl font-light tracking-wide text-white leading-relaxed font-sans drop-shadow-sm">
            {editorialQuote}
          </blockquote>
          <div className="pt-2 flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.25em] text-white/70">
            <span>COLLECTION ARCHIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <span>MUMBAI STUDIO</span>
          </div>
        </div>
      </div>

      {/* Interactive Form Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 md:p-16 lg:p-16 xl:p-24 bg-white text-neutral-900">
        {/* Top Bar */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO STORE</span>
          </Link>

          <Link
            href="/"
            className="lg:hidden text-xs font-bold uppercase tracking-[0.22em] text-black"
          >
            VENDOR VOGUE
          </Link>
        </div>

        {/* Centered Form Body */}
        <div className="w-full max-w-md mx-auto py-10 sm:py-14">
          <div className="mb-8 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400">
              AUTHENTICATION
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.1em] text-neutral-950 font-sans">
              {heading}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
              {subheading}
            </p>
          </div>

          {children}
        </div>

        {/* Footer info */}
        <div className="w-full max-w-md mx-auto pt-6 border-t border-neutral-100 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
          <span>SECURE HTTPS ENCRYPTION</span>
          <span>© 2026 VENDOR VOGUE</span>
        </div>
      </div>
    </div>
  );
}
