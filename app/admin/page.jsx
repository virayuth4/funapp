// app/admin/establishments/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { convertPriceRange, getAllCurrencyPrices } from "@/lib/priceRange";
import PriceRangeDisplay from "../Components/priceRangeDisplay";

export default function AdminEstablishmentsPage() {
  const router = useRouter();

  const [establishments, setEstablishments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchEstablishments = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishments`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch establishments");
        }

        const data = await res.json();
        console.log("Data", data);

        // Adjust this if your API wraps the list differently
        setEstablishments(
          Array.isArray(data) ? data : data.data || []
        );

        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (err) {
        console.error(err);
        setError("Could not load establishments.");
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishments();
  }, []);

  const handleEdit = (id) => {
    router.push(`/admin/establishments/add?edit=true&id=${id}`);
  };

  // Normalize category list into { key, label } shape, whether the API
  // sends strings or objects like { id, name, slug }.
  const normalizedCategories = useMemo(() => {
    return categories.map((cat) => {
      if (typeof cat === "string") {
        return { key: cat, label: cat };
      }
      return {
        key: cat.slug || cat.id || cat.name,
        label: cat.name || cat.slug || String(cat.id),
      };
    });
  }, [categories]);

  // Group establishments by their category field.
  const groupedByCategory = useMemo(() => {
    const groups = {};

    for (const item of establishments) {
      const key = item.category || "uncategorized";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);
    }

    return groups;
  }, [establishments]);

  // Build final section order: known categories first (in API order),
  // then any leftover keys found in the data but not in the categories list.
  const sections = useMemo(() => {
    const knownKeys = new Set(normalizedCategories.map((c) => c.key));

    const known = normalizedCategories
      .filter((c) => groupedByCategory[c.key]?.length)
      .map((c) => ({ key: c.key, label: c.label, items: groupedByCategory[c.key] }));

    const leftoverKeys = Object.keys(groupedByCategory).filter(
      (key) => !knownKeys.has(key)
    );

    const leftover = leftoverKeys.map((key) => ({
      key,
      label: key === "uncategorized" ? "Uncategorized" : key,
      items: groupedByCategory[key],
    }));

    return [...known, ...leftover];
  }, [normalizedCategories, groupedByCategory]);

  // Sections filtered down to whichever category toggle is active.
  const visibleSections = useMemo(() => {
    if (activeCategory === "all") return sections;
    return sections.filter((section) => section.key === activeCategory);
  }, [sections, activeCategory]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">
          Establishments
        </h1>

        <button
          type="button"
          onClick={() => router.push("/admin/establishments/add")}
          className="cursor-pointer rounded-md bg-amber-500 px-4 py-2 text-xs font-mono font-semibold text-white transition-colors hover:bg-amber-400"
        >
          + Add New
        </button>
      </div>

      {!loading && !error && sections.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${
              activeCategory === "all"
                ? "bg-amber-500 text-white"
                : "border border-gray-300 text-gray-600 hover:border-amber-500 hover:text-amber-600"
            }`}
          >
            All
            <span
              className={`ml-1.5 ${
                activeCategory === "all" ? "text-amber-100" : "text-gray-400"
              }`}
            >
              {establishments.length}
            </span>
          </button>

          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveCategory(section.key)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${
                activeCategory === section.key
                  ? "bg-amber-500 text-white"
                  : "border border-gray-300 text-gray-600 hover:border-amber-500 hover:text-amber-600"
              }`}
            >
              {section.label}
              <span
                className={`ml-1.5 ${
                  activeCategory === section.key
                    ? "text-amber-100"
                    : "text-gray-400"
                }`}
              >
                {section.items.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-xs font-mono uppercase tracking-wider text-gray-400">
          Loading...
        </p>
      )}

      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && establishments.length === 0 && (
        <p className="text-xs font-mono uppercase tracking-wider text-gray-400">
          No establishments found.
        </p>
      )}

      <div className="flex flex-col gap-8">
        {visibleSections.map((section) => (
          <div key={section.key}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-500">
                {section.label}
              </h2>

              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-400">
                {section.items.length}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {section.items.map((item) => (
                <EstablishmentCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEdit(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EstablishmentCard({ item, onEdit }) {
  const image = item.image_paths?.[0] || item.logo_url;
  const hasTags = Array.isArray(item.tags) && item.tags.length > 0;

  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {image && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
          <Image
            src={image}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-gray-900">
            {item.name}
          </h3>

          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-xs font-mono font-semibold text-gray-700 transition-colors hover:border-amber-500 hover:text-amber-600"
          >
            Edit
          </button>
        </div>

        <p className="mt-0.5 truncate text-xs text-gray-500">
          {item.branch_location || item.category || "—"}
        </p>

        {item.cuisine && (
          <p className="mt-1 text-xs text-gray-500">
            <span className="font-mono uppercase tracking-wider text-gray-400">
              Cuisine:
            </span>{" "}
            {item.cuisine}
          </p>
        )}

        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-gray-600">
            {item.description}
          </p>
        )}
{item.price_range && (
  <p className="mt-1.5 text-xs text-gray-600">
    <PriceRangeDisplay priceRange={item.price_range} />
  </p>
)}

        {hasTags && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}