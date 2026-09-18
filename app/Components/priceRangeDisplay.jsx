import { formatAllCurrencyPrices } from "@/lib/priceRange";

export default function PriceRangeDisplay({ priceRange, className = "" }) {
  const prices = formatAllCurrencyPrices(priceRange);

  if (prices.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-2 ${className}`}>
      {prices.map((p, i) => (
        <span key={p.currency} className="flex items-center gap-x-2">
          {i > 0 && <span className="text-gray-300">|</span>}
          {p.label}
        </span>
      ))}
    </div>
  );
}