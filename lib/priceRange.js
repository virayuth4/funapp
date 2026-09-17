export const CURRENCY_RATES = {
  USD: 1,
  JPY: 154.98,
  CNY: 7.2,
};

export function splitPriceRange(priceRange) {
  if (!priceRange) return null;

  const [min, max] = String(priceRange)
    .split("-")
    .map((value) => Number(value.trim()));

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return null;
  }

  return {
    min,
    max,
  };
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