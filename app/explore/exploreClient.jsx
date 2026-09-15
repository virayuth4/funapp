"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EstablishmentCard from "../Components/establishmentCard";

// Field on each establishment record that distinguishes cafe vs restaurant vs etc.
// Keep this in sync with HomeClient's TYPE_FIELD if your backend uses a different key.
const TYPE_FIELD = "category";

// Every category the UI knows how to render a tab for. Add to this as new
// categories go live on the backend.
const ALL_TYPES = [
  { value: "cafe", label: "Cafes" },
  { value: "restaurants", label: "Restaurants" },
];

// Categories that are actually filterable right now. Everything else in
// ALL_TYPES still shows as a tab, just disabled with a "Soon" badge, so the
// UI is ready to flip on the moment more data/categories are supported.
const ENABLED_TYPES = ["cafe"];

const ACCENT = {
  color: "#f59e0b",
  border: "border-amber-500",
  bg: "from-amber-500/10 to-transparent",
};

export default function ExploreClient({ initialCafes, initialCategories, initialError }) {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState("cafe");

  const cafes = initialCafes || [];
  const error = initialError || null;

  // Build the tab list from ALL_TYPES plus any category coming back from the
  // backend that we don't already know about, so nothing silently disappears.
  const tabs = useMemo(() => {
    const known = new Set(ALL_TYPES.map((t) => t.value));
    const extra = (initialCategories || [])
      .map((c) => String(c || "").toLowerCase())
      .filter((c) => c && !known.has(c));
    return [...ALL_TYPES, ...extra.map((value) => ({ value, label: value }))];
  }, [initialCategories]);

  const filteredCafes = useMemo(() => {
    return cafes.filter(
      (cafe) => String(cafe[TYPE_FIELD] || "").toLowerCase() === selectedType.toLowerCase()
    );
  }, [cafes, selectedType]);

  return (
    <main className="min-h-screen bg-white  text-neutral-100  py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-black     drop-shadow-md">
            Explore
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Browse what local Cambodian actually go to.
          </p>
        </header>

        {/* Category Tabs */}
        {/* <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 mb-8 rounded-lg border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md">
          {tabs.map((tab) => {
            const isEnabled = ENABLED_TYPES.includes(tab.value);
            const isActive = selectedType === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => isEnabled && setSelectedType(tab.value)}
                disabled={!isEnabled}
                className={`relative px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all ${
                  isEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                } ${
                  isActive
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
                {!isEnabled && (
                  <span className="ml-1.5 text-[9px] font-normal normal-case text-neutral-500">
                    (soon)
                  </span>
                )}
              </button>
            );
          })}
        </div> */}

        {/* Error state */}
        {error && (
          <div className="text-center text-xs text-red-400 py-10 flex flex-col items-center gap-2">
            <span>{error}</span>
            <button
              onClick={() => router.refresh()}
              className="text-amber-500 underline hover:text-amber-400 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && filteredCafes.length === 0 && (
          <div className="text-center text-xs text-neutral-500 py-10">
            No {selectedType} found right now.
          </div>
        )}

        {/* Grid */}
        {!error && filteredCafes.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {filteredCafes.map((cafe) => (
              <EstablishmentCard key={cafe.id} cafe={cafe} rank={cafe.rank}/>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

