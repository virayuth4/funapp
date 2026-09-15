  "use client";

  import Link from "next/link";
  import { Coffee, Dice1Icon, Shuffle, Utensils } from "lucide-react";
  import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  if (pathname === "/happy-potato") return null;

  const isHome = pathname === "/";

  return (
    <nav
      className={`w-full max-w-full ${
        isHome ? "bg-[#0d0f12]" : "bg-white"
      }`}
    >
      <div
        className={`flex items-center justify-between p-4 md:px-24 border shadow-lg ${
          isHome
            ? "border-neutral-800/80 bg-[#0d0f12]"
            : "border-neutral-200 bg-white"
        }`}
      >
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