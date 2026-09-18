// lib/priceRange.js
export const CURRENCY_RATES = {
  USD: 1,
  JPY: 154.98,
  CNY: 7.2,
};

const CURRENCY_SYMBOLS = {
  USD: "$",
  JPY: "¥",
  CNY: "¥",
};

export function splitPriceRange(priceRange) {
  if (!priceRange) return null;

  const [min, max] = String(priceRange)
    .split("-")
    .map((value) => Number(value.trim()));

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return null;
  }

  return { min, max };
}

export function convertPriceRange(priceRange, currency) {
  const range = splitPriceRange(priceRange);

  if (!range || !CURRENCY_RATES[currency]) {
    return null;
  }

  const rate = CURRENCY_RATES[currency];

  return {
    min: Math.round(range.min * rate),
    max: Math.round(range.max * rate),
  };
}

export function getAllCurrencyPrices(priceRange) {
  const range = splitPriceRange(priceRange);
  if (!range) return null;

  return {
    USD: convertPriceRange(priceRange, "USD"),
    CNY: convertPriceRange(priceRange, "CNY"),
    JPY: convertPriceRange(priceRange, "JPY"),
  };
}

// NEW: turns the object into an array you can .map() over in JSX,
// so every component formats currencies the same way.
export function formatAllCurrencyPrices(priceRange) {
  const all = getAllCurrencyPrices(priceRange);
  if (!all) return [];

  return Object.entries(all)
    .filter(([, value]) => value) // drop nulls
    .map(([currency, { min, max }]) => ({
      currency,
      label: `${currency} ${CURRENCY_SYMBOLS[currency]}${min}-${max}`,
    }));
}