"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function normalizePath(pathname) {
  return pathname?.replace(/\/$/, "") || "/";
}

export default function Navigation() {
  const pathname = usePathname();
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === "/happy-potato") return null;

  return (
    <nav className="fixed top-0 left-0 z-50 w-full max-w-full">
      <div className="flex items-center justify-between p-4 md:px-24">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-wide transition-colors text-amber-500 hover:text-amber-600"
        >
          <span>Eat Doko (Next)?</span>
        </Link>

        <Link
          href="/how-we-pick"
          className="text-sm font-medium tracking-wide transition-colors text-amber-500 hover:text-amber-600"
        >
          How we pick
        </Link>
      </div>
    </nav>
  );
}

