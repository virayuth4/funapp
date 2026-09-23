// app/careers/page.js
// Next.js App Router page (JavaScript, Tailwind CSS, no TypeScript)
//
// This is a server component by default (no "use client"), so all job
// content — including the JobPosting structured data — is present in the
// initial HTML response. That's what makes it crawlable: Google for Jobs,
// Indeed, LinkedIn and other job-board bots read static HTML + JSON-LD,
// they don't execute client-side JS to discover postings.

const SITE_URL = "https://eatdoko.com";
const ORG_NAME = "EatDoko";
const ORG_LOGO = `${SITE_URL}/logo.png`; // swap for your real logo path

// ---------------------------------------------------------------------
// Job data — edit this array when a role opens, closes, or changes.
// Everything on the page (visible content + JSON-LD) is generated from it,
// so you only maintain one source of truth.
// ---------------------------------------------------------------------
const jobs = [
  {
    slug: "seo-specialist",
    title: "SEO Specialist",
    number: "01",
    type: "PART_TIME",
    typeLabel: "Part-time",
    location: "Phnom Penh, Cambodia",
    remote: "On-site / hybrid",
    datePosted: "2026-09-22",
    validThrough: "2026-11-22",
    blurb:
      "Help foreigners living in and visiting Phnom Penh actually find us. You'll own how EatDoko shows up in search, from technical fundamentals to content built for an expat audience.",
    about:
      "EatDoko is a randomizer for Phnom Penh's cafes and restaurants — spin it and it picks a spot for you. Every listing is hand-curated, not scraped, which means the site lives or dies on people finding it in the first place. Right now most of our growth is word of mouth. We're hiring someone to turn that into organic search growth, with a specific focus on foreigners living in or relocating to Phnom Penh who are searching for where to eat.",
    responsibilities: [
      "Audit and improve on-page, technical, and local SEO across eatdoko.com",
      "Build content and landing pages aimed at foreigners and expats in Phnom Penh — search behavior, terminology, and intent differ from local Khmer users, and our targeting should reflect that",
      "Research keywords around expat-relevant queries (e.g. \"best cafes for foreigners in BKK Phnom Penh\", \"where to eat as an expat in Phnom Penh\") and shape listing copy and category pages around them",
      "Work with structured data (schema.org) across restaurant/cafe listings to improve rich results",
      "Track rankings, organic traffic, and conversion from search to spins, and report on what's working",
      "Partner with whoever owns dev/design to fix crawlability, indexing, and site-speed issues",
    ],
    requirements: [
      "1–3+ years doing hands-on SEO (in-house or agency) with real results you can point to",
      "Comfortable with technical SEO: crawl budget, indexing, structured data, Core Web Vitals",
      "Understands how to write and structure content for a non-Khmer-speaking, foreign audience without it feeling like a translation",
      "Familiar with tools like Google Search Console, GA4, and a keyword/rank tracker",
      "Based in Phnom Penh, or able to work Phnom Penh hours",
    ],
    niceToHave: [
      "Experience with local/map-pack SEO for a specific city",
      "Past work in food, travel, or another discovery-driven product",
      "Basic comfort reading Next.js page structure enough to flag SEO issues to a dev",
    ],
  },
  {
    slug: "it-admin",
    title: "IT Admin",
    number: "02",
    type: "FULL_TIME",
    typeLabel: "Full-time",
    location: "Phnom Penh, Cambodia",
    remote: "On-site",
    datePosted: "2026-09-22",
    validThrough: "2026-11-22",
    blurb:
      "Keep the team's hardware, accounts, and day-to-day tech running so nobody else has to think about it.",
    about:
      "As EatDoko grows past a handful of laptops and shared logins, we need one person who owns IT properly — devices, access, backups, and the small fires that come up week to week.",
    responsibilities: [
      "Set up and maintain laptops, office network, and shared equipment",
      "Manage user accounts, permissions, and access across our tools (Google Workspace, hosting, analytics, etc.)",
      "Own basic security hygiene: password policy, device encryption, backups, offboarding checklists",
      "Be the first line of support when someone's tech breaks — triage it yourself or loop in the right vendor",
      "Keep a simple inventory of devices, licenses, and renewals so nothing lapses quietly",
      "Support the team during office moves, new hires, and vendor changes",
    ],
    requirements: [
      "1–3+ years in an IT admin, helpdesk, or systems support role",
      "Comfortable across both Mac and Windows environments",
      "Practical knowledge of networking basics (Wi-Fi, routers, VPN) and cloud account administration",
      "Organized enough to document what you set up, not just fix it and move on",
      "Based in Phnom Penh and able to work from the office",
    ],
    niceToHave: [
      "Experience supporting a small team (under 20 people) rather than a large IT department",
      "Basic scripting for repetitive setup tasks",
      "Exposure to AWS/GCP or a CDN (we serve images through CloudFront)",
    ],
  },
];

