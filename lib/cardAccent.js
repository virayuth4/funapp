export const CARD_ACCENTS = [
  { name: "Popular", color: "#4b69ff", bg: "from-blue-600/20 to-transparent", border: "border-blue-500" },
  { name: "Trending", color: "#8847ff", bg: "from-purple-600/20 to-transparent", border: "border-purple-500" },
  { name: "Top Pick", color: "#d32ce6", bg: "from-pink-600/20 to-transparent", border: "border-pink-500" },
  { name: "Featured", color: "#eb4b4b", bg: "from-red-600/20 to-transparent", border: "border-red-500" },
  { name: "Signature", color: "#ffd700", bg: "from-amber-400/25 to-transparent", border: "border-yellow-400" },
  { name: "New", color: "#4b69ff", bg: "from-green-600/20 to-transparent", border: "border-green-500" },
  { name: "Staff Favorite", color: "#22d3ee", bg: "from-cyan-500/25 to-transparent", border: "border-cyan-400" },
  { name: "Hidden Gem", color: "#10b981", bg: "from-emerald-600/20 to-transparent", border: "border-emerald-500" },
];

export const ACCENT_MAP = Object.fromEntries(CARD_ACCENTS.map((a) => [a.name, a]));
export const DEFAULT_ACCENT = CARD_ACCENTS[0];