// lib/api.js
const API_BASE = process.env.NEXT_PUBLIC_BACKEND;

export async function getEstablishments(type, locationQuery, limit = 30) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (locationQuery) params.set('location', locationQuery);

  const res = await fetch(
    `${API_BASE}/api/eatdoko/seo/best/${type}?${params.toString()}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) throw new Error(`Failed to fetch ${type}`);
  const { data } = await res.json();
  return data;
}