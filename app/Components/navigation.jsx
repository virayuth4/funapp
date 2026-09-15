"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  // Normalize the path by removing trailing slashes (e.g., "//" or "/en/")
  const normalizedPath = pathname?.replace(/\/$/, "") || "/";
  
  if (normalizedPath === "/happy-potato") return null;

  const isHome = normalizedPath === "/";

  return (
    <nav className="fixed top-0 left-0 z-50 w-full max-w-full">
      <div className="flex items-center justify-between p-4 md:px-24">
        <Link
          href="/"
          className={`flex items-center gap-2 text-sm font-bold tracking-wide transition-colors ${
            isHome
              ? "text-white hover:text-amber-400"
              : "text-neutral-900 hover:text-amber-500"
          }`}
        >
          <span>Eat Doko (Next)?</span>
        </Link>
      </div>
    </nav>
  );
}