export default function TagList({
  tags,
  max = 6,
  variant = "default",
  className = "",
}) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  const visibleTags = tags.slice(0, max);
  const extraCount = tags.length - visibleTags.length;

  const variants = {
    default: "border-gray-200 text-gray-500",
    accent: "border-rose-200 text-rose-600",
    dark: "border-gray-700 text-gray-300",
  };

const tagClasses = `rounded border px-1.5 py-0.5 text-[10px] first-letter:uppercase ${
  variants[variant] ?? variants.default
}`;
  return (
    <div className={`flex flex-wrap gap-1 pt-0.5 ${className}`}>
      {visibleTags.map((tag) => (
        <span key={tag} className={tagClasses}>
          {tag}
        </span>
      ))}

      {extraCount > 0 && (
        <span className={tagClasses}>+{extraCount}</span>
      )}
    </div>
  );
}