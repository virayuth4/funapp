"use client";

import { useState } from "react";
import Link from "next/link";

const TIERS = [
  {
    name: "Community Listing",
    price: "Free",
    period: "forever",
    description: "Standard submission into the random draw rotation pool.",
    badge: null,
    border: "border-neutral-800",
    features: [
      "Eligible for random spin reel",
      "Standard cafe profile card & map pin",
      "Manual team review required",
      "No guaranteed slot placement",
    ],
    cta: "Submit for Review",
    href: "#apply",
    featured: false,
  },
  {
    name: "Featured Partner",
    price: "$29",
    period: "per month",
    description: "Guaranteed draw placement plus direct spotlight recommendations.",
    badge: "Popular",
    border: "border-amber-500/80",
    features: [
      "Guaranteed slot in branch spin reels",
      "Featured 'Nearby Partner' badge under winners",
      "Priority card accent styling",
      "Review turnaround within 24 hours",
      "Monthly click & impression breakdown",
    ],
    cta: "Become a Partner",
    href: "#apply",
    featured: true,
  },
  {
    name: "Branch Takeover",
    price: "$69",
    period: "per month",
    description: "Maximum prominence across an entire district location.",
    badge: "Limited",
    border: "border-neutral-700",
    features: [
      "Everything in Featured Partner",
      "Exclusive primary sponsor for 1 district (BKK / TTP / TK)",
      "Top-tier accent card banner",
      "Direct link out to custom menu or promo URL",
      "Bi-weekly performance report",
    ],
    cta: "Reserve District",
    href: "#apply",
    featured: false,
  },
];

export default function PartnerPage() {
  const [formData, setFormData] = useState({
    cafeName: "",
    branchLocation: "BKK",
    tier: "Free",
    googleMapsUrl: "",
    contactEmail: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Connect to your API route, Airtable, or Formspree
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#0d0f12] text-neutral-100 flex flex-col items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.05),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono text-neutral-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Picker
          </Link>
        </div>

        {/* Hero Header */}
        <header className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
            For Cafe Owners
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase mt-4">
            Feature Your Cafe
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Put your venue in front of indecisive locals looking for their next coffee stop. Join our free review pool or lock in dedicated visibility.
          </p>
        </header>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl bg-neutral-950/70 border ${tier.border} p-6 flex flex-col justify-between backdrop-blur-sm shadow-xl ${
                tier.featured ? "shadow-amber-500/5 ring-1 ring-amber-500/40" : ""
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-2.5 right-4 text-[9px] font-mono font-bold tracking-widest uppercase text-black bg-amber-400 px-2 py-0.5 rounded shadow-sm">
                  {tier.badge}
                </span>
              )}

              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {tier.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{tier.price}</span>
                  <span className="text-[11px] font-mono text-neutral-500">/{tier.period}</span>
                </div>
                <p className="mt-2 text-xs text-neutral-400 leading-snug">
                  {tier.description}
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-neutral-900 pt-5">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                      <span className="text-amber-400 font-bold text-xs mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={tier.href}
                onClick={() => setFormData((prev) => ({ ...prev, tier: tier.name }))}
                className={`mt-8 w-full py-2.5 rounded text-xs font-bold uppercase tracking-wider text-center transition-all ${
                  tier.featured
                    ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/10"
                    : "bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Application Form */}
        <section
          id="apply"
          className="max-w-lg mx-auto bg-neutral-950 border border-neutral-800/80 rounded-xl p-6 sm:p-8 shadow-2xl relative"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">
              Submit Your Venue
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Free listings undergo a quality review before approval. Paid options guarantee immediate placement.
            </p>
          </div>

          {submitted ? (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center py-8">
              <span className="text-2xl mb-2 block">✓</span>
              <h4 className="text-sm font-bold text-white">Application Received</h4>
              <p className="text-xs text-neutral-400 mt-1">
                We will inspect your location and get back to you via email within 48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Cafe Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.cafeName}
                  onChange={(e) => setFormData({ ...formData, cafeName: e.target.value })}
                  placeholder="e.g. Kinship Coffee"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    District / Branch
                  </label>
                  <select
                    value={formData.branchLocation}
                    onChange={(e) => setFormData({ ...formData, branchLocation: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="BKK">BKK</option>
                    <option value="TTP">TTP</option>
                    <option value="TK">TK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Preferred Tier
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Community Listing">Community Listing (Free)</option>
                    <option value="Featured Partner">Featured Partner ($29/mo)</option>
                    <option value="Branch Takeover">Branch Takeover ($69/mo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Google Maps URL
                </label>
                <input
                  type="url"
                  required
                  value={formData.googleMapsUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="owner@cafe.com"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Notes / Specialties (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Roasting style, Wi-Fi speed, parking notes..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded text-xs uppercase tracking-widest transition-all cursor-pointer mt-2"
              >
                Send Submission
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}