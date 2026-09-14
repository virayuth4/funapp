"use client";

import Link from "next/link";
import { Coffee, Dice1Icon, Shuffle, Utensils } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (pathname === '/happy-potato') return null
 
  return (
    <nav className="w-full max-w-full ">
      <div
        className={`flex items-center justify-between p-4 md:px-24 border shadow-lg ${
          isHome
            ? "border-neutral-800/80 bg-[#0d0f12]"
            : "border-neutral-200 bg-white"
        }`}
      >
        
        {/* Logo / Home */}
        <Link
          href="/"
          className={`flex items-center gap-2 text-sm font-bold tracking-wide transition-colors ${
            isHome
              ? "text-white hover:text-amber-400"
              : "text-neutral-900 hover:text-amber-500"
          }`}
        >
          <Shuffle size={16} />
          <span>Eat Doko (Next)?</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {/* <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isHome
                ? "text-neutral-300 hover:text-white hover:bg-neutral-800"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Dice1Icon size={14} />
            <span>Random Pick</span>
          </Link> */}

          {/* <Link
            href="/cafe"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isHome
                ? "text-neutral-300 hover:text-white hover:bg-neutral-800"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Coffee size={14} />
            <span>Cafe</span>
          </Link> */}

          {/* <Link
            href="/restaurants"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isHome
                ? "text-neutral-300 hover:text-white hover:bg-neutral-800"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Utensils size={14} />
            <span>Restaurants</span>
          </Link> */}
        </div>
      </div>
    </nav>
  );
}