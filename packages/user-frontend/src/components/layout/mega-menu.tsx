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
        "absolute left-0 right-0 top-full w-full bg-white text-neutral-900 border-b border-neutral-200/90 shadow-2xl z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-1"
      )}
    >
      {/* Invisible hover bridge */}
      <div className="absolute -top-3 left-0 w-full h-3 bg-transparent pointer-events-auto" />

      <div className="w-full px-8 md:px-14 lg:px-20 py-10">
        <div className="grid grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Bold Editorial Highlights */}
          <div className="col-span-12 lg:col-span-4 flex flex-col space-y-4 lg:border-r border-neutral-200/80 pr-6 lg:pr-10">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400">
              FEATURED
            </span>
            {EDITORIAL_QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                className="group inline-flex items-center gap-3 text-2xl xl:text-3xl font-extrabold tracking-tight font-display hover:text-neutral-500 transition-colors"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-xs bg-black text-white self-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Side: Dynamic Backend Category Sections */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-10">
            {sections.map((section) => (
              <div key={section.name} className="space-y-3">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-400">
                  {section.name}
                </h4>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="group inline-flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-700 hover:text-black font-medium transition-colors"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-xs bg-neutral-100 text-neutral-800 border border-neutral-200">
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
