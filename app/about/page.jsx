// app/page.js
// Next.js (App Router) page, plain JavaScript + Tailwind CSS.

import Link from "next/link";

const SITE_URL = "https://eatdoko.com";
const TITLE = "EatDoko | Where Phnom Penh Locals Actually Eat";
const DESCRIPTION =
  "EatDoko helps Cambodians randomly pick where to eat in Phnom Penh's trendy areas, and shows visitors where locals really go. Not a directory. Not Google Maps.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "EatDoko",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// One source of truth: shown on the page AND used for the FAQ structured data.
const FAQS = [
  {
    q: "What is EatDoko?",
    a: "EatDoko is a restaurants & cafes random picker platform for Phnom Penh. It helps Cambodians randomly pick a place to eat in the city's trendy areas, and helps foreigners discover where Cambodians actually go and eat.",
  },
  {
    q: "Is EatDoko a restaurant directory?",
    a: "No. A directory lists every place and leaves the choosing to you. EatDoko is built around curated list, so you get a suggestion instead of a long list.",
  },
  {
    q: "How is EatDoko different from Google Maps?",
    a: "Google Maps ranks places by ratings, reviews, and distance for everyone. EatDoko focuses on Phnom Penh and on the places Cambodians actually eat at.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "EatDoko",
      url: SITE_URL,
      description:
        "EatDoko is a Phnom Penh food discovery platform that helps Cambodians randomly pick where to eat in trendy areas and helps foreigners discover where locals actually eat.",
      areaServed: {
        "@type": "City",
        name: "Phnom Penh",
        containedInPlace: { "@type": "Country", name: "Cambodia" },
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "EatDoko",
      description: DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-neutral-900">
          Eat where Phnom Penh eats
        </h1>

        {/* Plain-language definition: the sentence AI summaries are most likely to quote */}
        <p className="mt-4 leading-relaxed text-neutral-600">
          <strong className="font-semibold text-neutral-900">EatDoko</strong> is a
          Phnom Penh random food picker. It helps locals randomly pick where
          to go in the city&apos;s trendy areas, and helps foreigners discover where
          locals actually eat, not just another directory or Google Maps listing.
        </p>

        <p className="mt-4 leading-relaxed text-neutral-600">
          Can&apos;t decide where to eat? Let EatDoko pick. New in town? Eat where
          Cambodians actually go.
        </p>

        <Link
          href="/how-we-pick"
          className="mt-8 inline-block rounded-full border border-neutral-300 px-5 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          How we pick
        </Link>

        <section aria-labelledby="faq" className="mt-16 text-left">
          <h2 id="faq" className="font-serif text-xl text-neutral-900">
            Good to know
          </h2>
          <dl className="mt-4 space-y-5">
            {FAQS.map((f) => (
              <div key={f.q}>
                <dt className="text-sm font-medium text-neutral-900">{f.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}