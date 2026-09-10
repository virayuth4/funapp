// app/page.js (Server Component — no "use client")

import HomeClient from "./homeClient";

async function getEstablishments() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishments`, {
    next: { revalidate: 3600 }, // cache for 1 hour, shared across requests
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default async function Page() {
  let initialData = { data: [], categories: [] };
  let initialError = null;

  try {
    initialData = await getEstablishments();
  } catch (err) {
    initialError = "Couldn't load cafes right now. Please try again.";
  }

  return (
    <HomeClient
      initialCafes={initialData.data ?? []}
      initialCategories={initialData.categories ?? []}
      initialError={initialError}
    />
  );
}