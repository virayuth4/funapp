// lib/locations.js

export const CAFE_LOCATIONS = {
  'phnom-penh': {
    slug: 'phnom-penh',
    query: '', // empty = no location filter, city-wide
    name: 'Phnom Penh',
    title: 'Best Cafe in Phnom Penh (2026) — Top 30 Coffee Shops',
    description:
      'The 30 best cafes in Phnom Penh for 2026 — specialty roasters, cozy work spots, and top-rated coffee shops citywide.',
    intro:
      "Phnom Penh's cafe scene has grown into one of Southeast Asia's most exciting, blending Cambodian coffee culture with a wave of specialty roasters, minimalist workspaces, and Instagram-worthy interiors. Whether you're after a strong iced kafae tuk kroeuh from a street-side stall, a single-origin pour-over from a third-wave roaster, or a quiet corner with reliable wifi to work from for the afternoon, this list rounds up the top-rated cafes across the city — from riverside spots near the Mekong to neighborhood favorites tucked into BKK, Toul Kork, and beyond. Rankings are based on customer ratings, review volume, and consistency, and the list is refreshed regularly for 2026.",
  },
  bkk: {
    slug: 'bkk',
    query: 'BKK',
    name: 'BKK',
    title: 'Best Cafe in BKK, Phnom Penh (2026) — Top Coffee Shops',
    description:
      'Top-rated cafes in BKK1, BKK2 and BKK3, Phnom Penh — specialty coffee, brunch spots, and work-friendly cafes for 2026.',
    intro:
      "BKK — spanning BKK1, BKK2, and BKK3 — is Phnom Penh's most cafe-dense neighborhood, home to the city's expat community, boutique offices, and a dense cluster of specialty coffee shops. It's the go-to area for remote workers and digital nomads thanks to reliable wifi, air-conditioned seating, and a steady supply of flat whites and matcha lattes. This list covers the best-reviewed cafes across BKK1's leafy streets, BKK2's quieter residential pockets, and BKK3's up-and-coming spots, ranked by rating and review count so you can find a reliable place to work, meet, or just get a good cup of coffee.",
  },
  tk: {
    slug: 'tk',
    query: 'Toul Kork',
    name: 'Toul Kork',
    title: 'Best Cafe in Toul Kork, Phnom Penh (2026)',
    description:
      'The best cafes in Toul Kork, Phnom Penh — top-rated coffee shops for 2026, from local roasters to work-friendly spots.',
    intro:
      "Toul Kork is one of Phnom Penh's more residential districts, popular with local families and increasingly with young professionals looking for cafes outside the busier BKK area. The neighborhood's coffee scene has quietly expanded in recent years, with a mix of locally-owned roasters, bakery-cafes, and larger work-friendly spaces spread along its wide, tree-lined streets. This list highlights the top-rated cafes in Toul Kork for 2026, based on customer reviews, so whether you live nearby or are just passing through, you'll find a solid spot for coffee, breakfast, or a few hours of focused work.",
  },
  ifl: {
    slug: 'ifl',
    query: 'IFL',
    name: 'IFL',
    title: 'Best Cafe Near IFL, Phnom Penh (2026)',
    description:
      'Top cafes near IFL (Institute of Foreign Languages), Phnom Penh — great spots for coffee, study, and group work.',
    intro:
      "The area around IFL (the Institute of Foreign Languages at the Royal University of Phnom Penh) is a hub for students, thanks to its mix of affordable eateries and study-friendly cafes. Between classes or during exam season, students and locals alike gravitate toward cafes here for strong coffee, quiet seating, and wifi that can handle hours of studying or group project work. This list rounds up the best-rated cafes near IFL for 2026, so students and visitors can quickly find a reliable spot to settle in.",
  },
};

export function getLocationConfig(slug) {
  return Object.values(CAFE_LOCATIONS).find((c) => c.slug === slug);
}