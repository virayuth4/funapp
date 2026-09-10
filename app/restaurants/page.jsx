"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Fraunces, Public_Sans } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
});

export default function EstablishmentsPage() {
  const [establishments, setEstablishments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | idle | error
  const [errorMessage, setErrorMessage] = useState("");

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeArea, setActiveArea] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest | name

  useEffect(() => {
    let cancelled = false;

    async function loadEstablishments() {
      setStatus("loading");
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishments`,
          { method: "GET" }
        );
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json?.error || `Request failed with status ${res.status}`);
        }

        setEstablishments((json.data || []).filter((e) => e.in_roll !== false));
        setCategories(json.categories || []);
        setStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err.message || "Couldn't load places right now.");
      }
    }

    loadEstablishments();
    return () => {
      cancelled = true;
    };
  }, []);

  const areas = useMemo(() => {
    const set = new Set(
      establishments.map((e) => e.branch_location).filter((a) => a && a.trim())
    );
    return Array.from(set).sort();
  }, [establishments]);

  const filtered = useMemo(() => {
    let list = establishments;

    if (activeCategory !== "all") {
      list = list.filter((e) => e.category === activeCategory);
    }
    if (activeArea !== "all") {
      list = list.filter((e) => e.branch_location === activeArea);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      );
    }

    list = [...list];
    if (sortBy === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else {
      // "newest" — sponsored surfaces first, then by id desc as a proxy for recency
      list.sort((a, b) => {
        if (Boolean(b.is_sponsored) !== Boolean(a.is_sponsored)) {
          return Boolean(b.is_sponsored) - Boolean(a.is_sponsored);
        }
        return (b.id || 0) - (a.id || 0);
      });
    }
    return list;
  }, [establishments, activeCategory, activeArea, query, sortBy]);

  return (
    <main
      className={`${fraunces.variable} ${publicSans.variable} min-h-screen`}
      style={{ background: "#EFEADD", fontFamily: "var(--font-public-sans)" }}
    >
      {/* Hero */}
      <header style={{ background: "#211D18" }} className="px-5 pb-9 pt-12 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium tracking-normal" style={{ color: "#C9BFA8" }}>
            A running list of where to eat around Phnom Penh
          </p>
          <h1
            className="mt-2 text-4xl leading-[1.05] sm:text-5xl"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 600,
              color: "#F7F2E7",
            }}
          >
            Where Phnom Penh <em style={{ fontStyle: "italic", color: "#E2A319" }}>eats.</em>
          </h1>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B8272"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a place, a dish, a vibe…"
                className="w-full rounded-md border-0 bg-[#2B2620] py-3 pl-10 pr-4 text-sm text-[#F7F2E7] placeholder:text-[#8B8272] focus:outline-none focus:ring-2"
                style={{ ringColor: "#E2A319" }}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border-0 bg-[#2B2620] px-3 py-3 text-sm text-[#F7F2E7] focus:outline-none focus:ring-2"
            >
              <option value="newest">Newest first</option>
              <option value="name">Name, A to Z</option>
            </select>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b" style={{ borderColor: "#DCD4BF", background: "#F5F1E5" }}>
        <div className="mx-auto max-w-4xl px-5 py-4 sm:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              label="All categories"
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>

          {areas.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs" style={{ color: "#8B8272" }}>
                Area
              </span>
              <AreaChip label="All" active={activeArea === "all"} onClick={() => setActiveArea("all")} />
              {areas.map((area) => (
                <AreaChip
                  key={area}
                  label={area}
                  active={activeArea === area}
                  onClick={() => setActiveArea(area)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-10">
        {status === "loading" && (
          <div className="py-20 text-center text-sm" style={{ color: "#8B8272" }}>
            Pulling up the list…
          </div>
        )}

        {status === "error" && (
          <p className="rounded-md px-4 py-3 text-sm" style={{ background: "#F6E4E0", color: "#8A2E23" }}>
            {errorMessage}
          </p>
        )}

        {status === "idle" && (
          <>
            <p className="mb-5 text-sm" style={{ color: "#8B8272" }}>
              {filtered.length} {filtered.length === 1 ? "place" : "places"}
              {activeCategory !== "all" ? ` in ${activeCategory}` : ""}
              {activeArea !== "all" ? ` · ${activeArea}` : ""}
            </p>

            {filtered.length === 0 ? (
              <div
                className="rounded-md border border-dashed px-6 py-14 text-center"
                style={{ borderColor: "#D3C9AD" }}
              >
                <p style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.15rem", color: "#1E1B16" }}>
                  Nothing matches yet.
                </p>
                <p className="mt-1.5 text-sm" style={{ color: "#8B8272" }}>
                  Try a different category, area, or search term.
                </p>
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "#DCD4BF" }}>
                {filtered.map((est) => (
                  <EstablishmentRow key={est.id} est={est} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t px-5 py-8 sm:px-10" style={{ borderColor: "#DCD4BF" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between text-xs" style={{ color: "#8B8272" }}>
          <span>EatDoko — a personal list, not a directory of ads.</span>
          <Link href="/eatdoko/establishments/add" className="underline decoration-dotted underline-offset-2">
            Add a place
          </Link>
        </div>
      </footer>
    </main>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-3 py-1.5 text-sm capitalize transition"
      style={
        active
          ? { background: "#1E1B16", color: "#F7F2E7" }
          : { background: "transparent", color: "#4A4436", border: "1px solid #D3C9AD" }
      }
    >
      {label}
    </button>
  );
}

function AreaChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-2.5 py-1 text-xs transition"
      style={
        active
          ? { background: "#E2A319", color: "#211D18" }
          : { background: "transparent", color: "#8B8272", border: "1px solid #D3C9AD" }
      }
    >
      {label}
    </button>
  );
}

function EstablishmentRow({ est }) {
  const thumb = est.image_paths?.[0] || est.logo_url || null;

  return (
    <li className="py-5">
      <Link href={`/eatdoko/${est.slug}`} className="group flex gap-4 sm:gap-6">
        <div
          className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md sm:h-32 sm:w-40"
          style={{ background: "#E3DCC9" }}
        >
          {thumb ? (
            <img
              src={thumb}
              alt={est.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: "#A79C82" }}>
              No photo
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2
              className="text-lg leading-tight"
              style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600, color: "#1E1B16" }}
            >
              {est.name}
            </h2>
            {est.accent && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: "#B23A2E", color: "#FBEDE9" }}
              >
                {est.accent}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {est.category && (
              <span
                className="rounded-full px-2 py-0.5 text-xs capitalize"
                style={{ background: "#E3DCC9", color: "#4A4436" }}
              >
                {est.category}
              </span>
            )}
            {est.branch_location && (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: "transparent", color: "#8B8272", border: "1px solid #D3C9AD" }}
              >
                {est.branch_location}
              </span>
            )}
          </div>

          {est.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-snug" style={{ color: "#5C5646" }}>
              {est.description}
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-4 text-xs" style={{ color: "#8B8272" }}>
            {est.map && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(est.map, "_blank", "noopener,noreferrer");
                }}
                className="underline decoration-dotted underline-offset-2"
              >
                Map
              </button>
            )}
            {est.instagram && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const handle = est.instagram.replace(/^@/, "");
                  const url = handle.startsWith("http") ? handle : `https://instagram.com/${handle}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
                className="underline decoration-dotted underline-offset-2"
              >
                Instagram
              </button>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}