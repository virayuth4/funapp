"use client";

import Image from "next/image";

/**
 * CafeListView
 * A vertically-stacked list of cafes, one full-width row per cafe —
 * styled to sit naturally under the "Recent Spins" panel on the home page.
 *
 * Data contract: only `name`, `branch_location`, `logo_url`, `category`,
 * and `accent` are required (matches the current CAFES shape). Everything
 * else below is optional and simply won't render if absent:
 *   - description   (string)
 *   - rating         (number, 0–5)
 *   - review_count   (number)
 *   - price_range    (string, e.g. "$8 - $15")
 *   - tags           (string[])
 *
 * Props:
 *   cafes         — array of cafe objects (pass `availableCafes`)
 *   accentMap     — ACCENT_MAP from the parent, keyed by accent name
 *   defaultAccent — fallback accent object
 *   onSelect      — (cafe) => void, called when a row is clicked
 *                    (wire this to your existing openCafeModal)
 */
export default function CafeListView({
  cafes = [],
  accentMap = {},
  defaultAccent,
  onSelect,
}) {
  if (cafes.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto py-10 text-center">
        <p className="text-xs font-mono uppercase tracking-wider text-neutral-600">
          No cafes match this filter
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
          All Cafes
        </span>
        <span className="text-[10px] font-mono text-neutral-600">
          {cafes.length} total
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {cafes.map((cafe, idx) => {
          const accent = accentMap[cafe.accent] || defaultAccent;
          return (
            <CafeRow
              key={cafe.id}
              rank={idx + 1}
              cafe={cafe}
              accent={accent}
              onClick={() => onSelect?.(cafe)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CafeRow({ rank, cafe, accent, onClick }) {
  const hasRating = typeof cafe.rating === "number";
  const hasTags = Array.isArray(cafe.tags) && cafe.tags.length > 0;

  return (
    <button
      onClick={onClick}
      style={{ borderLeftColor: accent?.color }}
      className="group w-full text-left flex gap-4 p-3 rounded-md bg-neutral-900/60 border border-neutral-800/80 border-l-4 hover:bg-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer"
    >
      {/* Rank */}
      <div className="hidden sm:flex items-start pt-1 shrink-0">
        <span className="w-6 h-6 flex items-center justify-center rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-500">
          {rank}
        </span>
      </div>

      {/* Photo */}
      <div className="shrink-0">
        <Image
          src={cafe.logo_url}
          alt={cafe.name}
          width={88}
          height={88}
          className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-lg object-cover border border-neutral-800"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-neutral-100 truncate group-hover:text-amber-400 transition-colors">
            {cafe.name}
          </h3>
          <span
            className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
            style={{ color: accent?.color, borderColor: `${accent?.color}40` }}
          >
            {accent?.name}
          </span>
        </div>

        <p className="text-[11px] text-neutral-500 truncate">
          {cafe.branch_location}
          {cafe.category ? ` · ${cafe.category}` : ""}
        </p>

        {cafe.description && (
          <p className="text-[11px] text-neutral-400 line-clamp-2">
            {cafe.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-0.5">
          {hasRating && (
            <div className="flex items-center gap-1">
              <Stars value={cafe.rating} />
              <span className="text-[11px] font-semibold text-neutral-300">
                {cafe.rating.toFixed(2)}
              </span>
              {typeof cafe.review_count === "number" && (
                <span className="text-[10px] text-neutral-600">
                  ({cafe.review_count})
                </span>
              )}
            </div>
          )}

          {cafe.price_range && (
            <span className="text-[11px] text-neutral-400">
              {cafe.price_range}
            </span>
          )}
        </div>

        {hasTags && (
          <div className="flex flex-wrap gap-1 mt-1">
            {cafe.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="text-[9px] text-neutral-500 border border-neutral-800 rounded px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center pl-1 shrink-0">
        <span className="text-neutral-600 group-hover:text-amber-400 text-sm transition-colors">
          →
        </span>
      </div>
    </button>
  );
}

function Stars({ value }) {
  const rounded = Math.round(value * 2) / 2; // nearest half
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= rounded;
        const half = !filled && i + 0.5 === rounded;
        return (
          <svg
            key={i}
            width="11"
            height="11"
            viewBox="0 0 20 20"
            className="mr-[1px]"
          >
            <defs>
              <linearGradient id={`half-${i}`}>
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#3f3f46" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1 5.9L10 14.8l-5.2 2.8 1-5.9L1.5 7.6l5.9-.7L10 1.5z"
              fill={half ? `url(#half-${i})` : filled ? "#fbbf24" : "#3f3f46"}
            />
          </svg>
        );
      })}
    </div>
  );
}