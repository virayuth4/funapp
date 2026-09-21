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

const DAY_MIN = 24 * 60;
const WEEK_MIN = 7 * DAY_MIN;

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// "21:00" -> "9 PM"  (swap for 24h if you prefer)
export function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0
    ? `${h12} ${suffix}`
    : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatPeriod(p) {
  return `${formatTime(p.open)} – ${formatTime(p.close)}`;
}

// Returns a sorted array of { open, close }, handling both shapes:
//   new:    { closed, periods: [{ open, close }, ...] }
//   legacy: { closed, open, close }
export function getPeriods(day) {
  if (!day || day.closed) return [];

  let periods = [];
  if (Array.isArray(day.periods)) {
    periods = day.periods.filter((p) => p?.open && p?.close);
  } else if (day.open && day.close) {
    periods = [{ open: day.open, close: day.close }];
  }

  return [...periods].sort((a, b) => a.open.localeCompare(b.open));
}

// One day's hours as text:
// "9 AM – 2 PM, 6 PM – 10 PM" | "Closed" | "—"
export function formatDay(day) {
  if (!day) return "—";
  if (day.closed) return "Closed";
  const periods = getPeriods(day);
  if (!periods.length) return "—";
  return periods.map(formatPeriod).join(", ");
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
    () => null // server snapshot
  );
}

// Flattens the whole week into intervals measured in minutes since Monday 00:00.
// Overnight periods (close <= open) simply end on the following day.
function getIntervals(hours) {
  const intervals = [];
  KEYS.forEach((key, dayIndex) => {
    getPeriods(hours[key]).forEach((p) => {
      const o = toMinutes(p.open);
      const c = toMinutes(p.close);
      const start = dayIndex * DAY_MIN + o;
      const end = dayIndex * DAY_MIN + (c <= o ? c + DAY_MIN : c);
      intervals.push({ start, end, open: p.open, close: p.close });
    });
  });
  return intervals;
}

// Returns { isOpen, label } or null when there's not enough data to say.
export function getOpenStatus(hours, now = new Date()) {
  if (!hours || typeof hours !== "object") return null;

  const { dayKey, minutes } = getNow(now);
  const idx = KEYS.indexOf(dayKey);
  const nowAbs = idx * DAY_MIN + minutes;
  const intervals = getIntervals(hours);

  // Open right now? Also test nowAbs + 1 week so a Sunday-night overnight
  // period (ending Monday morning) is caught early on Monday.
  const current = intervals.find(
    (iv) =>
      (nowAbs >= iv.start && nowAbs < iv.end) ||
      (nowAbs + WEEK_MIN >= iv.start && nowAbs + WEEK_MIN < iv.end)
  );
  if (current) {
    return { isOpen: true, label: `Open · closes ${formatTime(current.close)}` };
  }

  // Today's hours unknown, so don't claim anything
  if (!hours[dayKey]) return null;

  // Closed: find the soonest upcoming opening
  let next = null;
  for (const iv of intervals) {
    const delta = (((iv.start - nowAbs) % WEEK_MIN) + WEEK_MIN) % WEEK_MIN;
    if (delta > 0 && (!next || delta < next.delta)) next = { ...iv, delta };
  }

  if (!next) return { isOpen: false, label: "Closed" };

  const startKey = KEYS[Math.floor(next.start / DAY_MIN)];
  const dayDiff = (KEYS.indexOf(startKey) - idx + 7) % 7;

  let when = "";
  if (dayDiff === 0 && next.delta < DAY_MIN) when = ""; // later today
  else if (dayDiff === 1) when = "tomorrow ";
  else when = `${LABELS[startKey]} `;

  return { isOpen: false, label: `Closed · opens ${when}${formatTime(next.open)}` };
}