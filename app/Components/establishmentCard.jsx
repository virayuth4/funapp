// app/Components/establishmentCard.js
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PriceRangeDisplay from './priceRangeDisplay';
import { formatLocation } from '@/lib/formatLocation';
import TagList from './tagDisplay';

function BubbleRating({ rating = 0, count = 0 }) {
  if (!rating) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - (i - 1)));
          return (
            <div key={i} className="relative h-3.5 w-3.5 rounded-full border border-emerald-600">
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

function HeartIcon({ filled, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7.5-4.9-10-9.3C.4 8.3 1.8 4.5 5.4 3.6c2.1-.5 4.2.4 5.6 2.2 1.4-1.8 3.5-2.7 5.6-2.2 3.6.9 5 4.7 3.4 8.1C19.5 16.1 12 21 12 21Z" />
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  );
}

function MapPinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

/* ---------- Overlay bits ---------- */

function SavedButton({ saved, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label="Save"
      className={`absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow active:scale-95 sm:h-8 sm:w-8 sm:hover:text-rose-600 ${className}`}
    >
      <HeartIcon filled={saved} className={`h-5 w-5 sm:h-4.5 sm:w-4.5 ${saved ? 'text-rose-600' : ''}`} />
    </button>
  );
}

function SponsoredBadge({ className = '' }) {
  return (
    <span
      className={`absolute left-2.5 top-2.5 z-10 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${className}`}
    >
      Featured
    </span>
  );
}

/* ---------- Mobile: swipeable carousel ---------- */

function ImageCarousel({ images, name, rank, saved, onToggleSave, isSponsored }) {
  const scrollRef = useRef(null);
  const shown = images.slice(0, 10);
  const hasOverflow = images.length > 3;

  return (
    <div className="relative -mx-4 w-[calc(100%+2rem)] sm:hidden">
      <div
        ref={scrollRef}
        className="flex w-full snap-x snap-mandatory gap-0.5 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

      {/* <SavedButton saved={saved} onToggle={onToggleSave} /> */}
      {/* {isSponsored && <SponsoredBadge />} */}
    </div>
  );
}

/* ---------- Desktop: big photo + thumbnail strip ---------- */

function ImageCollage({ images, name, rank, saved, onToggleSave, isSponsored }) {
  const count = images.length;
  const thumbs = images.slice(1, 4);

  return (
    <div className="relative hidden h-52 w-72 shrink-0 overflow-hidden bg-gray-100 sm:block">
      {/* <SavedButton saved={saved} onToggle={onToggleSave} /> */}
      {/* {isSponsored && <SponsoredBadge />} */}

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
        <div className="flex h-full w-full flex-col gap-0.5">
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
            className={`grid h-[calc(35%-0.25rem)] gap-0.5 ${
              thumbs.length >= 3 ? 'grid-cols-3' : thumbs.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {thumbs.map((src, i) => (
              <div key={i} className="relative block overflow-hidden">
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

/* ---------- Main card ---------- */

export default function EstablishmentCard({ cafe, rank }) {
  const images = cafe.image_paths?.length ? cafe.image_paths : [cafe.logo_url];
  const [saved, setSaved] = useState(false);
  const toggleSave = () => setSaved((s) => !s);

  // Generates Google Maps search URL from cafe coordinates or location query
  const mapQuery = encodeURIComponent(
    [cafe.name, cafe.branch_location].filter(Boolean).join(', ')
  );
  const mapUrl = cafe.latitude && cafe.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${cafe.latitude},${cafe.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  // Detail page route — assumes /{category}/{slug}. Adjust if your actual
  // routes differ (e.g. all establishments live under /place/[slug]).
  const detailHref = `/establishment/${cafe.slug}`;

  const header = (
  <>
    <div className="flex items-start justify-between gap-2">
      <h2 className="text-base font-bold leading-snug text-gray-900 sm:text-lg">
        {rank ? `${rank}. ` : ''}
        {cafe.name}
      </h2>
    </div>

    {/* <div className="mt-1">
      <BubbleRating rating={cafe.rating} count={cafe.review_count} />
    </div> */}

    <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-600 sm:text-sm">
      {cafe.category && (
        <span className="flex items-center  capitalize">
          <span className="truncate">{formatLocation(cafe.branch_location)}</span>
        </span>
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

   <div className="space-y-1.5 sm:mt-3 mt-1.5">
  {cafe.price_range && (
    <p className="text-xs text-gray-600">
      <PriceRangeDisplay priceRange={cafe.price_range} />
    </p>
  )}
</div>

<div className="">
  <hr className="mt-2 border-t border-gray-100" />
</div>
  </>
);

  return (
    <Link
      href={detailHref}
      className="flex flex-col gap-3 border-b border-gray-100 py-4 sm:flex-row sm:gap-5 sm:border-0 sm:py-6"
    >
      {/* Mobile top section */}
      <div className="sm:hidden">{header}</div>

      <ImageCarousel
        images={images}
        name={cafe.name}
        rank={rank}
        saved={saved}
        onToggleSave={toggleSave}
        isSponsored={cafe.is_sponsored}
      />
      <ImageCollage
        images={images}
        name={cafe.name}
        rank={rank}
        saved={saved}
        onToggleSave={toggleSave}
        isSponsored={cafe.is_sponsored}
      />

      {/* Main Content */}
      <div className="min-w-0 flex-1 sm:pt-0.5">
        <div className="hidden sm:block">{header}</div>

        <div className="mt-2 space-y-1.5 sm:mt-3">
          {cafe.reviews?.length ? (
            cafe.reviews.slice(0, 2).map((r, i) => (
              <p key={i} className="line-clamp-1 text-xs italic text-gray-600 sm:text-sm">
                &ldquo;{r}&rdquo;
              </p>
            ))
          ) : cafe.description ? (
            <p className=" line-clamp-3 text-xs  text-gray-600 sm:text-sm">{cafe.description}</p>
          ) : null}
        </div>

           <div className="mt-2 space-y-1.5 sm:mt-3">
                <TagList tags={cafe.tags} className="pt-0.5" />


           </div>
         
      
      </div>
    </Link>
  );
}