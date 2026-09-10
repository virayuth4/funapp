"use client";

import Link from "next/link";
import { Coffee, Dice1Icon, Shuffle, Utensils } from "lucide-react";

export default function Navigation() {
  return (
    <nav className="w-full max-w-full mb-8">
      <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md shadow-lg">
        
        {/* Logo / Home */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-wide text-white hover:text-amber-400 transition-colors"
        >
          <Shuffle size={16} />
          <span>Eat Doko (Next)?</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Dice1Icon size={14} />
            <span>Random Pick</span>
          </Link>
        
        <Link
            href="/cafe"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Coffee size={14} />
            <span>Cafe</span>
          </Link>

            <Link
            href="/restaurants"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Utensils size={14} />
            <span>Restaurants</span>
          </Link>
          
          

        
        </div>
      </div>
    </nav>
  );
}