"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CafeListView from "../Components/cafeListViews";

// ---- Field names on each establishment record. Change these to match your DB. ----
const TYPE_FIELD = "category";
const LOCATION_FIELD = "location";
const getCuisines = (item) => toList(item.cuisines ?? item.cuisine);
const getTags = (item) => toList(item.tags);

const CATEGORIES = [
  { value: "cafe", label: "Cafes" },
  { value: "restaurant", label: "Restaurants" },
    { value: "cafe,bakery", label: "Cafe & Bakeries" },
];

// ---- helpers ----
const normalize = (v) => String(v ?? "").trim().toLowerCase();
// "restaurant"/"restaurants" and "cafe"/"cafes" count as the same category.
const typeKey = (v) => normalize(v).replace(/s$/, "");

function toList(v) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    if (s.startsWith("[")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return toList(parsed);
      } catch {
        // not JSON, fall through to comma split
      }
    }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

// Builds [{ value, label, count }] from a list of items, merging casing differences.
function buildFacet(items, getValues) {
  const map = new Map();
  for (const item of items) {
    const seen = new Set();
    for (const label of getValues(item)) {
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = map.get(key);
      if (entry) entry.count += 1;
      else map.set(key, { value: key, label, count: 1 });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
}

const toggleIn = (setter) => (value) =>
  setter((prev) =>
    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
  );

const NO_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// ---- small UI pieces ----
function FiltersIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 5h9M16 5h1M3 10h3M10 10h7M3 15h11M18 15h-1" />
      <circle cx="14" cy="5" r="1.8" />
      <circle cx="8" cy="10" r="1.8" />
      <circle cx="16" cy="15" r="1.8" />
    </svg>
  );
}

