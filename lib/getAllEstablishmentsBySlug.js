export async function getAllEstablishmentSlugs() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishment/eatdoko-establishments/slugs`,
    { next: { revalidate: 86400 } } // Revalidate once a day
  );

  if (!res.ok) {
    console.error('Failed to fetch slugs for sitemap');
    return [];
  }

  const { data } = await res.json();
  return data || [];
}