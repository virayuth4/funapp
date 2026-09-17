// app/sitemap.js
import { CAFE_LOCATIONS } from '@/lib/locations';
// import { getAllCafes } from '@/lib/api'; // uncomment when /cafe/[slug] exists

export default async function sitemap() {
  const baseUrl = 'https://eatdoko.com';

  const locationPages = Object.keys(CAFE_LOCATIONS).map((slug) => ({
    url: `${baseUrl}/best-cafes/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: slug === 'phnom-penh' ? 1.0 : 0.8,
  }));

  // Once /cafe/[slug] is live, fetch every cafe and map it in:
  // const cafes = await getAllCafes();
  // const cafePages = cafes.map((cafe) => ({
  //   url: `${baseUrl}/cafe/${cafe.slug}`,
  //   lastModified: cafe.updated_at ? new Date(cafe.updated_at) : new Date(),
  //   changeFrequency: 'monthly',
  //   priority: 0.6,
  // }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    ...locationPages,
    // ...cafePages,
  ];
}