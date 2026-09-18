// app/establishment/[slug]/page.js
import { notFound } from 'next/navigation';
import {getEstablishmentBySlug} from '@/lib/getEstablishmentBySlug'
import GalleryCarousel from '../../Components/galleryCarousel';
import Link from 'next/link';

export const revalidate = 3600; // ISR, matches backend cache TTL

const SCHEMA_TYPE_BY_CATEGORY = {
  cafe: 'CafeOrCoffeeShop',
  restaurant: 'Restaurant',
  bar: 'BarOrPub',
};

function toSchemaType(category) {
  return SCHEMA_TYPE_BY_CATEGORY[category] || 'LocalBusiness';
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
    title: `${place.name} — ${place.branch_location}, Phnom Penh`,
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
  };

  // Logo first, then gallery images — de-duped, so the gallery works even
  // if only one of the two is present.
const galleryImages = (place.image_paths || []).filter(
  (src, i, arr) => arr.indexOf(src) === i
);
  return (
    <main className="relative min-h-screen w-full bg-white px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <header className="mb-6">
         

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-black sm:text-4xl">
            {place.name}
          </h1>

          <p className="mt-1 text-gray-500">
            {place.branch_location}, Phnom Penh
            {place.est_year && ` · Est. ${place.est_year}`}
            {place.price_range && ` · $${place.price_range}`}
          </p>
        </header>

        {/* Swipeable gallery with thumbnails (replaces logo hero + old Gallery section) */}
        <GalleryCarousel images={galleryImages} alt={place.name} />

        {/* Description */}
        {place.description && (
          <p className="mb-6 whitespace-pre-line text-gray-700">
            {place.description}
          </p>
        )}

        {/* Cuisines / Tags */}
        {(place.cuisines?.length > 0 || place.tags?.length > 0) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {place.cuisines?.map((c) => (
              <span
                key={c}
                className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700"
              >
                {c}
              </span>
            ))}
            {place.tags?.map((t) => (
              <span
                key={t}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          {place.map && (
            <Link
              href={place.map}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              View on Map
            </Link>
          )}
          {place.instagram && (
            <Link
              href={place.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              Instagram
            </Link>
          )}
        </div>

        {/* Video */}
        {place.video_urls?.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-black">Video</h2>
            <div className="grid grid-cols-1 gap-4">
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
    </main>
  );
}