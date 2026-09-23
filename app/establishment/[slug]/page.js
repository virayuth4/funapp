// app/establishment/[slug]/page.js
import { notFound } from 'next/navigation';
import { Fraunces, Manrope } from 'next/font/google';
import { getEstablishmentBySlug } from '@/lib/getEstablishmentBySlug';
import GalleryCarousel from '../../Components/galleryCarousel';
import Link from 'next/link';
import PriceRangeDisplay from '@/app/Components/priceRangeDisplay';
import OpeningHoursList from '@/app/Components/openingHoursList';
import { getThemeColors } from '@/lib/theme';
import TrackedContactLink from '@/app/Components/trackContactLink';

export const revalidate = 3600; // ISR, matches backend cache TTL

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display',
});

const body = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

const SCHEMA_TYPE_BY_CATEGORY = {
  cafe: 'CafeOrCoffeeShop',
  restaurant: 'Restaurant',
  bar: 'BarOrPub',
};

function toSchemaType(category) {
  return SCHEMA_TYPE_BY_CATEGORY[category] || 'LocalBusiness';
}

function toTelHref(phone) {
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function toTelegramHref(telegram) {
  if (!telegram) return null;
  if (telegram.startsWith('http')) return telegram;
  return `https://t.me/${telegram.replace('@', '')}`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const place = await getEstablishmentBySlug(slug);
  if (!place) return {};

  const url = `https://eatdoko.com/establishment/${place.slug}`;
  const description =
    place.description?.split('\n')[0]?.slice(0, 160) ||
    `${place.name} in ${place.branch_location}, Phnom Penh — hours, menu, location and reviews.`;

  return {
    title: `${place.name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: place.name,
      description,
      url,
      type: 'website',
      images: place.logo_url ? [place.logo_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: place.name,
      description,
    },
  };
}


export default async function EstablishmentPage({ params }) {
  const { slug } = await params;
  const place = await getEstablishmentBySlug(slug);
  if (!place) notFound();
  const { titleColor, bodyColor } = getThemeColors("dark");

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': toSchemaType(place.category),
    name: place.name,
    image: place.logo_url,
    description: place.description,
    url: `https://eatdoko.com/establishment/${place.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: place.branch_location,
      addressRegion: 'Phnom Penh',
      addressCountry: 'KH',
    },
    ...(place.price_range && { priceRange: `$${place.price_range}` }),
    ...(place.map && { hasMap: place.map }),
    ...(place.phone && { telephone: place.phone }),
  };

  // Logo first, then gallery images — de-duped, so the gallery works even
  // if only one of the two is present.
  const galleryImages = (place.image_paths || []).filter(
    (src, i, arr) => arr.indexOf(src) === i
  );
  const heroImage = galleryImages[0] || place.logo_url;

  const telHref = toTelHref(place.phone);
  const telegramHref = toTelegramHref(place.telegram);
  const hasBookingChannel = Boolean(telHref || telegramHref);

  // Minimal shape trackEventClick needs, reused across every tracked link below.
  const trackedEntity = {
    id: place.id,
    name: place.name,
    branch_location: place.branch_location,
  };

  return (
    <main
      className={`${display.variable} ${body.variable} relative min-h-screen w-full bg-[#ffffff] font-[family-name:var(--font-body)] pb-24 md:pb-0`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="relative flex min-h-[60vh] w-full flex-col justify-end overflow-hidden bg-[#16130F] sm:min-h-[85vh]">
        {heroImage && (
          <img
            src={heroImage}
            alt={place.name}
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#16130F] via-[#16130F]/60 to-[#16130F]/10" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-10 pt-24 sm:px-6 sm:pb-14 ">
          <p className="text-sm text-[#D98E1D]">
            {place.branch_location}, Phnom Penh
          </p>

          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] text-white sm:text-6xl">
            {place.name}
          </h1>

           <div className="mt-4">
               <OpeningHoursList
                   hours={place.opening_hours}
                   note={place.hours_note}
                   showFootnote={true}
                   className={bodyColor}
                   textSize='text-sm'
                 />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white">
                <PriceRangeDisplay priceRange={place.price_range} />
          </div>

          {hasBookingChannel && (
            <div className="mt-8 flex flex-wrap gap-3">
              {telHref && (
                <TrackedContactLink
                  action="call"
                  entity={trackedEntity}
                  source="establishment_hero"
                  href={telHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D]"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {place.phone}
                </TrackedContactLink>
              )}
              {telegramHref && (
                <TrackedContactLink
                  action="telegram"
                  entity={trackedEntity}
                  source="establishment_hero"
                  href={telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  <TelegramIcon className="h-4 w-4" />
                  Message on Telegram
                </TrackedContactLink>
              )}
              {place.map && (
                <TrackedContactLink
                  action="map"
                  entity={trackedEntity}
                  source="establishment_hero"
                  href={place.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Get directions
                </TrackedContactLink>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
        <div className="grid grid-cols-1 gap-10 pt-10 lg:grid-cols-[1fr_280px] lg:gap-12">
          {/* Primary column */}
          <div className="min-w-0">
            {place.description && (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#3A342C]">
                {place.description}
              </p>
            )}

            {(place.cuisines?.length > 0 || place.tags?.length > 0) && (
              <div className="mt-6 flex flex-wrap gap-2">
                {place.cuisines?.map((c) => (
                  <span
                    key={c}
                    className=" bg-[#2F4B3C]/10 px-3 py-1 text-sm text-[#2F4B3C]"
                  >
                    {c}
                  </span>
                ))}
                {place.tags?.map((t) => (
                  <span
                    key={t}
                    className=" bg-[#EFE9DD] px-3 py-1 text-sm text-[#6B6355]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {place.instagram && (
              <div className="mt-6">
                <Link
                  href={place.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#3A342C] underline decoration-[#D98E1D] decoration-2 underline-offset-4"
                >
                  See more on Instagram
                </Link>
              </div>
            )}

            <section className="mt-10 ">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#16130F]">
                Gallery
              </h2>
              <div className="mt-4">
                <GalleryCarousel images={galleryImages} alt={place.name} />
              </div>
            </section>

            {place.video_urls?.length > 0 && (
              <section className="mt-10">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#16130F]">
                  Video
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4">
                  {place.video_urls.map((src) => (
                    <video
                      key={src}
                      src={src}
                      controls
                      className="w-full rounded-xl bg-black"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Booking card — sticky on desktop, hidden on mobile (mobile uses the bottom bar) */}
          {hasBookingChannel && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-[#E7E1D6] bg-white p-6">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#16130F]">
                  Reserve a table
                </h2>
                <p className="mt-1 text-sm text-[#8B8377]">
                  Call or message us directly — we'll confirm your table.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  {telHref && (
                    <TrackedContactLink
                      action="call"
                      entity={trackedEntity}
                      source="establishment_sidebar"
                      href={telHref}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D98E1D] px-4 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D]"
                    >
                      <PhoneIcon className="h-4 w-4" />
                      {place.phone}
                    </TrackedContactLink>
                  )}
                  {telegramHref && (
                    <TrackedContactLink
                      action="telegram"
                      entity={trackedEntity}
                      source="establishment_sidebar"
                      href={telegramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#16130F] px-4 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#16130F] hover:text-white"
                    >
                      <TelegramIcon className="h-4 w-4" />
                      Message on Telegram
                    </TrackedContactLink>
                  )}
                  {place.map && (
                    <TrackedContactLink
                      action="map"
                      entity={trackedEntity}
                      source="establishment_sidebar"
                      href={place.map}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-[#3A342C] underline decoration-[#D98E1D] decoration-2 underline-offset-4"
                    >
                      Get directions
                    </TrackedContactLink>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile sticky booking bar */}
      {hasBookingChannel && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E7E1D6] bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-3xl items-stretch">
            {telHref && (
              <TrackedContactLink
                action="call"
                entity={trackedEntity}
                source="establishment_mobile_bar"
                href={telHref}
                className="flex flex-1 items-center justify-center gap-2 bg-[#D98E1D] py-4 text-sm font-semibold text-[#16130F]"
              >
                <PhoneIcon className="h-4 w-4" />
                Call
              </TrackedContactLink>
            )}
            {telegramHref && (
              <TrackedContactLink
                action="telegram"
                entity={trackedEntity}
                source="establishment_mobile_bar"
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold text-[#16130F]"
              >
                <TelegramIcon className="h-4 w-4" />
                Telegram
              </TrackedContactLink>
            )}
            {place.map && (
              <TrackedContactLink
                action="map"
                entity={trackedEntity}
                source="establishment_mobile_bar"
                href={place.map}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold text-[#3A342C]"
              >
                Map
              </TrackedContactLink>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function PhoneIcon({ className }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function TelegramIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.94 4.6 18.6 20.36c-.25 1.1-.9 1.37-1.83.85l-5.06-3.73-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.16L18.03 6.5c.42-.37-.1-.58-.65-.21L6.72 13.36l-4.97-1.55c-1.08-.34-1.1-1.08.23-1.6L20.6 3.36c.9-.33 1.68.21 1.34 1.24z" />
    </svg>
  );
}