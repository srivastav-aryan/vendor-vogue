"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Globe, Instagram, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

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
      className="w-full bg-[#080808] text-white pt-16 sm:pt-20 pb-6 border-t border-neutral-900 select-none overflow-hidden"
    >
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. TOP NEWSLETTER & VIP SYNDICATE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-16 border-b border-neutral-800/80">
          {/* Newsletter Box */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-block">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                Exclusive Dispatch
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white leading-tight">
              JOIN THE SYNDICATE
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg leading-relaxed">
              Unlock private archive drops, secret collection launches, and priority access to limited seasonal runs.
            </p>

            <form onSubmit={handleSubscribe} className="pt-2 max-w-md">
              {isSubscribed ? (
                <div className="flex items-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>You are on the private access list.</span>
                </div>
              ) : (
                <div className="flex items-center border-b border-neutral-700 focus-within:border-white transition-colors py-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER YOUR EMAIL ADDRESS"
                    className="w-full bg-transparent text-xs font-medium uppercase tracking-wider text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 text-xs font-bold uppercase tracking-widest text-neutral-300 hover:text-white transition-colors px-2 py-1 flex items-center gap-1"
                  >
                    JOIN
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Core Pillars / Brand Promises */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 lg:pt-4">
            <div className="space-y-1.5 border-l border-neutral-800 pl-4">
              <span className="text-[10px] font-mono text-neutral-400">01 / DISPATCH</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Express Delivery</h4>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Complimentary insured delivery on orders over ₹2,499 across India.
              </p>
            </div>

            <div className="space-y-1.5 border-l border-neutral-800 pl-4">
              <span className="text-[10px] font-mono text-neutral-400">02 / TEXTILES</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Heavyweight Knits</h4>
              <p className="text-[11px] text-neutral-400 leading-normal">
                240 to 450 GSM pure combed cotton pre-shrunk for authentic drape.
              </p>
            </div>

            <div className="space-y-1.5 border-l border-neutral-800 pl-4">
              <span className="text-[10px] font-mono text-neutral-400">03 / RETURNS</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">7-Day Guarantee</h4>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Hassle-free doorstep pickup for exchanges and size adjustments.
              </p>
            </div>
          </div>
        </div>

        {/* 2. MIDDLE NAVIGATION COLUMNS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 py-14 border-b border-neutral-800/80 text-left">
          {/* Column 1: Shop */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
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
              <li>
                <Link href="/catalog/men-t-shirts" className="hover:text-white transition-colors">
                  Heavyweight Tees
                </Link>
              </li>
              <li>
                <Link href="/catalog/men-hoodies" className="hover:text-white transition-colors">
                  Hoodies & Knits
                </Link>
              </li>
              <li>
                <Link href="/catalog/men-jeans" className="hover:text-white transition-colors">
                  Vintage Denim
                </Link>
              </li>
              <li>
                <Link href="/catalog/women" className="hover:text-white transition-colors">
                  Womenswear
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Client Care */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">
              Client Care
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  Track Consignment
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping & Timelines
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Exchange & Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-white transition-colors">
                  Streetwear Size Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Help Center / FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Concierge
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: The House */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">
              The House
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Manifesto & Philosophy
                </Link>
              </li>
              <li>
                <Link href="/sustainability" className="hover:text-white transition-colors">
                  Ethical Sourcing & Mills
                </Link>
              </li>
              <li>
                <Link href="/lookbook" className="hover:text-white transition-colors">
                  Seasonal Lookbooks
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-white transition-colors">
                  Flagship Spaces
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-white transition-colors">
                  Press Inquiries
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">
              Compliance
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal-metrology" className="hover:text-white transition-colors">
                  Legal Metrology Declarations
                </Link>
              </li>
              <li className="text-[11px] text-neutral-500 pt-1 font-mono">
                GSTIN: 27AABCU9603R1ZM
              </li>
              <li className="text-[11px] text-neutral-500 font-mono">
                CIN: U74999MH2026PTC109923
              </li>
            </ul>
          </div>
        </div>

        {/* 3. UTILITIES, TRUST & PAYMENT METHODS */}
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
          {/* Country / Currency */}
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-300">India</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-400">INR (₹)</span>
          </div>

          {/* Payment Badges Text */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider">
            <span className="px-2 py-0.5 rounded-xs border border-neutral-800 bg-neutral-900/60">UPI</span>
            <span className="px-2 py-0.5 rounded-xs border border-neutral-800 bg-neutral-900/60">VISA</span>
            <span className="px-2 py-0.5 rounded-xs border border-neutral-800 bg-neutral-900/60">MASTERCARD</span>
            <span className="px-2 py-0.5 rounded-xs border border-neutral-800 bg-neutral-900/60">RUPAY</span>
            <span className="px-2 py-0.5 rounded-xs border border-neutral-800 bg-neutral-900/60">RAZORPAY</span>
            <span className="px-2 py-0.5 rounded-xs border border-neutral-800 bg-neutral-900/60">SNAPMINT</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 text-neutral-400">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Vendor Vogue Instagram"
              className="hover:text-white transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Vendor Vogue Twitter"
              className="hover:text-white transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <span className="text-[11px] font-mono text-neutral-400">
              © 2026 VENDOR VOGUE STUDIOS
            </span>
          </div>
        </div>

        {/* 4. GRAND EDITORIAL WORDMARK (The Brand in Big) */}
        <div className="pt-6 sm:pt-10 overflow-hidden">
          <div
            className="w-full text-center text-[13.5vw] font-black uppercase tracking-tighter leading-none select-none text-neutral-800/70 hover:text-white transition-colors duration-700 cursor-default"
            aria-hidden="true"
          >
            VENDOR VOGUE
          </div>
        </div>
      </div>
    </footer>
  );
}
