"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { convertPriceRange } from "@/lib/priceRange";
import { formatLocation } from "@/lib/formatLocation";

/* ---------- Small icons ---------- */

function ArrowIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7v5l3 3"
      />
    </svg>
  );
}

/* ---------- Rating ---------- */

function BubbleRating({ rating = 0, count = 0 }) {
  if (!rating) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <span className="text-sm font-medium text-white">
        {rating.toFixed(1)}
      </span>

      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - (i - 1)));

          return (
            <div
              key={i}
              className="relative h-3.5 w-3.5 rounded-full border border-emerald-600"
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-full"
                style={{ width: `${fill * 100}%` }}
              >
                <div className="h-3.5 w-3.5 rounded-full bg-emerald-600" />
              </div>
            </div>
          );
        })}
      </div>

      {count > 0 && (
        <span className="text-sm text-gray-600">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

/* ---------- Mobile: swipeable image strip ---------- */

function ImageCarousel({ images, name, rank }) {
  const scrollRef = useRef(null);
  const shown = images.slice(0, 3);

  return (
    <div className="relative w-full sm:hidden">
      <div
        ref={scrollRef}
        className="flex w-full snap-x snap-mandatory gap-0.5"
      >
        {shown.map((src, i) => (
          <div
            key={i}
            className="relative aspect-[4/5] w-1/3 shrink-0 snap-start overflow-hidden bg-gray-100"
          >
            <Image
              src={src}
              alt={`${name} photo ${i + 1}`}
              fill
              sizes="33vw"
              className="object-cover"
              priority={rank === 1 && i === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Desktop: big photo + thumbnail strip ---------- */

function ImageCollage({ images, name, rank }) {
  const count = images.length;
  const thumbs = images.slice(1, 4);

  return (
    <div className="relative hidden h-52 w-72 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:block">
      {count <= 1 ? (
        <div className="relative block h-full w-full">
          <Image
            src={images[0]}
            alt={name}
            fill
            sizes="288px"
            className="object-cover"
            priority={rank === 1}
          />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col gap-1">
          <div className="relative block h-[65%] w-full">
            <Image
              src={images[0]}
              alt={name}
              fill
              sizes="288px"
              className="object-cover"
              priority={rank === 1}
            />
          </div>

          <div
            className={`grid h-[calc(35%-0.25rem)] gap-1 ${
              thumbs.length >= 3
                ? "grid-cols-3"
                : thumbs.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
            }`}
          >
            {thumbs.map((src, i) => (
              <div
                key={i}
                className="relative block overflow-hidden"
              >
                <Image
                  src={src}
                  alt={`${name} photo ${i + 2}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- One establishment row ---------- */

function CafeRow({ rank, cafe, accent, onClick }) {
  const images = cafe.image_paths?.length
    ? cafe.image_paths
    : [cafe.logo_url];

  const hasTags =
    Array.isArray(cafe.tags) && cafe.tags.length > 0;

  const jpy = convertPriceRange(cafe.price_range, "JPY");
  const cny = convertPriceRange(cafe.price_range, "CNY");

  const header = (
    <>
      <div className="flex items-start justify-between gap-2 px-4 sm:px-0">
        <h2 className="text-base font-bold leading-snug text-white sm:text-lg">
          {rank ? `${rank}. ` : ""}
          {cafe.name}
        </h2>

        {accent && (
          <span
            className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              color: accent.color,
              borderColor: `${accent.color}40`,
            }}
          >
            {accent.name}
          </span>
        )}
      </div>

      <div className="mt-1 px-4 sm:px-0">
        <BubbleRating
          rating={cafe.rating}
          count={cafe.review_count}
        />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 px-4 text-xs text-white sm:px-0 sm:text-sm">
        {cafe.category && (
          <span className="capitalize">
            {cafe.category}
          </span>
        )}

        {cafe.branch_location && (
          <>
            <span className="text-gray-300">·</span>

            <span className="truncate">
              {formatLocation(cafe.branch_location)}
            </span>
          </>
        )}

        {cafe.hours_note && (
          <>
            <span className="text-gray-300">·</span>

            <span className="flex items-center gap-1 text-rose-600">
              <ClockIcon className="h-3.5 w-3.5" />
              {cafe.hours_note}
            </span>
          </>
        )}
      </div>

      {cafe.price_range && (
        <div className="mt-1.5 px-4 text-xs text-white sm:px-0">
          <div className="flex flex-wrap items-center gap-x-2">
            <span>USD ${cafe.price_range}</span>

            {cny && (
              <>
                <span className="text-gray-300">|</span>

                <span>
                  CNY ¥{cny.min}-{cny.max}
                </span>
              </>
            )}

            {jpy && (
              <>
                <span className="text-gray-300">|</span>

                <span>
                  JPY ¥{jpy.min}-{jpy.max}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      className="group flex cursor-pointer flex-col gap-3 border-b border-gray-100 py-4 transition-colors sm:flex-row sm:items-center sm:gap-5 sm:rounded-lg sm:border sm:border-gray-100 sm:px-4 sm:py-4"
    >
      {/* Mobile header */}
      <div className="sm:hidden">{header}</div>

      <ImageCarousel
        images={images}
        name={cafe.name}
        rank={rank}
      />

      <ImageCollage
        images={images}
        name={cafe.name}
        rank={rank}
      />

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="hidden sm:block">{header}</div>

        <div className="mt-2 space-y-1.5 px-4 sm:mt-3 sm:px-0">
          {cafe.reviews?.length ? (
            cafe.reviews.slice(0, 2).map((r, i) => (
              <p
                key={i}
                className="line-clamp-1 text-xs italic text-gray-600 sm:text-sm"
              >
                &ldquo;{r}&rdquo;
              </p>
            ))
          ) : cafe.description ? (
            <p className="line-clamp-2 text-xs text-white sm:text-sm">
              {cafe.description}
            </p>
          ) : null}

          {hasTags && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {cafe.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- List + submit modal ---------- */

export default function CafeListView({
  cafes = [],
  accentMap = {},
  defaultAccent,
  onSelect,
}) {
  const [isSubmitModalOpen, setIsSubmitModalOpen] =
    useState(false);

  return (
    <>
      <div className="mx-auto mt-6 flex w-full max-w-3xl flex-col">
        <div className="mb-3 flex items-center justify-between px-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
            All
          </span>

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="group flex cursor-pointer items-center gap-1 text-[11px] font-mono text-gray-500 transition-colors hover:text-amber-600"
          >
            <span>
              Can&apos;t find your favorite place?
            </span>

            <span className="font-semibold text-amber-600 group-hover:underline">
              Submit them →
            </span>
          </button>
        </div>

        {cafes.length === 0 ? (
          <div className="w-full py-10 text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-400">
              No establishments match this filter
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:gap-3">
            {cafes.map((cafe, idx) => {
              const accent =
                accentMap[cafe.accent] || defaultAccent;

              return (
                <CafeRow
                  key={cafe.id}
                  rank={idx + 1}
                  cafe={cafe}
                  accent={accent}
                  onClick={() =>
                    onSelect && onSelect(cafe)
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <SubmitCafeModal
        open={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
    </>
  );
}

/* ---------- Submit Cafe Modal ---------- */

function SubmitCafeModal({ open, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    instagram: "",
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

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
          description: formData.instagram
            ? `Instagram: ${formData.instagram}`
            : "",
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
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Center modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute right-4 top-4 cursor-pointer text-sm font-mono text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>

          <DialogTitle className="text-base font-bold text-gray-900">
            Suggest a Cafe or Restaurant
          </DialogTitle>

          <p className="mb-5 mt-1 text-xs text-gray-500">
            Know a great spot we missed? Drop the details
            below and we will check it out. 
            <span className='text-red-500'>
               * We do not gaurantee your recommendation will be on the list.*
              </span>
          </p>

          {status === "success" ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-amber-600">
                Thanks for the recommendation!
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Closing window...
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {status === "error" && (
                <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                  Could not send request. Please try again.
                </p>
              )}

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-wider text-gray-500">
                  Cafe/Restaurant Name{" "}
                  <span className="text-amber-600">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="e.g. Blue Bottle Coffee"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Location */}
              <div>
                <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-wider text-gray-500">
                  Location / Neighborhood{" "}
                  <span className="text-amber-600">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="e.g. BKK, TTP, TK, IFL"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-wider text-gray-500">
                  Cafe Instagram Handle
                </label>

                <input
                  type="text"
                  disabled={loading}
                  placeholder="@eatdoko.kh"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      instagram: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Actions */}
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="cursor-pointer rounded-md px-3 py-2 text-xs font-mono text-gray-500 transition-colors hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer rounded-md bg-amber-500 px-4 py-2 text-xs font-mono font-semibold text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}