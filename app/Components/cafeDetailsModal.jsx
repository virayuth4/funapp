"use client";

import Image from "next/image";

export default function CafeDetailModal({
  isOpen,
  onClose,
  onBack,           // optional — shows a "← Back" button (used for the sponsor modal)
  cafe,             // the cafe or sponsor data object
  variant = "cafe", // "cafe" | "sponsor"
  accentColor,      // optional override; falls back to cafe.reelAccent.color, then amber
  onExclude,        // "cafe" variant only
  onSpinAgain,      // "cafe" variant only
  zIndex = 50,
  footer,           // optional extra content rendered below the actions (e.g. sponsor teaser)
}) {
  if (!isOpen || !cafe) return null;

  const isSponsor = variant === "sponsor";
  const color = accentColor || cafe.reelAccent?.color || "#fbbf24";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      style={{ zIndex }}
    >
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Accent top strip */}
        <div
          className="h-1.5 w-full rounded-t -mt-6 -mx-6 mb-6"
          style={{ backgroundColor: color }}
        />

        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-1 text-neutral-400 hover:text-white text-xs font-semibold cursor-pointer"
            aria-label="Back"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white text-sm cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Identity */}
        <div className={`flex items-center gap-4 ${onBack ? "mt-4" : ""}`}>
          <Image
            src={cafe.logo_url}
            alt={cafe.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-lg object-cover border border-neutral-700/60 shadow-md"
          />
          <div className="min-w-0 flex-1">
            <span
              className="text-[10px] font-mono uppercase font-bold tracking-widest"
              style={{ color }}
            >
              {isSponsor ? "Partner" : "Selected Cafe"}
            </span>
            <h2 className="text-lg font-extrabold text-white truncate">
              {cafe.name}
            </h2>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300">
              {cafe.branch_location}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          <a
            href={cafe.map}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-bold transition-colors ${
              isSponsor
                ? "bg-amber-500 hover:bg-amber-400 text-black"
                : "bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold"
            }`}
          >
            <span>📍View on Google Maps ↗</span>
          </a>

          {!isSponsor && (
            <div className="flex gap-2">
              <button
                onClick={onExclude}
                className="flex-1 py-2 rounded bg-red-950/40 border border-red-900 hover:bg-red-900/60 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Exclude Cafe
              </button>
              <button
                onClick={onSpinAgain}
                className="flex-1 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer"
              >
                Spin Again
              </button>
            </div>
          )}
        </div>

        {footer}
      </div>
    </div>
  );
}