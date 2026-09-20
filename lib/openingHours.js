import { useSyncExternalStore } from "react";

const TZ = "Asia/Phnom_Penh"; // change if needed

export const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const KEYS = DAYS.map((d) => d.key);
const LABELS = Object.fromEntries(DAYS.map((d) => [d.key, d.label]));

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// "21:00" -> "9:00 PM"  (swap for 24h if you prefer)
export function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0
    ? `${h12} ${suffix}`
    : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// Compact one-liner for the card.
// Same hours every day -> "Daily 8 AM – 11 PM"
// Otherwise -> "Today 8 AM – 11 PM" / "Closed today" (needs todayKey, set after mount)
export function getHoursSummary(hours, todayKey) {
  if (!hours) return null;

  const texts = DAYS.map(({ key }) => formatDay(hours[key]));
  if (texts.every((t) => t === texts[0])) {
    return texts[0] === "—" || texts[0] === "Closed" ? null : `Daily ${texts[0]}`;
  }

  if (!todayKey) return null;
  const today = formatDay(hours[todayKey]);
  if (today === "—") return null;
  return today === "Closed" ? "Closed today" : `Today ${today}`;
}
function isRange(d) {
  return d && !d.closed && d.open && d.close;
}

function getNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    dayKey: get("weekday").toLowerCase().slice(0, 3), // "mon"
    minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10),
  };
}

export function getTodayKey() {
  return getNow().dayKey;
}

function subscribeToClock(callback) {
  const id = setInterval(callback, 60_000);
  return () => clearInterval(id);
}

export function useTodayKey() {
  return useSyncExternalStore(
    subscribeToClock,
    getTodayKey, // client snapshot
    () => null   // server snapshot
  );
}

// One day's hours as text: "9:00 AM – 9:00 PM" | "Closed" | "—"
export function formatDay(d) {
  if (!d) return "—";
  if (d.closed) return "Closed";
  if (isRange(d)) return `${formatTime(d.open)} – ${formatTime(d.close)}`;
  return "—";
}

// Returns { isOpen, label } or null when there's not enough data to say.
export function getOpenStatus(hours, now = new Date()) {
  if (!hours || typeof hours !== "object") return null;

  const { dayKey, minutes } = getNow(now);
  const idx = KEYS.indexOf(dayKey);
  const today = hours[dayKey];
  const prev = hours[KEYS[(idx + 6) % 7]];

  // Still open from yesterday's overnight shift (e.g. Fri 18:00–02:00, now Sat 01:00)
  if (isRange(prev)) {
    const o = toMinutes(prev.open);
    const c = toMinutes(prev.close);
    if (c <= o && minutes < c) {
      return { isOpen: true, label: `Open · closes ${formatTime(prev.close)}` };
    }
  }

  if (!today) return null; // today's hours unknown, don't claim anything

  if (isRange(today)) {
    const o = toMinutes(today.open);
    const c = toMinutes(today.close);
    const overnight = c <= o;
    const open = overnight ? minutes >= o : minutes >= o && minutes < c;

    if (open) {
      return { isOpen: true, label: `Open · closes ${formatTime(today.close)}` };
    }
    if (minutes < o) {
      return { isOpen: false, label: `Closed · opens ${formatTime(today.open)}` };
    }
  }

  // Closed today (or already finished): find the next opening
  for (let i = 1; i <= 7; i++) {
    const key = KEYS[(idx + i) % 7];
    const d = hours[key];
    if (isRange(d)) {
      const when = i === 1 ? "tomorrow" : LABELS[key];
      return { isOpen: false, label: `Closed · opens ${when} ${formatTime(d.open)}` };
    }
  }

  return { isOpen: false, label: "Closed" };
}