"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import {
  ArrowLeft,
  Ban,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Maximize2,
  Phone,
  Play,
  RotateCw,
  Send,
  X,
} from "lucide-react";
import { trackEventClick} from "@/lib/trackEventClick";

const toTelHref = (phone) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const isHttpUrl = (value) => /^https?:\/\//i.test(value || "");

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function CafeDetailModal({
  isOpen,
  onClose,
  cafe,
  sponsors, // array of up to 3 sponsor cafes
  accentColor,
  onExclude,
  onSpinAgain,
  zIndex = 50,
  isList = false,
}) {
  const [view, setView] = useState("cafe"); // "cafe" | "partner"
  const [activeSponsor, setActiveSponsor] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);
  const bodyRef = useRef(null);

  // Start fresh whenever the modal is reopened or a different cafe is shown
  useEffect(() => {
    setView("cafe");
    setActiveSponsor(null);
    setExpandedImage(null);
    setActiveSlide(0);
  }, [isOpen, cafe?.id]);

  const sponsorList = Array.isArray(sponsors) ? sponsors.filter(Boolean).slice(0, 3) : [];

  if (!isOpen || !cafe) return null;

  const isPartnerView = view === "partner";
  const entity = isPartnerView ? activeSponsor : cafe;
  if (!entity) return null;

  // Spin flow = opened from the wheel (not from the list, not a partner)
  const isSpinMode = !isPartnerView && !isList;

  const color = isPartnerView
    ? "#FFCA28"
    : accentColor || cafe.reelAccent?.color || "#FFCA28";

  const phone =
    typeof entity.phone === "string" && entity.phone.trim() ? entity.phone.trim() : null;
  const telegram = isHttpUrl(entity.telegram) ? entity.telegram.trim() : null;

  const galleryImages = Array.isArray(entity.image_paths)
    ? entity.image_paths.filter(Boolean).slice(0, 10)
    : [];

  const galleryVideos = Array.isArray(entity.video_urls)
    ? entity.video_urls.filter(Boolean).slice(0, 3)
    : [];

  // Videos first, then images — single ordered list the carousel/lightbox walk through
  const gallerySlides = [
    ...galleryVideos.map((src) => ({ type: "video", src })),
    ...galleryImages.map((src) => ({ type: "image", src })),
  ];

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

  const goToPartner = (sponsorCafe) => {
    setExpandedImage(null);
    setActiveSlide(0);
    setActiveSponsor(sponsorCafe);
    setView("partner");
    bodyRef.current?.scrollTo({ top: 0 });
  };

  const backToCafe = () => {
    setExpandedImage(null);
    setActiveSlide(0);
    setView("cafe");
    bodyRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-sm max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent strip */}
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: color }} />

        {/* Close (always fully closes the modal) */}
        <button
          onClick={onClose}
          className={`absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-900 hover:text-white cursor-pointer ${focusRing}`}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* ---------- Scrollable body ---------- */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
          <div
            key={view + (activeSponsor?.id ?? "")}
            className="animate-in fade-in slide-in-from-right-2 duration-200"
          >
            {/* Back (only inside the partner view) */}
            {isPartnerView && (
              <button
                onClick={backToCafe}
                className={`mb-4 flex max-w-[calc(100%-2.5rem)] items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer ${focusRing}`}
              >
                <ArrowLeft size={14} className="shrink-0" />
                <span className="truncate">Back to {cafe.name}</span>
              </button>
            )}

            {/* Identity */}
            <div className="flex items-center gap-4 pr-9">
              <Image
                src={entity.logo_url}
                alt={entity.name}
                width={64}
                height={64}
                className="h-14 w-14 shrink-0 rounded-xl border border-neutral-700/60 object-cover shadow-md"
              />

              <div className="min-w-0 flex-1">
                {/* <span className="text-xs font-semibold" style={{ color }}>
                  {isPartnerView ? "Partner" : "Selected cafe"}
                </span> */}

                <h2 className="truncate text-lg font-extrabold leading-tight text-white">
                  {entity.name}
                </h2>

                {entity.branch_location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{entity.branch_location}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Photo carousel */}
            {gallerySlides.length > 0 && (
              <div className="mt-5">
                <div className="relative">
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-lg"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {gallerySlides.map((slide, idx) => (
                      <button
                        key={`${slide.src}-${idx}`}
                        onClick={() => openLightbox(idx)}
                        className={`relative aspect-[5/3] shrink-0 snap-center cursor-pointer overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 ${
                          gallerySlides.length > 1 ? "mr-2 w-[78%]" : "w-full"
                        }`}
                        aria-label={`Open ${slide.type} ${idx + 1} full screen`}
                      >
                        {slide.type === "video" ? (
                                      <video
                src={slide.src}
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
                                      ) : (
                          <Image
                            src={slide.src}
                            alt={`${entity.name} photo ${idx + 1}`}
                            fill
                            sizes="320px"
                            className="object-cover"
                          />
                        )}
                        {slide.type === "video" && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                              <Play size={16} fill="currentColor" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Navigation arrows */}
                  {gallerySlides.length > 1 && (
                    <>
                      <button
                        onClick={() => scrollToSlide(Math.max(activeSlide - 1, 0))}
                        disabled={activeSlide === 0}
                        className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80 disabled:opacity-0"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <button
                        onClick={() =>
                          scrollToSlide(Math.min(activeSlide + 1, gallerySlides.length - 1))
                        }
                        disabled={activeSlide === gallerySlides.length - 1}
                        className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80 disabled:opacity-0"
                        aria-label="Next photo"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  {/* Full screen hint */}
                  <div className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/65 text-white backdrop-blur-sm">
                    <Maximize2 size={13} strokeWidth={2} />
                  </div>
                </div>

                {/* Dots */}
                {gallerySlides.length > 1 && (
                  <div className="mt-2.5 flex items-center justify-center gap-1.5">
                    {gallerySlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToSlide(idx)}
                        className={`h-1.5 cursor-pointer rounded-full transition-all ${
                          idx === activeSlide ? "w-4" : "w-1.5 bg-neutral-700"
                        }`}
                        style={idx === activeSlide ? { backgroundColor: color } : undefined}
                        aria-label={`Go to photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

           {/* Exclude / Spin again — only when opened from a spin */}
          {isSpinMode && (
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={onExclude}
                className={`group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 text-xs font-semibold text-neutral-400 transition-all hover:border-red-900/70 hover:bg-red-950/30 hover:text-red-300 ${focusRing}`}
              >
                <Ban size={14} className="opacity-70 group-hover:opacity-100" />
                <span>Exclude</span>
              </button>

              <button
                onClick={onSpinAgain}
                className={`group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-black transition-all hover:bg-amber-400 ${focusRing}`}
              >
                <RotateCw
                  size={14}
                  className="transition-transform duration-300 group-hover:rotate-180"
                />
                <span>Spin again</span>
              </button>
            </div>
          )}

          {/* Nearby partners — only on the cafe view */}
          {!isPartnerView && sponsorList.length > 0 && (
            <div className="mt-1 border-neutral-900 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Nearby in {sponsorList[0].branch_location}
                </span>
                <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  Partner
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {sponsorList.map((sponsorCafe) => (
                  <button
                    key={sponsorCafe.id}
                    onClick={() => goToPartner(sponsorCafe)}
                    className={`group flex w-full cursor-pointer items-center justify-between rounded-lg border border-neutral-900 bg-neutral-900/50 p-2 transition-all hover:bg-neutral-900 ${focusRing}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Image
                        src={sponsorCafe.logo_url}
                        alt={sponsorCafe.name}
                        width={64}
                        height={64}
                        className="h-8 w-8 rounded-lg border border-neutral-700/60 object-cover shadow-md"
                      />
                      <h4 className="truncate text-xs font-medium text-neutral-200 group-hover:text-white">
                        {sponsorCafe.name}
                      </h4>
                    </div>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-neutral-500 group-hover:text-white"
                    />
                  </button>
                ))}
              </div>

              <div className="mt-2 text-right">
                <Link
                  href="/partner"
                  className="text-[10px] text-amber-500 transition-colors hover:text-neutral-300 underline "
                >
                  Become a partner today
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Pinned action footer ----------
            Spin mode:  [Exclude | Spin again]
                        [      Google Maps      ]
                        [   Call   |  Telegram   ]
            Other:      Google Maps + contact row (Spin row hidden) */}
        <div className="shrink-0 space-y-2.5 border-t border-neutral-900 bg-neutral-950 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
         

          {/* Main action: Google Maps */}
          <a
            href={entity.map}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEventClick(entity, {
                action: "map",
                isPartner: isPartnerView,
                source: isPartnerView ? "partner" : isList ? "list" : "spin",
              })
            }
            className={`flex w-full items-center justify-center gap-2.5 rounded-lg px-4 py-3.5 text-sm font-bold transition-all ${focusRing} ${
              isPartnerView
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10 hover:bg-amber-400"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            <MapPin size={16} />
            <span>Open in Google Maps</span>
          </a>

          {/* Contact row: only the buttons that have data; a single one fills the row */}
          {(phone || telegram) && (
            <div className="flex gap-2.5">
              {phone && (
                <a
                  href={toTelHref(phone)}
                   onClick={() =>
                      trackEventClick(entity, {
                        action: "call",
                        isPartner: isPartnerView,
                        source: isPartnerView ? "partner" : isList ? "list" : "spin",
                      })
                    }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 py-3 text-xs font-semibold text-neutral-200 transition-all hover:border-neutral-600 hover:bg-neutral-800 ${focusRing}`}
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              )}

              {telegram && (
                <a
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                   onClick={() =>
                    trackEventClick(entity, {   
                      action: "telegram",
                      isPartner: isPartnerView,
                      source: isPartnerView ? "partner" : isList ? "list" : "spin",
                    })
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 py-3 text-xs font-semibold text-neutral-200 transition-all hover:border-sky-700/70 hover:bg-sky-950/30 hover:text-sky-300 ${focusRing}`}
                >
                  <Send size={14} />
                  <span>Telegram</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {expandedImage !== null && (
        <Lightbox
              open
              close={() => setExpandedImage(null)}
              index={expandedImage}
              plugins={[Video]}
              slides={gallerySlides.map((slide) =>
                slide.type === "video"
                  ? {
                      type: "video",
                      width: 1280,
                      height: 720,
                      sources: [{ src: slide.src, type: "video/mp4" }],
                    }
                  : { src: slide.src }
              )}
            on={{ view: ({ index }) => setExpandedImage(index) }}
            animation={{ fade: 250, swipe: 300 }}
            controller={{ closeOnBackdropClick: true }}
            styles={{ root: { zIndex: zIndex + 10 } }}
            render={{
              controls: () => (
                <div
                  className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {gallerySlides.map((_, idx) => (
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