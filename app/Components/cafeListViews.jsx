"use client";

import { useState } from "react";
import Image from "next/image";

export default function CafeListView({
  cafes = [],
  accentMap = {},
  defaultAccent,
  onSelect,
}) {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  return (
    <>
      <div className="w-full max-w-3xl mx-auto flex flex-col mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            All Cafes
          </span>
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="text-[11px] font-mono text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1 group cursor-pointer"
          >
            <span>Can&apos;t find your favorite cafe?</span>
            <span className="text-amber-500/90 group-hover:underline font-semibold">
              Submit them →
            </span>
          </button>
        </div>

        {cafes.length === 0 ? (
          <div className="w-full py-10 text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-600">
              No cafes match this filter
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {cafes.map((cafe, idx) => {
              const accent = accentMap[cafe.accent] || defaultAccent;
              return (
                <CafeRow
                  key={cafe.id}
                  rank={idx + 1}
                  cafe={cafe}
                  accent={accent}
                  onClick={() => onSelect && onSelect(cafe)}
                />
              );
            })}
          </div>
        )}
      </div>

      {isSubmitModalOpen && (
        <SubmitCafeModal onClose={() => setIsSubmitModalOpen(false)} />
      )}
    </>
  );
}

function SubmitCafeModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    instagram: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const endpoint = `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishments/listing/request`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          description: formData.instagram ? `Instagram: ${formData.instagram}` : "",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 text-sm font-mono cursor-pointer"
        >
          ✕
        </button>

        <h3 className="text-base font-bold text-neutral-100">
          Suggest a Cafe
        </h3>
        <p className="text-xs text-neutral-400 mt-1 mb-5">
          Know a great spot we missed? Drop the details below and we will check it out.
        </p>

        {status === "success" ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-amber-400">
              Thanks for the recommendation!
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Closing window...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {status === "error" && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2 rounded">
                Could not send request. Please try again.
              </p>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Cafe Name <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="e.g. Blue Bottle Coffee"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Location / Neighborhood <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="e.g. BKK, TTP, TK, IFL"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Cafe Instagram Handle
              </label>
              <input
                type="text"
                disabled={loading}
                placeholder="@cafename"
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-2 rounded-md text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                {loading ? "Sending..." : "Submit Cafe"}
              </button>
            </div>
          </form>
        )}
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
      <div className="hidden sm:flex items-start pt-1 shrink-0">
        <span className="w-6 h-6 flex items-center justify-center rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-500">
          {rank}
        </span>
      </div>

      <div className="shrink-0">
        <Image
          src={cafe.logo_url}
          alt={cafe.name}
          width={88}
          height={88}
          className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-lg object-cover border border-neutral-800"
        />
      </div>

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
  const rounded = Math.round(value * 2) / 2;
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