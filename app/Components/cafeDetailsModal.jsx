"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Maximize2 } from "lucide-react";

export default function CafeDetailModal({
  isOpen,
  onClose,
  cafe,
  sponsor,
  accentColor,
  onExclude,
  onSpinAgain,
  zIndex = 50,
  isList=false,
}) {
  const [view, setView] = useState("cafe"); // "cafe" | "partner"
  const [expandedImage, setExpandedImage] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);



  if (!isOpen || !cafe) return null;

  const isPartnerView = view === "partner";
  const entity = isPartnerView ? sponsor : cafe;
  if (!entity) return null;

  const color = isPartnerView
    ? "#fbbf24"
    : accentColor || cafe.reelAccent?.color || "#fbbf24";

  const galleryImages = Array.isArray(entity.image_paths)
    ? entity.image_paths.filter(Boolean).slice(0, 10)
    : [];

const scrollToSlide = (idx) => {
  const el = scrollRef.current;
  if (!el) return;

  const slide = el.children[idx];
  if (!slide) return;

  el.scrollTo({
    left: slide.offsetLeft,
    behavior: "smooth",
  });

  setActiveSlide(idx);
};



const handleScroll = () => {
  const el = scrollRef.current;
  if (!el || !el.children.length) return;

  const scrollLeft = el.scrollLeft;

  let closestIndex = 0;
  let closestDistance = Infinity;

  Array.from(el.children).forEach((child, idx) => {
    const distance = Math.abs(child.offsetLeft - scrollLeft);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = idx;
    }
  });

  setActiveSlide(closestIndex);
};

  

  const openLightbox = (idx) => setExpandedImage(idx);
const goToPartner = () => {
  setExpandedImage(null);
  setActiveSlide(0);
  setView("partner");
};

const backToCafe = () => {
  setExpandedImage(null);
  setActiveSlide(0);
  setView("cafe");
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

        {/* Back (only inside the partner view) */}
        {isPartnerView && (
          <button
            onClick={backToCafe}
            className="absolute top-4 left-4 flex items-center gap-1 text-neutral-400 hover:text-white text-xs font-semibold cursor-pointer"
            aria-label="Back"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        )}

        {/* Close (always fully closes the modal) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white text-sm cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content swaps between cafe / partner, with a light transition */}
        <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200">
          {/* Identity */}
          <div className={`flex items-center gap-4 ${isPartnerView ? "mt-4" : ""}`}>
            <Image
              src={entity.logo_url}
              alt={entity.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg object-cover border border-neutral-700/60 shadow-md"
            />

            <div className="min-w-0 flex-1">
              <span
                className="text-[10px] font-mono uppercase font-bold tracking-widest"
                style={{ color }}
              >
                {isPartnerView ? "Partner" : "Selected Cafe"}
              </span>

              <h2 className="text-lg font-extrabold text-white truncate">
                {entity.name}
              </h2>

              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300">
                {entity.branch_location}
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
          onClick={() => openLightbox(idx)}
          className="relative w-[85%] aspect-[5/3] shrink-0 snap-center overflow-hidden border border-neutral-800 bg-neutral-900 cursor-pointer rounded-lg mr-2"
        >
          <Image
            src={src}
            alt={`${entity.name} photo ${idx + 1}`}
            fill
            sizes="320px"
            className="object-cover"
          />
        </button>
      ))}
    </div>

    {/* Full screen indicator */}
    <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-sm border border-white/10 text-white text-[10px] font-semibold shadow-lg">
      <Maximize2 size={13} strokeWidth={2} />
      <span>View full screen</span>
    </div>

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
            scrollToSlide(
              Math.min(activeSlide + 1, galleryImages.length - 1)
            )
          }
          disabled={activeSlide === galleryImages.length - 1}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80 disabled:opacity-0 transition-opacity cursor-pointer"
          aria-label="Next photo"
        >
          ›
        </button>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {galleryImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === activeSlide
                  ? "w-4 bg-amber-400"
                  : "w-1.5 bg-neutral-700"
              }`}
              aria-label={`Go to photo ${idx + 1}`}
            />
          ))}
        </div>
      </>
    )}
  </div>
)}



      {/* Actions */}
<div className="mt-5 flex flex-col gap-2.5">
  {/* Google Maps */}
  <a
    href={entity.map}
    target="_blank"
    rel="noopener noreferrer"
    className={`group w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
      isPartnerView
        ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/10"
        : "bg-white hover:bg-neutral-200 text-black"
    }`}
  >
    <span className="text-base">📍</span>
    <span>Google Maps</span>
   
  </a>

  {!isPartnerView && (
    <div className="flex gap-2.5">
      {/* Exclude */}
      <button
        onClick={onExclude}
        className="group flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-red-900/70 hover:bg-red-950/30 text-neutral-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer"
      >
        <span className="text-sm opacity-70 group-hover:opacity-100">
          ⊘
        </span>
        <span>Exclude</span>
      </button>

      {/* Spin Again */}
      <button
        onClick={onSpinAgain}
        className="group flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer"
      >
        <span className="text-sm transition-transform group-hover:rotate-180 duration-300">
          ↻
        </span>
        <span>Spin Again</span>
      </button>
    </div>
  )}
</div>
        </div>

        {/* Nearby partner teaser — lives inside the same modal, only on the cafe view */}
        {!isPartnerView && sponsor && (
          <div className="mt-5 pt-4 border-t border-neutral-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                Nearby In {sponsor.branch_location}
              </span>
              <span className="text-[9px] font-mono tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                Partner
              </span>
            </div>

            <button
              onClick={goToPartner}
              className="w-full flex items-center justify-between p-2 rounded-lg border border-neutral-900 bg-neutral-900/50 hover:bg-neutral-900 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Image
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  width={64}
                  height={64}
                  className="w-8 h-8 rounded-lg object-cover border border-neutral-700/60 shadow-md"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-medium text-neutral-200 truncate group-hover:text-white">
                    {sponsor.name}
                  </h4>
                </div>
              </div>
              <span className="text-neutral-500 group-hover:text-white text-xs pl-2">→</span>
            </button>

            <div className="mt-2 text-right">
              <Link
                href="/partner"
                className="text-[9px] font-mono text-neutral-600 hover:text-neutral-400 transition-colors inline-flex items-center gap-1"
              >
                <span>Become a partner & feature your cafe</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {expandedImage !== null && (
          <Lightbox
            open
            close={() => setExpandedImage(null)}
            index={expandedImage}
            slides={galleryImages.map((src) => ({ src }))}
            on={{ view: ({ index }) => setExpandedImage(index) }}
            animation={{ fade: 250, swipe: 300 }}
            controller={{ closeOnBackdropClick: true }}
            styles={{ root: { zIndex: zIndex + 10 } }}
            render={{
              controls: () => (
                <div
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setExpandedImage(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === expandedImage ? "w-4 bg-amber-400" : "w-1.5 bg-white/40"
                      }`}
                      aria-label={`Go to photo ${idx + 1}`}
                    />
                  ))}
                </div>
              ),
            }}
          />
        )}
      </div>
    </div>
  );
}