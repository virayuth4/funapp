export async function getEstablishmentBySlug(slug) {
      console.log("Sending request to ", `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishment/eatdoko-establishments/slug/${slug}`)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishment/eatdoko-establishments/slug/${slug}`,
    { next: { revalidate: 3600 } } // ISR, 1hr — matches your backend cache
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch establishment');

  const { data } = await res.json();
  return data;
}

