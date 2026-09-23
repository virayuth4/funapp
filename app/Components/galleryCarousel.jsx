'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export default function GalleryCarousel({ images, alt = 'Gallery' }) {
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const thumbRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const userHasInteracted = useRef(false);
  const thumbContainerRef = useRef(null);

  const validImages = images?.filter(Boolean) ?? [];
  const lightboxSlides = validImages.map((src) => ({ src }));

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current;
    const slide = slideRefs.current[index];
    if (!track || !slide) return;

    track.scrollTo({
      left: slide.offsetLeft,
      behavior: 'smooth',
    });
  }, []);

  const openLightbox = useCallback((index) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  // Keep active index in sync with manual swipes
  useEffect(() => {
    const track = trackRef.current;
    if (!track || validImages.length <= 1) return;

    let raf = null;

    const handleScroll = () => {
      userHasInteracted.current = true;
      if (raf) cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        const slides = slideRefs.current;
        if (!slides.length) return;

        const scrollPosition = track.scrollLeft;

        let closestIndex = 0;
        let closestDistance = Infinity;

        slides.forEach((slide, index) => {
          if (!slide) return;
          const distance = Math.abs(slide.offsetLeft - scrollPosition);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        setActiveIndex((prev) =>
          prev !== closestIndex ? closestIndex : prev
        );
      });
    };

    track.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      track.removeEventListener('scroll', handleScroll);

      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, [validImages.length]);

  // Reset active index if the image list changes
  useEffect(() => {
    setActiveIndex(0);

    const track = trackRef.current;
    if (track) {
      track.scrollTo({
        left: 0,
        behavior: 'auto',
      });
    }
  }, [validImages.join('|')]);

  // Keep the active thumbnail scrolled into view as the main track moves
useEffect(() => {
  if (!userHasInteracted.current) return; // Ignores initial load and StrictMode remounts

  const container = thumbContainerRef.current;
  const thumb = thumbRefs.current[activeIndex];
  if (!container || !thumb) return;

  const targetLeft =
    thumb.offsetLeft - container.offsetWidth / 2 + thumb.offsetWidth / 2;

  container.scrollTo({
    left: targetLeft,
    behavior: 'smooth',
  });
}, [activeIndex]);

  if (!validImages.length) return null;

  return (
    <div className="mb-6 w-full">
      {/* Wrapper holds the track + the static button together */}
      <div className="relative">
        {/* Main swipeable track */}
        <div
          ref={trackRef}
          className="
              flex
              w-auto
              snap-x
              snap-mandatory
              overflow-x-auto
              bg-white
              [-ms-overflow-style:none]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
          "
        >
          {validImages.map((src, i) => (
            <div
              key={`${src}-${i}`}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="
                relative
                aspect-[16/10]
                w-full
                flex-shrink-0
                snap-center
              "
            >
              <Image
                src={src}
                alt={`${alt} photo ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 768px"
                className="cursor-zoom-in object-contain"
                onClick={() => openLightbox(i)}
              />
            </div>
          ))}
        </div>

        {/* Static fullscreen button — sibling of the track, not inside it */}
        <button
          type="button"
          onClick={() => openLightbox(activeIndex)}
          aria-label="View fullscreen"
          className="
            absolute
            bottom-3
            right-3
            inline-flex
            items-center
            justify-center
            rounded-full
            bg-black/50
            p-2
            text-white
            backdrop-blur-sm
            transition-colors
            hover:bg-black/70
          "
        >
          <ExpandIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnail strip */}
      {validImages.length > 1 && (
        <div
        ref={thumbContainerRef}
          className="
          relative
            mt-3
            flex
            gap-2
            overflow-x-auto
            p-1
            [-ms-overflow-style:none]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {validImages.map((src, i) => (
            <button
              key={`${src}-thumb-${i}`}
              type="button"
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              onClick={() => scrollToIndex(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === activeIndex}
              className={`
                relative
                aspect-square
                w-16
                flex-shrink-0
                p-0.5
                ring-offset-2
                transition-opacity
                ${
                  i === activeIndex
                    ? 'ring-1 ring-amber-400 opacity-100'
                    : 'opacity-70 hover:opacity-100'
                }
              `}
            >
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={src}
                  alt={`${alt} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={activeIndex}
        slides={lightboxSlides}
        on={{
          view: ({ index }) => setActiveIndex(index),
        }}
      />
    </div>
  );
}

function ExpandIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}