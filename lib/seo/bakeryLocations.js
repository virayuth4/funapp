// lib/bakeryLocations.js

export const BAKERY_LOCATIONS = {
  'phnom-penh': {
    slug: 'phnom-penh',
    query: '', // empty = city-wide
    cuisine: 'bakery',
    name: 'Phnom Penh',
    title: 'Best Bakeries in Phnom Penh (2026) — Top Bakeries & Patisseries',
    description:
      'The best bakeries in Phnom Penh for 2026 — fresh bread, croissants, cakes, and pastries from top-rated bakeries and patisseries citywide.',
    intro:
      "Phnom Penh's bakery scene blends French colonial heritage with a growing wave of modern patisseries and Japanese-style bakeries. From classic baguettes and buttery croissants to custom cakes and creative pastries, the city has a bakery for every craving, with standout spots across BKK, Toul Kork, and the riverside area. This list rounds up the top-rated bakeries in Phnom Penh, based on customer ratings and review volume, covering everything from neighborhood bread shops to boutique patisseries worth a special trip. The list is refreshed regularly for 2026.",
  },
  bkk: {
    slug: 'bkk',
    query: 'BKK',
    cuisine: 'bakery',
    name: 'BKK',
    title: 'Best Bakeries in BKK, Phnom Penh (2026)',
    description:
      'Top-rated bakeries and patisseries in BKK1, BKK2 and BKK3, Phnom Penh for 2026.',
    intro:
      "BKK is one of Phnom Penh's best neighborhoods for bakeries, with a dense mix of artisan bread shops, French-style patisseries, and cafe-bakeries that draw both the expat and local crowds. From polished BKK1 boutiques to more casual spots in BKK2 and BKK3, this list covers the best-reviewed bakeries in the area, ranked by rating and review count.",
  },
  tk: {
    slug: 'tk',
    query: 'Toul Kork',
    cuisine: 'bakery',
    name: 'Toul Kork',
    title: 'Best Bakeries in Toul Kork, Phnom Penh (2026)',
    description:
      'The best bakeries and patisseries in Toul Kork, Phnom Penh for 2026.',
    intro:
      "Toul Kork has become a reliable neighborhood for fresh bread, cakes, and pastries, with bakeries serving the area's families and young professionals. This list highlights the top-rated bakeries in Toul Kork for 2026, based on customer reviews.",
  },
};

export function getBakeryLocationConfig(slug) {
  return Object.values(BAKERY_LOCATIONS).find((c) => c.slug === slug);
}