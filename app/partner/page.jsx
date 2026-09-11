"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "partner_application";

const TIERS = [
  {
    name: "Community Listing",
    tierValue: "Free",
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
    tierValue: "Featured",
    price: "Contact us",
    period: "for price",
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
];

export default function PartnerPage() {
  const [formData, setFormData] = useState({
    cafeName: "",
    branchLocation: "",
    tier: "Free",
    googleMapsUrl: "",
    contactTelegram: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState(null);

  // Restore saved application on load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSubmittedData(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to read submission from localStorage", err);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishment/partner/request`;

    const payload = {
      cafeName: formData.cafeName,
      location: formData.branchLocation,
      tier: formData.tier,
      googleMapsUrl: formData.googleMapsUrl,
      contactTelegram: formData.contactTelegram,
      notes: formData.notes,
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit request");
      }

      // Record payload and review status
      const savedRecord = {
        ...payload,
        status: "Pending Review",
        submittedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRecord));
      setSubmittedData(savedRecord);
    } catch (err) {
      console.error(err);
      setError("Unable to submit application. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSubmission = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSubmittedData(null);
    setFormData({
      cafeName: "",
      branchLocation: "",
      tier: "Free",
      googleMapsUrl: "",
      contactTelegram: "",
      notes: "",
    });
  };

  return (
    <main className="min-h-screen bg-[#0d0f12] text-neutral-100 flex flex-col items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.05),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono text-neutral-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Picker
          </Link>
        </div>

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

        {/* 2-Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16 max-w-3xl mx-auto">
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
                onClick={() => setFormData((prev) => ({ ...prev, tier: tier.tierValue }))}
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

        {/* Application / Status Section */}
        <section
          id="apply"
          className="max-w-lg mx-auto bg-neutral-950 border border-neutral-800/80 rounded-xl p-6 sm:p-8 shadow-2xl relative"
        >
          {submittedData ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                    {submittedData.status || "Pending Review"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  {submittedData.submittedAt
                    ? new Date(submittedData.submittedAt).toLocaleDateString()
                    : "Recently"}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  {submittedData.cafeName}
                </h3>
                <p className="text-xs text-neutral-400">
                  Your application has been received and logged in your browser. We will reach out on Telegram once reviewed.
                </p>
              </div>

              {/* Submitted Details Review Card */}
              <div className="bg-neutral-900/60 rounded-lg p-3.5 border border-neutral-800/80 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Tier</span>
                  <span className="text-neutral-200 font-semibold">{submittedData.tier}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Location</span>
                  <span className="text-neutral-200">{submittedData.location}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Telegram</span>
                  <span className="text-amber-400">{submittedData.contactTelegram}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Maps Link</span>
                  <a
                    href={submittedData.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-300 underline hover:text-white truncate max-w-[180px]"
                  >
                    {submittedData.googleMapsUrl}
                  </a>
                </div>
                {submittedData.notes && (
                  <div className="pt-2 border-t border-neutral-800/60 text-neutral-400">
                    <span className="block text-[10px] uppercase text-neutral-500 mb-0.5">Notes</span>
                    <p className="text-neutral-300 whitespace-pre-wrap font-sans text-xs">
                      {submittedData.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearSubmission}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-mono rounded transition-colors cursor-pointer"
                >
                  Submit Another Venue
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                  Submit Your Venue
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Free listings undergo a quality review before approval. Featured tier guarantees priority processing.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded">
                    {error}
                  </p>
                )}

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Cafe Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={formData.cafeName}
                    onChange={(e) => setFormData({ ...formData, cafeName: e.target.value })}
                    placeholder="e.g. Kinship Coffee"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                      Location / Area <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={formData.branchLocation}
                      onChange={(e) => setFormData({ ...formData, branchLocation: e.target.value })}
                      placeholder="e.g. BKK1, Street 302"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                      Preferred Tier <span className="text-amber-500">*</span>
                    </label>
                    <select
                      value={formData.tier}
                      disabled={loading}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      <option value="Free">Free (Community Listing)</option>
                      <option value="Featured">Featured (Contact us for price)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Google Maps URL <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    disabled={loading}
                    value={formData.googleMapsUrl}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Contact Telegram <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={formData.contactTelegram}
                    onChange={(e) => setFormData({ ...formData, contactTelegram: e.target.value })}
                    placeholder="@username or +855..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Notes / Specialties (Optional)
                  </label>
                  <textarea
                    rows={2}
                    disabled={loading}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Roasting style, Wi-Fi speed, parking notes..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold rounded text-xs uppercase tracking-widest transition-all cursor-pointer mt-2"
                >
                  {loading ? "Sending..." : "Send Submission"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}