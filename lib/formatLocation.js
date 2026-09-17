export function formatLocation(location) {
  const locations = {
    TK: "TK (Toul Kork)",
    BKK: "BKK (Boeung Keng Kang)",
    TTP: "TTP (Tuol Tompoung)",
    IFL: "IFL (Institute of Foreign Languages)",
  };

  return locations[location] || location;
}