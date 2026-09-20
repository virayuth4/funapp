export function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatList(arr = []) {
  return arr.map(capitalizeFirst).join(", ");
}