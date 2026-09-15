
// Replace with your actual Instagram handle
const INSTAGRAM_URL = "https://instagram.com/eatdoko.kh";
const INSTAGRAM_HANDLE = "@eatdoko.kh";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-3">
          Contact Us
        </h1>
        <p className="text-neutral-600 mb-8">
          Got a question, feedback, or looking for partnership? The fastest way
          to reach us is over on Instagram — drop us a message and we&apos;ll
          get back to you.
        </p>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
        >
         
          Message us on Instagram
        </a>

        <p className="mt-6 text-sm text-neutral-400">
          {INSTAGRAM_HANDLE}
        </p>
      </div>
    </main>
  );
}