// ---------------------------------------------------------------------
// SEO metadata for the page itself (App Router convention)
// ---------------------------------------------------------------------
export const metadata = {
  title: "Careers at EatDoko | Open Roles in Phnom Penh",
  description:
    "EatDoko is hiring in Phnom Penh: an SEO Specialist to grow our reach with foreigners and expats, and an IT Admin to keep the team running. See open roles and apply.",
  alternates: {
    canonical: `${SITE_URL}/careers`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Careers at EatDoko",
    description:
      "Open roles at EatDoko: SEO Specialist and IT Admin, based in Phnom Penh.",
    url: `${SITE_URL}/careers`,
    siteName: ORG_NAME,
    type: "website",
  },
};

// ---------------------------------------------------------------------
// JobPosting structured data (schema.org), one per role.
// This is what Google for Jobs, Indeed, LinkedIn, and similar crawlers
// actually parse to list your postings — visible page copy alone isn't
// enough for most job aggregators.
// ---------------------------------------------------------------------
function jobPostingSchema(job) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: `
      <p>${job.blurb}</p>
      <p>${job.about}</p>
      <p><strong>Responsibilities</strong></p>
      <ul>${job.responsibilities.map((r) => `<li>${r}</li>`).join("")}</ul>
      <p><strong>Requirements</strong></p>
      <ul>${job.requirements.map((r) => `<li>${r}</li>`).join("")}</ul>
    `.trim(),
    identifier: {
      "@type": "PropertyValue",
      name: ORG_NAME,
      value: job.slug,
    },
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.type,
    hiringOrganization: {
      "@type": "Organization",
      name: ORG_NAME,
      sameAs: SITE_URL,
      logo: ORG_LOGO,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Phnom Penh",
        addressCountry: "KH",
      },
    },
    jobLocationType: job.remote === "Remote" ? "TELECOMMUTE" : undefined,
    directApply: true,
  };
}

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#ffffff] text-[#123524]">
      {/* Structured data — one JobPosting block per open role */}
      {jobs.map((job) => (
        <script
          key={job.slug}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jobPostingSchema(job)),
          }}
        />
      ))}

      <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        {/* Header */}
        <header className="mb-16">
          <p className="text-sm text-[#6B6350]">EatDoko / Careers</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
            Help more people find their next spot.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#3A3A32]">
            We&lsquo;re a small team building the go-to way to decide where to eat
            in Phnom Penh. Two roles are open right now — both based here in
            the city.
          </p>
        </header>

        {/* Job listings */}
        <section aria-label="Open positions" className="space-y-14">
          {jobs.map((job) => (
            <article
              key={job.slug}
              id={job.slug}
              className="border-t border-[#D8CFB8] pt-10"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-2xl text-[#E8A33D]">
                  {job.number}
                </span>
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl">
                    {job.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#6B6350]">
                    <span className="rounded-full border border-[#D8CFB8] px-3 py-1">
                      {job.typeLabel}
                    </span>
                    <span className="rounded-full border border-[#D8CFB8] px-3 py-1">
                      {job.location}
                    </span>
                    <span className="rounded-full border border-[#D8CFB8] px-3 py-1">
                      {job.remote}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-2xl leading-relaxed text-[#3A3A32]">
                {job.blurb}
              </p>
              <p className="mt-4 max-w-2xl leading-relaxed text-[#3A3A32]">
                {job.about}
              </p>

              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="font-serif text-lg">What you'll do</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#3A3A32]">
                    {job.responsibilities.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#E8A33D]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-serif text-lg">What you'll bring</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#3A3A32]">
                    {job.requirements.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#E8A33D]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {job.niceToHave?.length > 0 && (
                    <>
                      <h3 className="mt-6 font-serif text-lg">
                        Nice to have
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#3A3A32]">
                        {job.niceToHave.map((item, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#E8A33D]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <a
                  href={`mailto:careers@eatdoko.com?subject=${encodeURIComponent(
                    `Application: ${job.title}`
                  )}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#123524] px-6 py-3 text-sm font-medium text-[#FBF6EC] transition-colors hover:bg-[#1B4A34]"
                >
                  Apply for {job.title}
                </a>
              </div>
            </article>
          ))}
        </section>

        {/* Footer note */}
        <footer className="mt-20 border-t border-[#D8CFB8] pt-8 text-sm text-[#6B6350]">
          <p>
            Don't see a fit but think you should be here anyway? Write to{" "}
            <a
              href="mailto:careers@eatdoko.com"
              className="underline underline-offset-2"
            >
              careers@eatdoko.com
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}