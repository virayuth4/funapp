// app/sitemap.js
import { getAllEstablishmentSlugs } from '@/lib/getAllEstablishmentsBySlug';
import { CAFE_LOCATIONS } from '@/lib/seo/cafeLocations';

export default async function sitemap() {
  const baseUrl = 'https://eatdoko.com';

  // 1. Fetch dynamic establishment pages (app/[slug])
  const establishments = await getAllEstablishmentSlugs();
  const establishmentPages = establishments.map((item) => ({
    url: `${baseUrl}/${item.slug}`,
    lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 2. City / location pages
  const locationPages = Object.keys(CAFE_LOCATIONS).map((slug) => ({
    url: `${baseUrl}/best-cafes/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: slug === 'phnom-penh' ? 1.0 : 0.85,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...locationPages,
    ...establishmentPages,
  ];
}