// app/how-we-pick/page.js
// Next.js (App Router) page, plain JavaScript + Tailwind CSS.

import Link from "next/link";

export const metadata = {
  title: "How we pick | EatDoko",
  description:
    "Every cafe, restaurant, and bakery on eatdoko is chosen by a small team who visit, taste, and only list what they'd send a friend to.",
};


export default function HowWePickPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-neutral-900">How we pick</h1>

        <p className="mt-4 leading-relaxed text-neutral-600">
          Every place on EatDoko was personally chosen by our small team. We visit,
          order what it&apos;s known for, and only add it to the list if we genuinely
          enjoyed it and would go back ourselves.
        </p>

      

        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-neutral-300 px-5 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}

