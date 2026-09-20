// lib/seo/koreanBbqLocations.js
export const KOREAN_RESTAURANTS_LOCATIONS = {
  'phnom-penh': {
    slug: 'phnom-penh',
    query: '', // empty = city-wide
    name: 'Phnom Penh',
    title: 'Best Korean BBQ in Phnom Penh (2026) — Top Korean Grill Restaurants',
    description:
      'The best Korean BBQ restaurants in Phnom Penh for 2026 — samgyeopsal, galbi, and all-you-can-eat grill spots across the city.',
    intro:
      "Korean BBQ is one of Phnom Penh's most popular group dining options, with grill restaurants serving everything from pork belly and marinated galbi to all-you-can-eat set menus. This list rounds up the top-rated Korean BBQ restaurants in the city based on customer ratings and review volume, and is refreshed regularly for 2026.",
  },
  bkk: {
    slug: 'bkk',
    query: 'BKK',
    name: 'BKK',
    title: 'Best Korean BBQ in BKK, Phnom Penh (2026)',
    description:
      'Top-rated Korean BBQ restaurants in BKK1, BKK2 and BKK3, Phnom Penh for 2026.',
    intro:
      'BKK has a strong mix of Korean grill restaurants, from casual spots to more polished venues. This list covers the best-reviewed Korean BBQ in the area, ranked by rating and review count.',
  },
  tk: {
    slug: 'tk',
    query: 'Toul Kork',
    name: 'Toul Kork',
    title: 'Best Korean BBQ in Toul Kork, Phnom Penh (2026)',
    description:
      'The best Korean BBQ restaurants in Toul Kork, Phnom Penh for 2026.',
    intro:
      'Toul Kork has a growing number of Korean BBQ restaurants that suit family dinners and group nights out. This list highlights the top-rated options in the neighborhood for 2026, based on customer reviews.',
  },
};

export function getKoreanBbqLocationConfig(slug) {
  return Object.values(KOREAN_BBQ_LOCATIONS).find((c) => c.slug === slug);
}