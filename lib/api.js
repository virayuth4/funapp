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