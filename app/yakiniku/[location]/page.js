// app/best-yakiniku/[location]/page.js
import { notFound } from 'next/navigation';
import { YAKINIKU_LOCATIONS, getRestaurantLocationConfig } from '@/lib/restaurantLocations';
import EstablishmentCard from '@/app/Components/establishmentCard';
import ExpandableText from '@/app/Components/expandableText';
import { getEstablishments } from '@/lib/api';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(YAKINIKU_LOCATIONS).map((location) => ({ location }));
}

export async function generateMetadata({ params }) {
  const { location } = await params;
  const config = getRestaurantLocationConfig(location);
  if (!config) return {};

  const url = `https://eatdoko.com/yakiniku/${config.slug}`;

  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: url },
    openGraph: {
      title: config.title,
      description: config.description,
      url,
      type: 'website',
      images: ['/og/yakiniku.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
    },
  };
}

export default async function BestYakinikuPage({ params }) {
  const { location } = await params;
  const config = getRestaurantLocationConfig(location);
  if (!config) notFound();

  const restaurants = await getEstablishments('restaurant', config.query, 30);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: config.title,
    itemListElement: restaurants.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Restaurant',
        name: r.name,
        image: r.logo_url,
        url: `https://eatdoko.com/restaurant/${r.slug}`,
        servesCuisine: 'Japanese',
        address: {
          '@type': 'PostalAddress',
          streetAddress: r.address,
          addressLocality: config.name,
          addressCountry: 'KH',
        },
        aggregateRating: r.rating ? {
          '@type': 'AggregateRating',
          ratingValue: r.rating,
          reviewCount: r.review_count,
        } : undefined,
      },
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
            Best Yakiniku in {config.name}{config.slug === 'phnom-penh' ? '' : ', Phnom Penh'} (2026)
          </h1>

          <ExpandableText text={config.intro} />
        </header>

       <div className="grid grid-cols-1 gap-6">
  {restaurants.map((r, i) => (
    <div key={r.id}>
     
      <EstablishmentCard cafe={r} rank={i + 1} />
      <hr className="border-t border-gray-200" />
    </div>
  ))}
</div>

        {restaurants.length === 0 && (
          <p className="text-gray-500">
            No yakiniku restaurants found in {config.name} yet.
          </p>
        )}
      </div>
    </main>
  );
}