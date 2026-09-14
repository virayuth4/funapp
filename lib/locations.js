// lib/locations.js

export const CAFE_LOCATIONS = {
  'phnom-penh': {
    slug: 'phnom-penh',
    query: '', // empty = no location filter, city-wide
    name: 'Phnom Penh',
    title: 'Best Cafe in Phnom Penh (2026) — Top 30 Coffee Shops',
    description:
      'Discover the 30 best cafes in Phnom Penh, from specialty coffee roasters to cozy work-friendly spots. Updated for 2026.',
  },
  bkk: {
    slug: 'bkk',
    query: 'BKK',
    name: 'BKK',
    title: 'Best Cafe in BKK, Phnom Penh (2026) — Top Coffee Shops',
    description:
      'The best cafes in BKK1, BKK2 and BKK3, Phnom Penh — curated list of top-rated coffee shops for 2026.',
  },
  'toul-kork': {
    slug: 'toul-kork',
    query: 'Toul Kork',
    name: 'Toul Kork',
    title: 'Best Cafe in Toul Kork, Phnom Penh (2026)',
    description:
      'Looking for the best cafe in Toul Kork? Here are the top-rated coffee shops in the area, updated for 2026.',
  },
  ifl: {
    slug: 'ifl',
    query: 'IFL',
    name: 'IFL',
    title: 'Best Cafe Near IFL, Phnom Penh (2026)',
    description:
      'The best cafes near IFL (Institute of Foreign Languages), Phnom Penh — great spots for coffee, study, and work.',
  },
};

export function getLocationConfig(slug) {
  return CAFE_LOCATIONS[slug];
}