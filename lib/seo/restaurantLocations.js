// lib/restaurantLocations.js

export const YAKINIKU_LOCATIONS = {
  'phnom-penh': {
    slug: 'phnom-penh',
    query: '', // empty = city-wide
    cuisine: 'yakiniku',
    name: 'Phnom Penh',
    title: 'Best Yakiniku in Phnom Penh (2026) — Top Japanese BBQ Restaurants',
    description:
      'The best yakiniku restaurants in Phnom Penh for 2026 — Japanese BBQ spots for premium wagyu, all-you-can-eat grills, and quality cuts citywide.',
    intro:
      "Phnom Penh's yakiniku scene has grown quickly alongside the city's broader appetite for Japanese dining, with restaurants ranging from all-you-can-eat grill houses to premium wagyu specialists. Yakiniku — Japanese-style tableside BBQ — pairs well with Phnom Penh's social dining culture, and the city now has a solid spread of options across BKK, Toul Kork, and the riverside area. This list rounds up the top-rated yakiniku restaurants in the city, based on customer ratings and review volume, covering everything from budget-friendly grill buffets to higher-end cuts for a special night out. The list is refreshed regularly for 2026.",
  },
  bkk: {
    slug: 'bkk',
    query: 'BKK',
    cuisine: 'yakiniku',
    name: 'BKK',
    title: 'Best Yakiniku in BKK, Phnom Penh (2026)',
    description:
      'Top-rated yakiniku and Japanese BBQ restaurants in BKK1, BKK2 and BKK3, Phnom Penh for 2026.',
    intro:
      "BKK is home to a growing cluster of Japanese restaurants, and yakiniku is no exception — the neighborhood's expat and local dining crowd has made it a natural fit for tableside grill spots. From BKK1's higher-end venues to more casual options in BKK2 and BKK3, this list covers the best-reviewed yakiniku restaurants in the area, ranked by rating and review count.",
  },
  tk: {
    slug: 'tk',
    query: 'Toul Kork',
    cuisine: 'yakiniku',
    name: 'Toul Kork',
    title: 'Best Yakiniku in Toul Kork, Phnom Penh (2026)',
    description:
      'The best yakiniku and Japanese BBQ restaurants in Toul Kork, Phnom Penh for 2026.',
    intro:
      "Toul Kork's dining scene has expanded well beyond local Khmer fare in recent years, with a handful of solid yakiniku spots now serving the neighborhood's families and young professionals. This list highlights the top-rated yakiniku restaurants in Toul Kork for 2026, based on customer reviews.",
  },
};

export function getRestaurantLocationConfig(slug) {
  return Object.values(YAKINIKU_LOCATIONS).find((c) => c.slug === slug);
}