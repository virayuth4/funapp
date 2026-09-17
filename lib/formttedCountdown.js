export default function formattedCountdown(countdown) {
  if (countdown == null) return null;

  const m = Math.floor(countdown / 60);
  const s = countdown % 60;

  return `${m}:${s.toString().padStart(2, "0")}`;
}