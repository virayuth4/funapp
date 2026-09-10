"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function CafeDetailModal({
  isOpen,
  onClose,
  onBack,
  cafe,
  variant = "cafe",
  accentColor,
  onExclude,
  onSpinAgain,
  zIndex = 50,
  footer,
}) {
  const [expandedImage, setExpandedImage] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  if (!isOpen || !cafe) return null;

  const isSponsor = variant === "sponsor";
  const color = accentColor || cafe.reelAccent?.color || "#fbbf24";

  // image_paths comes from the backend as a JSONB array of URLs.
  // Guard against it being missing, a string, or malformed.
const galleryImages = Array.isArray(cafe.image_paths)
  ? cafe.image_paths.filter(Boolean).slice(0, 10)
  : [];

  const scrollToSlide = (idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    el.scrollTo({ left: idx * slideWidth, behavior: "smooth" });
    setActiveSlide(idx);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    const idx = Math.round(el.scrollLeft / slideWidth);
    setActiveSlide(idx);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Photo Carousel */}
        {galleryImages.length > 0 && (
          <div className="mt-5 relative">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory rounded-lg no-scrollbar"
              style={{ scrollbarWidth: "none" }}
            >
              {galleryImages.map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  onClick={() => setExpandedImage(src)}
                  className="relative w-full aspect-[4/3] shrink-0 snap-center overflow-hidden border border-neutral-800 bg-neutral-900 cursor-pointer"
                >
                  <Image
                    src={src}
                    alt={`${cafe.name} photo ${idx + 1}`}
                    fill
                    sizes="384px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Prev / Next arrows (desktop-friendly, harmless on touch) */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => scrollToSlide(Math.max(activeSlide - 1, 0))}
                  disabled={activeSlide === 0}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80 disabled:opacity-0 transition-opacity cursor-pointer"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    scrollToSlide(Math.min(activeSlide + 1, galleryImages.length - 1))
                  }
                  disabled={activeSlide === galleryImages.length - 1}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80 disabled:opacity-0 transition-opacity cursor-pointer"
                  aria-label="Next photo"
                >
                  ›
                </button>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToSlide(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === activeSlide ? "w-4 bg-amber-400" : "w-1.5 bg-neutral-700"
                      }`}
                      aria-label={`Go to photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Expanded image lightbox */}
        {expandedImage && (
          <div
            className="fixed inset-0 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
            style={{ zIndex: zIndex + 10 }}
            onClick={(e) => {
              e.stopPropagation();
              setExpandedImage(null);
            }}
          >
            <div className="relative w-full max-w-lg aspect-square">
              <Image
                src={expandedImage}
                alt={`${cafe.name} full photo`}
                fill
                sizes="256px"
                className="object-contain rounded-lg"
              />
            </div>
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-6 right-6 text-white/80 hover:text-white text-lg cursor-pointer"
              aria-label="Close photo"
            >
              ✕
            </button>
          </div>
        )}

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