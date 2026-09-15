import ExploreClient from "./exploreClient";

async function getEstablishments() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishments`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const json = await res.json();

    return {
      cafes: Array.isArray(json.data) ? json.data : [],
      categories: Array.isArray(json.categories) ? json.categories : [],
      error: null,
    };
  } catch (err) {
    console.error("Failed to fetch establishments:", err);
    return {
      cafes: [],
      categories: [],
      error: "Couldn't load establishments right now. Please try again.",
    };
  }
}

export default async function ExplorePage() {
  const { cafes, categories, error } = await getEstablishments();

  return (
    <ExploreClient
      initialCafes={cafes}
      initialCategories={categories}
      initialError={error}
    />
  );
}