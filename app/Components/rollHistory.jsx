"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";

export default function RollHistory({
  localHistory = [],
  onOpenEntry,
  onToggleVisited,
  onClearHistory,
}) {
  const [activeTab, setActiveTab] = useState("mine");
  const [globalHistory, setGlobalHistory] = useState([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const hasFetchedGlobal = useRef(false);

  const fetchGlobalHistory = useCallback(async (force = false) => {
    if (hasFetchedGlobal.current && !force) return;

    setIsLoadingGlobal(true);
    setGlobalError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/history/all`
      );

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const json = await res.json();

      const rawRows = Array.isArray(json.entries)
        ? json.entries
        : Array.isArray(json.entry)
        ? json.entry
        : json.entry
        ? [json.entry]
        : [];

      const normalized = rawRows.map((row) => ({
        id: row.shop_id ?? row.id,
        historyId: row.id,
        name: row.name,
        branch_location: row.branch_location,
        logo_url: row.logo_url,
        accentColor: row.accent_color,
        visited: !!row.visited,
        timestamp: row.created_at
          ? new Date(row.created_at).getTime()
          : Date.now(),
        userId: row.user_id,
      }));

      setGlobalHistory(normalized);
      hasFetchedGlobal.current = true;
    } catch (err) {
      console.error("Failed to fetch global history:", err);
      setGlobalError("Couldn't load global history right now.");
    } finally {
      setIsLoadingGlobal(false);
    }
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);

    if (tab === "global") {
      fetchGlobalHistory();
    }
  };

  const isGlobalTab = activeTab === "global";
  const entries = isGlobalTab ? globalHistory : localHistory;

  return (
    <div className="mt-6 w-[384px] max-w-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 p-0.5 rounded bg-neutral-900/60 border border-neutral-800/70">
          <button
            onClick={() => handleTabClick("mine")}
            className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "mine"
                ? "bg-amber-500 text-black"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            My Spins
          </button>

          <button
            onClick={() => handleTabClick("global")}
            className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "global"
                ? "bg-amber-500 text-black"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Global
          </button>
        </div>

        {isGlobalTab ? (
          <button
            onClick={() => fetchGlobalHistory(true)}
            disabled={isLoadingGlobal}
            className="text-[10px] text-neutral-500 hover:text-amber-400 underline cursor-pointer disabled:opacity-40"
          >
            Refresh
          </button>
        ) : (
          localHistory.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[10px] text-neutral-500 hover:text-amber-400 underline cursor-pointer"
            >
              Clear
            </button>
          )
        )}
      </div>

      {/* Global loading */}
      {isGlobalTab && isLoadingGlobal && (
        <div className="text-center text-[11px] text-neutral-500 py-4">
          Loading global spins...
        </div>
      )}

      {/* Global error */}
      {isGlobalTab && !isLoadingGlobal && globalError && (
        <div className="text-center text-[11px] text-red-400 py-4 flex flex-col items-center gap-1">
          <span>{globalError}</span>

          <button
            onClick={() => fetchGlobalHistory(true)}
            className="text-amber-500 underline hover:text-amber-400 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty global */}
      {isGlobalTab &&
        !isLoadingGlobal &&
        !globalError &&
        globalHistory.length === 0 && (
          <div className="text-center text-[11px] text-neutral-500 py-4">
            No global spins yet.
          </div>
        )}

      {/* Empty mine */}
      {!isGlobalTab && localHistory.length === 0 && (
        <div className="text-center text-[11px] text-neutral-500 py-4">
          You haven&apos;t spun yet.
        </div>
      )}

      {/* History list */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
          {entries.map((entry, idx) => (
            <div
              key={`${activeTab}-${entry.id}-${entry.timestamp}-${idx}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-neutral-900/60 border border-neutral-800/70 text-xs w-full hover:bg-neutral-900 hover:border-neutral-700 transition-colors"
            >
              {/* Main entry */}
              <button
                onClick={() => onOpenEntry?.(entry)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
              >
                <Image
                  src={entry.logo_url}
                  alt={entry.name}
                  width={64}
                  height={64}
                  className="w-10 h-10 rounded-lg object-cover border border-neutral-700/60 shadow-md shrink-0"
                />

                {/* Name */}
                <span className="truncate text-neutral-200 min-w-0 flex-1">
                  {entry.name}
                </span>

                {/* Branch */}
                <span
                  className="text-[9px] font-mono uppercase px-1 rounded shrink-0"
                  style={{ color: entry.accentColor }}
                >
                  {entry.branch_location}
                </span>
              </button>

              {/* Right side */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Time */}
                <span className="text-[9px] font-mono text-neutral-600">
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {/* Visit button */}
                {!isGlobalTab && (
                  <button
                    onClick={() => onToggleVisited?.(entry.timestamp)}
                    className={`text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded border transition-colors cursor-pointer whitespace-nowrap ${
                      entry.visited
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-amber-400 hover:border-amber-500/50"
                    }`}
                  >
                    {entry.visited ? "✓ Visited" : "Visit"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}       