function Chip({ active, onClick, count, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
        active
          ? "border-amber-500 bg-amber-500 font-semibold text-black"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-amber-500"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`ml-1.5 text-xs ${active ? "text-black/60" : "text-neutral-400"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-b border-neutral-200 py-5 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

// ---- main component ----
export default function ExploreClient({ initialCafes,  initialError }) {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState("restaurant");
  const [locations, setLocations] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [tags, setTags] = useState([]);
  const [open, setOpen] = useState(false);

  const cafes = initialCafes || [];
  const error = initialError || null;



  // Step 1: category
  const typeFiltered = useMemo(
    () => cafes.filter((c) => typeKey(c[TYPE_FIELD]) === typeKey(selectedType)),
    [cafes, selectedType]
  );

  // Step 2: filter options come from the current category only
  const locationOptions = useMemo(
    () => buildFacet(typeFiltered, (c) => toList(c[LOCATION_FIELD])),
    [typeFiltered]
  );
  const cuisineOptions = useMemo(() => buildFacet(typeFiltered, getCuisines), [typeFiltered]);
  const tagOptions = useMemo(() => buildFacet(typeFiltered, getTags), [typeFiltered]);

  // Step 3: apply. Different groups combine with AND, values inside a group with OR.
  const filteredCafes = useMemo(() => {
    return typeFiltered.filter((cafe) => {
      if (locations.length && !locations.includes(normalize(cafe[LOCATION_FIELD]))) {
        return false;
      }
      if (cuisines.length) {
        const own = getCuisines(cafe).map(normalize);
        if (!cuisines.some((c) => own.includes(c))) return false;
      }
      if (tags.length) {
        const own = getTags(cafe).map(normalize);
        if (!tags.some((t) => own.includes(t))) return false;
      }
      return true;
    });
  }, [typeFiltered, locations, cuisines, tags]);

  const activeCount = locations.length + cuisines.length + tags.length;

  // Removable chips shown under the tabs
  const activeChips = useMemo(() => {
    const labelOf = (options, value) =>
      options.find((o) => o.value === value)?.label || value;
    return [
      ...locations.map((v) => ({ group: "location", value: v, label: labelOf(locationOptions, v) })),
      ...cuisines.map((v) => ({ group: "cuisine", value: v, label: labelOf(cuisineOptions, v) })),
      ...tags.map((v) => ({ group: "tag", value: v, label: labelOf(tagOptions, v) })),
    ];
  }, [locations, cuisines, tags, locationOptions, cuisineOptions, tagOptions]);

  const removeChip = (chip) => {
    const drop = (setter) => setter((prev) => prev.filter((v) => v !== chip.value));
    if (chip.group === "location") drop(setLocations);
    else if (chip.group === "cuisine") drop(setCuisines);
    else drop(setTags);
  };

  const clearAll = () => {
    setLocations([]);
    setCuisines([]);
    setTags([]);
  };

  const changeType = (value) => {
    if (typeKey(value) === typeKey(selectedType)) return;
    setSelectedType(value);
    clearAll(); // options differ per category, so old selections would be stale
  };

  // Modal behaviour: Escape closes, page behind doesn't scroll
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasAnyFacet =
    locationOptions.length > 0 || cuisineOptions.length > 0 || tagOptions.length > 0;

  const resultLabel = `${filteredCafes.length} ${filteredCafes.length === 1 ? "place" : "places"}`;

  return (
    <main className="min-h-screen overflow-x-clip bg-white text-neutral-900">
      {/* Title */}
      <header className="mx-auto max-w-3xl px-4 pb-6 pt-18 text-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-wider text-black sm:text-4xl">
          Eat Where Local Eats
        </h1>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          Browse where locals in Cambodia actually go.
        </p>
      </header>

      {/* Sticky bar: category tabs + Filters button + active filter chips */}
      {!error && (
        <div className="top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-2">
           <div className={`flex min-w-0 flex-1 items-center gap-5 overflow-x-auto ${NO_SCROLLBAR}`}>
            {CATEGORIES.map((t) => {
              const active = typeKey(selectedType) === typeKey(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => changeType(t.value)}
                  className={`shrink-0 cursor-pointer whitespace-nowrap border-b-2 pb-2 pt-1 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    active
                      ? "border-amber-500 font-semibold text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              className="mb-2 inline-flex shrink-0 cursor-pointer items-center gap-2  bg-white px-3.5 py-1.5 text-sm font-semibold text-neutral-900  transition-colors hover:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
            >
              <FiltersIcon />
              Filters
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-black">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {activeChips.length > 0 && (
            <div className="mx-auto max-w-3xl px-4 pb-3 pt-1">
              <div className={`flex items-center gap-2 overflow-x-auto ${NO_SCROLLBAR}`}>
                {activeChips.map((chip) => (
                  <button
                    key={`${chip.group}:${chip.value}`}
                    type="button"
                    onClick={() => removeChip(chip)}
                    aria-label={`Remove ${chip.label} filter`}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-200"
                  >
                    {chip.label}
                    <span aria-hidden="true" className="text-amber-700">×</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="shrink-0 cursor-pointer whitespace-nowrap text-xs text-neutral-500 underline hover:text-neutral-800"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-xs text-red-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="cursor-pointer text-amber-600 underline hover:text-amber-500"
          >
            Retry
          </button>
        </div>
      )}

      {/* List */}
      {!error && (
        <div className="pb-16">
          <CafeListView cafes={filteredCafes} theme="light" isHome={false} />

          {filteredCafes.length === 0 && activeCount > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={clearAll}
                className="cursor-pointer text-sm font-medium text-amber-600 underline hover:text-amber-500"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters panel: bottom sheet on mobile, centered dialog on sm+ */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white text-neutral-900 shadow-xl sm:max-w-lg sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h2 className="text-base font-bold">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="h-8 w-8 cursor-pointer rounded-full text-xl leading-none text-neutral-500 hover:bg-neutral-100"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              {locationOptions.length > 0 && (
                <Section title="Location">
                  {locationOptions.map((o) => (
                    <Chip
                      key={o.value}
                      count={o.count}
                      active={locations.includes(o.value)}
                      onClick={() => toggleIn(setLocations)(o.value)}
                    >
                      {o.label}
                    </Chip>
                  ))}
                </Section>
              )}

              {cuisineOptions.length > 0 && (
                <Section title="Cuisine">
                  {cuisineOptions.map((o) => (
                    <Chip
                      key={o.value}
                      count={o.count}
                      active={cuisines.includes(o.value)}
                      onClick={() => toggleIn(setCuisines)(o.value)}
                    >
                      {o.label}
                    </Chip>
                  ))}
                </Section>
              )}

              {tagOptions.length > 0 && (
                <Section title="Tags">
                  {tagOptions.map((o) => (
                    <Chip
                      key={o.value}
                      count={o.count}
                      active={tags.includes(o.value)}
                      onClick={() => toggleIn(setTags)(o.value)}
                    >
                      {o.label}
                    </Chip>
                  ))}
                </Section>
              )}

              {!hasAnyFacet && (
                <p className="py-6 text-sm text-neutral-500">
                  No location, cuisine or tag data available for {selectedType} yet.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-neutral-200 px-5 py-4">
              <button
                type="button"
                onClick={clearAll}
                disabled={activeCount === 0}
                className="cursor-pointer text-sm font-medium text-neutral-700 underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto cursor-pointer rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-black shadow-md shadow-amber-500/20 transition-colors hover:bg-amber-400"
              >
                Show {resultLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}