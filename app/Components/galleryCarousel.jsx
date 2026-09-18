'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

export default function GalleryCarousel({ images, alt = 'Gallery' }) {
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const thumbRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const validImages = images?.filter(Boolean) ?? [];

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current;
    const slide = slideRefs.current[index];
    if (!track || !slide) return;

    track.scrollTo({
      left: slide.offsetLeft,
      behavior: 'smooth',
    });
  }, []);

  // Keep active index in sync with manual swipes
  useEffect(() => {
    const track = trackRef.current;
    if (!track || validImages.length <= 1) return;

    let raf = null;

    const handleScroll = () => {
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

  // Keep active thumbnail visible
  useEffect(() => {
    const thumb = thumbRefs.current[activeIndex];

    if (!thumb) return;

    thumb.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeIndex]);

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

  if (!validImages.length) return null;

  return (
    <div className="mb-6 w-full">
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
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {/* Thumbnail strip */}
      {validImages.length > 1 && (
        <div
          className="
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
    </div>
  );
}