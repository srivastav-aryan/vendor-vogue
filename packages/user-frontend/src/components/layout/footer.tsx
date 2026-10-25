"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Instagram, Twitter } from "lucide-react";

export function Footer() {
  const [email, setEmail] = React.useState("");
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      className="w-full bg-black text-white pt-12 sm:pt-16 pb-6 border-t border-neutral-900 select-none overflow-hidden"
    >
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* TOP: MINIMALIST NEWSLETTER & ESSENTIAL NAV */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-12 border-b border-neutral-900">
          {/* Newsletter Box */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
              STAY INFORMED
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              Subscribe for private access to limited drops, archive pieces, and seasonal releases.
            </p>

            <form onSubmit={handleSubscribe} className="pt-2 max-w-md">
              {isSubscribed ? (
                <div className="flex items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Subscribed to dispatch list</span>
                </div>
              ) : (
                <div className="flex items-center border-b border-neutral-800 focus-within:border-white transition-colors py-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER YOUR EMAIL"
                    className="w-full bg-transparent text-xs font-medium uppercase tracking-wider text-white placeholder:text-neutral-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors px-2 py-1 flex items-center gap-1"
                  >
                    JOIN
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Clean Essential Links */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-6 sm:gap-10 text-xs">
            {/* Column 1: Shop */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-[0.2em] text-white">
                Shop
              </h4>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <Link href="/catalog" className="hover:text-white transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/catalog?filter=bestsellers" className="hover:text-white transition-colors">
                    Bestsellers
                  </Link>
                </li>
                <li>
                  <Link href="/catalog?sort=newest" className="hover:text-white transition-colors">
                    New Arrivals
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Assistance */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-[0.2em] text-white">
                Assistance
              </h4>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <Link href="/track-order" className="hover:text-white transition-colors">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-policy" className="hover:text-white transition-colors">
                    Shipping & Returns
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal & Social */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-[0.2em] text-white">
                Legal
              </h4>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms & Privacy
                  </Link>
                </li>
                <li className="pt-2 flex items-center gap-3 text-neutral-400">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="hover:text-white transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Twitter / X"
                    className="hover:text-white transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM METADATA BAR */}
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-neutral-500">
          <div>© {new Date().getFullYear()} VENDOR VOGUE. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-3">
            <span>IN / INR (₹)</span>
            <span>•</span>
            <span>WORLDWIDE DISPATCH</span>
          </div>
        </div>

        {/* OVERSIZED BRAND WORDMARK (Single Line, Never Stacked) */}
        <div className="pt-4 sm:pt-6 overflow-hidden flex justify-center items-center">
          <h2
            className="w-full text-center font-black uppercase tracking-tighter leading-none whitespace-nowrap select-none text-neutral-800/80 hover:text-white transition-colors duration-500 cursor-default text-[10vw]"
            aria-hidden="true"
          >
            VENDOR VOGUE
          </h2>
        </div>
      </div>
    </footer>
  );
}
