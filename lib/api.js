// lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_BACKEND; 



export async function getCafes(locationQuery, limit = 30) {
  const params = new URLSearchParams({ category: 'cafe', limit: String(limit) });
  if (locationQuery) params.set('location', locationQuery);
    console.log("fetching from",`${API_BASE}/api/eatdoko/seo/best-cafes?${params.toString()}` )
  const res = await fetch(`${API_BASE}/api/eatdoko/seo/best-cafes?${params.toString()}`, {
    next: { revalidate: 10 }, // ISR — regenerate hourly
  });

  if (!res.ok) throw new Error('Failed to fetch cafes');
  const json = await res.json();
  return json.data;
}

export async function getEstablishments(category, locationQuery, limit = 30) {
 const endpointByCategory = {
  cafe: 'best-cafes',
  restaurant: 'best-yakiniku',
  bakery: 'best-bakeries',
};
  const endpoint = endpointByCategory[category];
  if (!endpoint) throw new Error(`Unsupported establishment category: ${category}`);

  const params = new URLSearchParams({ limit: String(limit) });
  if (locationQuery) params.set('location', locationQuery);

  const url = `${API_BASE}/api/eatdoko/seo/${endpoint}?${params.toString()}`;
  console.log("fetching from", url);

  const res = await fetch(url, {
    next: { revalidate: 3600 }, // ISR — regenerate hourly
  });

  if (!res.ok) throw new Error(`Failed to fetch ${category} establishments`);
  const json = await res.json();
  // console.log("Yakiniku Data", json.data)
  return json.data;
}