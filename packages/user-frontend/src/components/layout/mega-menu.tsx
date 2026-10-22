"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MegamenuSection } from "@e-com/shared/types";
import { EDITORIAL_QUICK_LINKS } from "@/lib/constants/navigation";

interface MegaMenuProps {
  isOpen: boolean;
  sections: MegamenuSection[];
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function MegaMenu({
  isOpen,
  sections,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuProps) {
  // Close menu on Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "absolute left-0 right-0 top-full w-full bg-white text-neutral-900 border-b border-neutral-200/90 shadow-2xl z-50 transition-all duration-150 animate-in fade-in slide-in-from-top-1"
      )}
    >
      {/* Invisible hover bridge to eliminate any gap between nav and dropdown */}
      <div className="absolute -top-3 left-0 w-full h-3 bg-transparent pointer-events-auto" />

      <div className="w-full px-8 md:px-14 lg:px-20 py-12">
        <div className="grid grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Bold Editorial Quick Links (Nude Project Style) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col space-y-5 lg:border-r border-neutral-200/80 pr-6 lg:pr-10">
            {EDITORIAL_QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                className="group inline-flex items-center gap-3 text-3xl xl:text-4xl font-extrabold tracking-tight font-display hover:text-neutral-500 transition-colors"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-xs bg-neutral-900 text-white self-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Side: Fully Expanded Dynamic Multi-Columns */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12">
            {sections.map((section) => (
              <div key={section.name} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  {section.name}
                </h4>
                <ul className="space-y-2.5">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="group inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-black font-medium transition-colors"
                      >
                        <span className="group-hover:underline underline-offset-4">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-xs bg-neutral-100 text-neutral-800 border border-neutral-200">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
