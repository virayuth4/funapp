// app/best-cafes/[location]/page.js
import { notFound } from 'next/navigation';
import { CAFE_LOCATIONS, getLocationConfig } from '@/lib/locations';
import { getCafes } from '@/lib/api';
import EstablishmentCard from '@/app/Components/establishmentCard';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(CAFE_LOCATIONS).map((location) => ({ location }));
}

export async function generateMetadata({ params }) {
  const { location } = await params;
  const config = getLocationConfig(location);
  if (!config) return {};

  const url = `https://eatdoko.com/best-cafes/${config.slug}`;

  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: url },
    openGraph: {
      title: config.title,
      description: config.description,
      url,
      type: 'website',
      images: ['/og/best-cafes.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
    },
  };
}

export default async function BestCafesPage({ params }) {
  const { location } = await params;
  const config = getLocationConfig(location);
  if (!config) notFound();

  const cafes = await getCafes(config.query, 30);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: config.title,
    itemListElement: cafes.map((cafe, i) => ({
      '@type': 'ListItem',
      position: i + 1,
     item: {
        '@type': 'CafeOrCoffeeShop',
        name: cafe.name,
        image: cafe.logo_url,
        url: `https://eatdoko.com/cafe/${cafe.slug}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: cafe.address,
          addressLocality: config.name,
          addressCountry: 'KH',
        },
        aggregateRating: cafe.rating ? {
          '@type': 'AggregateRating',
          ratingValue: cafe.rating,
          reviewCount: cafe.review_count,
        } : undefined,
      }
    })),
  };

 return (
  <main className="relative min-h-screen w-full bg-white px-4 py-10">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />

    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-black sm:text-4xl">
        Best Cafes in {config.name}{config.slug === 'phnom-penh' ? '' : ', Phnom Penh'} (2026)
      </h1>

        <p className="mt-2 max-w-2xl text-gray-600">
          {config.description}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {cafes.map((cafe, i) => (
          <EstablishmentCard
            key={cafe.id}
            cafe={cafe}
            rank={i + 1}
          />
        ))}
      </div>

      {cafes.length === 0 && (
        <p className="text-gray-500">
          No cafes found in {config.name} yet.
        </p>
      )}
    </div>
  </main>
);
}