// lib/seo/createListingPage.js
import { notFound } from 'next/navigation';
import EstablishmentCard from '@/app/Components/establishmentCard';
import ListingHeader from '@/app/Components/listingHeader';
import { getEstablishments } from '@/lib/api';
import { LISTINGS } from '@/lib/seo/listings';

export function createListingPage(type) {
  const listing = LISTINGS[type];

  function generateStaticParams() {
    return Object.keys(listing.locations).map((location) => ({ location }));
  }

  async function generateMetadata({ params }) {
    const { location } = await params;
    const config = listing.getConfig(location);
    if (!config) return {};

    const url = `https://eatdoko.com/${listing.routeBase}/${config.slug}`;

    return {
      title: config.title,
      description: config.description,
      alternates: { canonical: url },
      openGraph: {
        title: config.title,
        description: config.description,
        url,
        type: 'website',
        images: [listing.ogImage],
      },
      twitter: {
        card: 'summary_large_image',
        title: config.title,
        description: config.description,
      },
    };
  }

  async function Page({ params }) {
    const { location } = await params;
    const config = listing.getConfig(location);
    if (!config) notFound();

    const items = await getEstablishments(type, config.query, 30);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: config.title,
      itemListElement: items.map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': listing.schemaType,
          name: r.name,
          image: r.logo_url,
          url: `https://eatdoko.com/restaurant/${r.slug}`,
          servesCuisine: listing.cuisine,
          address: {
            '@type': 'PostalAddress',
            streetAddress: r.address,
            addressLocality: config.name,
            addressCountry: 'KH',
          },
          aggregateRating: r.rating
            ? {
                '@type': 'AggregateRating',
                ratingValue: r.rating,
                reviewCount: r.review_count,
              }
            : undefined,
        },
      })),
    };

    return (
      <main className="relative min-h-screen w-full bg-white px-4 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />

        <div className="mx-auto w-full max-w-3xl">
          <ListingHeader category={listing.label} config={config} />

          <div className="grid grid-cols-1 gap-6">
            {items.map((r, i) => (
              <div key={r.id}>
                <EstablishmentCard cafe={r} rank={i + 1} />
                <hr className="border-t border-gray-200" />
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <p className="text-gray-500">
              No {listing.emptyLabel} found in {config.name} yet.
            </p>
          )}
        </div>
      </main>
    );
  }

  return { generateStaticParams, generateMetadata, Page };
}