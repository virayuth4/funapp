"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Equal } from "lucide-react";

function normalizePath(pathname) {
  return pathname?.replace(/\/$/, "") || "/";
}

export default function Navigation() {
  const pathname = usePathname();
  const normalizedPath = normalizePath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  if (normalizedPath === "/happy-potato") return null;

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 w-full max-w-full">
        <div className="flex items-center justify-between p-4 md:px-24">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold tracking-wide transition-colors text-amber-500 hover:text-amber-600"
          >
            <span>Eat Doko (Next)?</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/how-we-pick"
              className="text-sm font-medium tracking-wide transition-colors text-amber-500 hover:text-amber-600"
            >
              How we pick
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex items-center justify-center text-amber-500 hover:text-amber-600 transition-colors md:hidden"
            >
              <Equal size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Modal overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
             className="relative w-[85%] max-w-xs rounded-2xl bg-white/20  border border-white/30 p-8 shadow-xl"

            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-6 pt-4">
              <Link
                href="/explore"
                onClick={() => setMenuOpen(false)}
                className="text-lg font-semibold tracking-wide text-white hover:text-amber-600 transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/partner"
                onClick={() => setMenuOpen(false)}
                className="text-lg font-semibold tracking-wide text-white hover:text-amber-600 transition-colors"
              >
                Partner
              </Link>

               <Link
                href="/about"
                onClick={() => setMenuOpen(false)}
                className="text-lg font-semibold tracking-wide text-white hover:text-amber-600 transition-colors"
              >
                About 
              </Link>
               <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="text-lg font-semibold tracking-wide text-white hover:text-amber-600 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}