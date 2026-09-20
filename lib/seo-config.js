// lib/seo-config.js
export const YEAR = 2026;
export const LIMIT = 30;

const SITE = 'https://eatdoko.com';

// Locations are shared across all collections
export const LOCATIONS = {
  'phnom-penh': { name: 'Phnom Penh', phrase: 'in Phnom Penh', query: '' },
  bkk: { name: 'BKK', phrase: 'in BKK, Phnom Penh', query: 'BKK' },
  tk: { name: 'Toul Kork', phrase: 'in Toul Kork, Phnom Penh', query: 'Toul Kork' },
  ifl: { name: 'IFL', phrase: 'near IFL, Phnom Penh', query: 'IFL' },
};

export const COLLECTIONS = {
  'best-cafes': {
    slug: 'best-cafes',
    plural: 'Cafes',
    noun: 'cafes',
    apiPath: 'best-cafes',
    schemaType: 'CafeOrCoffeeShop',
    detailPath: 'cafe',
    ogImage: '/eat-doko-1200.png',
    locations: ['phnom-penh', 'bkk', 'tk', 'ifl'],
    // Unique copy per combination is what keeps these from being thin/duplicate pages
    intros: {
      'phnom-penh': "Phnom Penh's cafe scene has grown into one of Southeast Asia's most exciting...",
      bkk: "BKK is Phnom Penh's most cafe-dense neighborhood...",
      tk: 'Toul Kork is one of Phnom Penh’s more residential districts...',
      ifl: 'The area around IFL is a hub for students...',
    },
  },
  'best-yakiniku': {
    slug: 'best-yakiniku',
    plural: 'Yakiniku Restaurants',
    noun: 'yakiniku restaurants',
    apiPath: 'best-yakiniku',
    schemaType: 'Restaurant',
    detailPath: 'restaurant',
    ogImage: '/eat-doko-1200.png',
    locations: ['phnom-penh', 'bkk', 'tk'],
    intros: {
      'phnom-penh': '...',
      bkk: '...',
      tk: '...',
    },
  },
  'best-bakeries': {
    slug: 'best-bakeries',
    plural: 'Bakeries',
    noun: 'bakeries',
    apiPath: 'best-bakeries',
    schemaType: 'Bakery',
    detailPath: 'bakery',
    ogImage: '/eat-doko-1200.png',
    locations: ['phnom-penh', 'bkk', 'tk'],
    intros: { 'phnom-penh': '...', bkk: '...', tk: '...' },
  },
};

export function getPage(collectionSlug, locationSlug) {
  const collection = COLLECTIONS[collectionSlug];
  const location = LOCATIONS[locationSlug];
  if (!collection || !location || !collection.locations.includes(locationSlug)) return null;

  const heading = `Best ${collection.plural} ${location.phrase} (${YEAR})`;
  return {
    collection,
    location,
    heading,
    title: `${heading} — Top ${LIMIT}`,
    description: `The ${LIMIT} best ${collection.noun} ${location.phrase} for ${YEAR}, ranked by customer ratings and reviews.`,
    intro: collection.intros[locationSlug] ?? null,
    url: `${SITE}/${collection.slug}/${location.slug ?? locationSlug}`,
  };
}

export function getAllParams() {
  return Object.values(COLLECTIONS).flatMap((c) =>
    c.locations.map((location) => ({ collection: c.slug, location }))
  );
}