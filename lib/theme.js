export function getThemeColors(theme = "dark") {
  const isLight = theme === "light";
  return {
    isLight,
    titleColor: isLight ? "text-gray-900" : "text-white",
    bodyColor: isLight ? "text-gray-600" : "text-white",
  };
}