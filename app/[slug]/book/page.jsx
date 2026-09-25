'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';

const DEFAULT_SECTIONS = [
  { id: 'ground', name: 'Ground Floor' },
  { id: 'upper', name: 'Upper Floor' },
  { id: 'ttp', name: 'TTP Branch' },
  { id: 'bkk', name: 'BKK Branch' },
];

const DEFAULT_SERVICE_TYPES = [
  { id: 'indoor', name: 'Indoor' },
  { id: 'outdoor', name: 'Outdoor' },
];

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MAX_GUESTS = 10;
const MAX_DAYS_AHEAD = 60;

const ACCENT_COLOR = '#D98E1D';
const ACCENT_TEXT_COLOR = '#16130F';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function isSameDay(a, b) {
  return a && b && toDateKey(a) === toDateKey(b);
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function slugToPlaceName(slug) {
  if (!slug) return '';

  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function defaultGetAvailableTimes(section, dateKey, serviceType) {
  const times = [];

  for (let h = 11; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) continue;

      times.push(`${pad2(h)}:${pad2(m)}`);
    }
  }

  const seed = `${section?.id || ''}-${dateKey || ''}-${
    serviceType?.id || ''
  }`;

  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return times.map((t, i) => ({
    time: t,
    available: (hash + i) % 5 !== 0,
  }));
}

// Replace this with a real request to your booking API, e.g.
// fetch(`/api/places/${slug}/bookings`, { method: 'POST', body: JSON.stringify(payload) })
// `initData` is Telegram's raw, signed init-data string — send it along so
// your backend can verify the request really came from Telegram before
// trusting the user's identity. See:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
async function submitBooking(slug, payload, initData) {
  await new Promise((resolve) => setTimeout(resolve, 900));

  return { ok: true, slug, initData: Boolean(initData), ...payload };
}

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookPageInner />
    </Suspense>
  );
}

function BookPageInner() {
  const router = useRouter();
  const { slug } = useParams();

  // In a real app, fetch the place (name, sections, service types) using
  // `slug` — e.g. in a server component higher up and pass it down, or via
  // a client fetch here. Falling back to sensible defaults for now.
  const placeName = slugToPlaceName(slug);
  const sections = DEFAULT_SECTIONS;
  const serviceTypes = DEFAULT_SERVICE_TYPES;

  const [step, setStep] = useState(1);
  const [activeField, setActiveField] = useState(null);

  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  const [section, setSection] = useState(null);
  const [serviceType, setServiceType] = useState(null);
  const [time, setTime] = useState(null);

  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');

  // ---------------------------------------------------------------------
  // Telegram Mini App bootstrap
  // ---------------------------------------------------------------------
  // Inside Telegram, `window.Telegram.WebApp` gives us the viewer's verified
  // identity (via initData), theming, and native chrome (Back/Main button,
  // haptics) for free — no separate OAuth round trip needed like a regular
  // web page would require.
  const [tg, setTg] = useState(null);
  const [tgScriptFailed, setTgScriptFailed] = useState(false);

  const handleTelegramScriptLoad = useCallback(() => {
    const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

    if (!webApp) {
      setTgScriptFailed(true);
      return;
    }

    webApp.ready();
    webApp.expand();
    webApp.disableVerticalSwipes?.();

    setTg(webApp);
  }, []);

  const isDark = tg?.colorScheme === 'dark';

  // initData is already verified by Telegram before your bot ever sees it
  // (once you check the signature server-side), so the person doesn't need
  // to "connect" anything — if the mini app is open, we already know who
  // they are.
  const telegramUser = useMemo(() => {
    const u = tg?.initDataUnsafe?.user;

    if (!u) return null;

    return {
      id: u.id,
      username: u.username || null,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
      photoUrl: u.photo_url || null,
    };
  }, [tg]);

  useEffect(() => {
    if (!telegramUser) return;

    setFullName((current) => (current.trim() ? current : telegramUser.name || ''));
  }, [telegramUser]);

  // Match the mini app chrome to the page instead of the other way round.
  useEffect(() => {
    if (!tg) return;

    try {
      tg.setHeaderColor(isDark ? '#16130F' : '#FFFFFF');
      tg.setBackgroundColor(isDark ? '#16130F' : '#FAF9F6');
    } catch {
      // Older Telegram clients may not support these setters — safe to ignore.
    }
  }, [tg, isDark]);

  const haptic = useCallback(
    (style = 'light') => {
      try {
        tg?.HapticFeedback?.impactOccurred?.(style);
      } catch {
        // Haptics are a nicety — never let them break a selection.
      }
    },
    [tg]
  );

  const selectionHaptic = useCallback(() => {
    try {
      tg?.HapticFeedback?.selectionChanged?.();
    } catch {
      // Ignore — see above.
    }
  }, [tg]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock page scroll only while the selection sheet is open.
  useEffect(() => {
    if (!activeField) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveField(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeField]);

  const today = useMemo(() => {
    const d = new Date();

    d.setHours(0, 0, 0, 0);

    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date(today);

    d.setDate(d.getDate() + MAX_DAYS_AHEAD);

    return d;
  }, [today]);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();

    return {
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });

  const calendarCells = useMemo(
    () => buildMonthGrid(visibleMonth.year, visibleMonth.month),
    [visibleMonth]
  );

  const canShowTimes = Boolean(section && serviceType && selectedDate);

  const timeSlots = useMemo(() => {
    if (!canShowTimes) return [];

    return defaultGetAvailableTimes(
      section,
      toDateKey(selectedDate),
      serviceType
    );
  }, [canShowTimes, section, selectedDate, serviceType]);

  useEffect(() => {
    setTime(null);
  }, [section, serviceType, selectedDate]);

  const canGoPrevMonth =
    visibleMonth.year > today.getFullYear() ||
    (visibleMonth.year === today.getFullYear() &&
      visibleMonth.month > today.getMonth());

  const canGoNextMonth =
    visibleMonth.year < maxDate.getFullYear() ||
    (visibleMonth.year === maxDate.getFullYear() &&
      visibleMonth.month < maxDate.getMonth());

  function changeMonth(delta) {
    setVisibleMonth(({ year, month }) => {
      const d = new Date(year, month + delta, 1);

      return {
        year: d.getFullYear(),
        month: d.getMonth(),
      };
    });
  }

  const bookingComplete = Boolean(
    section && serviceType && selectedDate && time && guests
  );

  const contactComplete = fullName.trim().length > 0;

  const goToDetails = useCallback(() => {
    if (!bookingComplete) return;

    setActiveField(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [bookingComplete]);

  const goBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.back();
    }
  }, [step, router]);

  const handleConfirmBooking = useCallback(async () => {
    if (!bookingComplete || !contactComplete) return;

    setSubmitting(true);
    setError(null);

    try {
      await submitBooking(
        slug,
        {
          guests,
          date: toDateKey(selectedDate),
          section,
          serviceType,
          time,
          fullName: fullName.trim(),
          contact: contact.trim(),
          note: note.trim(),
          telegramUserId: telegramUser?.id,
          telegramUsername: telegramUser?.username,
        },
        tg?.initData
      );

      haptic('medium');
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [
    bookingComplete,
    contactComplete,
    slug,
    guests,
    selectedDate,
    section,
    serviceType,
    time,
    fullName,
    contact,
    note,
    telegramUser,
    tg,
    haptic,
  ]);

  const handleDone = useCallback(() => {
    router.push(`/${slug}`);
  }, [router, slug]);

  // ---------------------------------------------------------------------
  // Native Telegram chrome: BackButton + MainButton stand in for the
  // in-page back arrow and sticky footer button once we're inside Telegram.
  // Both fall back to the on-page controls below when `tg` isn't set, so
  // the page still works fine as a normal preview in a regular browser.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!tg) return;

    if (submitting) {
      tg.BackButton.hide();
      return;
    }

    tg.BackButton.show();
    tg.BackButton.onClick(goBack);

    return () => {
      tg.BackButton.offClick(goBack);
    };
  }, [tg, submitting, goBack]);

  useEffect(() => {
    if (!tg) return () => {};

    const mainButton = tg.MainButton;

    if (submitting) {
      mainButton.setText('Confirming...');
      mainButton.disable();
      mainButton.showProgress(true);
      mainButton.show();

      return () => {};
    }

    mainButton.hideProgress();

    let label;
    let enabled;
    let handler;

    if (submitted) {
      label = 'Done';
      enabled = true;
      handler = handleDone;
    } else if (step === 1) {
      label = 'Continue';
      enabled = bookingComplete;
      handler = goToDetails;
    } else {
      label = 'Confirm booking';
      enabled = contactComplete;
      handler = handleConfirmBooking;
    }

    mainButton.setText(label);
    mainButton.color = ACCENT_COLOR;
    mainButton.textColor = ACCENT_TEXT_COLOR;

    if (enabled) {
      mainButton.enable();
    } else {
      mainButton.disable();
    }

    mainButton.show();
    mainButton.onClick(handler);

    return () => {
      mainButton.offClick(handler);
    };
  }, [
    tg,
    submitting,
    submitted,
    step,
    bookingComplete,
    contactComplete,
    goToDetails,
    handleConfirmBooking,
    handleDone,
  ]);

  // Warn before Telegram closes the mini app if there's an unsaved,
  // in-progress booking.
  useEffect(() => {
    if (!tg) return;

    const hasUnsavedInput = !submitted && (bookingComplete || step === 2);

    if (hasUnsavedInput) {
      tg.enableClosingConfirmation();
    } else {
      tg.disableClosingConfirmation();
    }
  }, [tg, submitted, bookingComplete, step]);

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Safe-area insets so content clears Telegram's own header chrome and the
  // device's rounded corners / home indicator.
  const safeAreaStyle = {
    paddingTop: 'env(safe-area-inset-top, 0px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  };

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={handleTelegramScriptLoad}
        onError={() => setTgScriptFailed(true)}
      />

      <div
        className={isDark ? 'min-h-screen bg-[#16130F]' : 'min-h-screen bg-[#FAF9F6]'}
        style={safeAreaStyle}
      >
        <div
          className={`mx-auto flex min-h-screen w-full max-w-md flex-col shadow-sm ${
            isDark ? 'bg-[#1E1A14]' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div
            className={`sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4 ${
              isDark ? 'border-white/10 bg-[#1E1A14]' : 'border-[#E7E1D6] bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Only show our own back arrow when Telegram's native
                  BackButton isn't available (e.g. plain browser preview). */}
              {!tg && !submitted && !submitting && (
                <button
                  type="button"
                  onClick={goBack}
                  className="-ml-1 rounded-full p-1.5 text-[#8B8377] transition-colors hover:bg-[#F5F1E8] hover:text-[#16130F]"
                  aria-label="Back"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              )}

              <div>
                <h1
                  className={`font-[family-name:var(--font-display)] text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-[#16130F]'
                  }`}
                >
                  {submitted
                    ? 'Booked'
                    : placeName
                    ? `Book ${placeName}`
                    : 'Book a table'}
                </h1>

                {!submitted && (
                  <p className={`mt-0.5 text-xs ${isDark ? 'text-white/50' : 'text-[#8B8377]'}`}>
                    {step === 1 ? 'Booking information' : 'Your details'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          {!submitted && !submitting && (
            <div className="flex gap-1.5 px-5 pt-4">
              <ProgressSegment active={step >= 1} label="Booking" isDark={isDark} />
              <ProgressSegment active={step >= 2} label="Your details" isDark={isDark} />
            </div>
          )}

          {/* Body */}
          <div className="flex-1 px-5 py-5" style={{ paddingBottom: tg ? '5rem' : undefined }}>
            {tgScriptFailed && !tg && (
              <p className="mb-4 rounded-xl bg-[#F5F1E8] px-3 py-2 text-xs text-[#8B8377]">
                Open this page from your Telegram bot to book with one tap using
                your Telegram identity. You can still preview the flow here.
              </p>
            )}

            {submitted ? (
              <SuccessPanel
                guests={guests}
                date={selectedDate}
                section={section}
                serviceType={serviceType}
                time={time}
                onDone={handleDone}
                showButton={!tg}
              />
            ) : submitting ? (
              <LoadingPanel />
            ) : step === 1 ? (
              <BookingStep
                section={section}
                serviceType={serviceType}
                guests={guests}
                selectedDate={formattedDate}
                time={time}
                canShowTimes={canShowTimes}
                onOpenField={setActiveField}
                isDark={isDark}
              />
            ) : (
              <DetailsStep
                fullName={fullName}
                setFullName={setFullName}
                contact={contact}
                setContact={setContact}
                note={note}
                setNote={setNote}
                telegramUser={telegramUser}
                isInsideTelegram={Boolean(tg)}
                isDark={isDark}
              />
            )}
          </div>

          {/* Footer — only rendered as a fallback when Telegram's native
              MainButton isn't driving the flow. */}
          {!tg && !submitted && !submitting && (
            <div className="sticky bottom-0 border-t border-[#E7E1D6] bg-white px-5 py-4">
              {step === 1 ? (
                <button
                  type="button"
                  disabled={!bookingComplete}
                  onClick={goToDetails}
                  className="w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              ) : (
                <>
                  {error && (
                    <p className="mb-2 text-xs font-medium text-red-600">{error}</p>
                  )}

                  <button
                    type="button"
                    disabled={!contactComplete}
                    onClick={handleConfirmBooking}
                    className="w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Confirm booking
                  </button>
                </>
              )}
            </div>
          )}

          {tg && error && (
            <p className="px-5 pb-4 text-xs font-medium text-red-600">{error}</p>
          )}
        </div>

        {/* Selection sheet */}
        {mounted &&
          activeField &&
          createPortal(
            <SelectionSheet
              title={getFieldTitle(activeField)}
              onClose={() => setActiveField(null)}
              isDark={isDark}
            >
              {activeField === 'location' && (
                <LocationSelector
                  sections={sections}
                  selected={section}
                  onSelect={(value) => {
                    selectionHaptic();
                    setSection(value);
                    setActiveField(null);
                  }}
                />
              )}

              {activeField === 'guests' && (
                <GuestSelector
                  guests={guests}
                  setGuests={(updater) => {
                    haptic('light');
                    setGuests(updater);
                  }}
                  maxGuests={MAX_GUESTS}
                  onDone={() => setActiveField(null)}
                />
              )}

              {activeField === 'serviceType' && (
                <ServiceTypeSelector
                  serviceTypes={serviceTypes}
                  selected={serviceType}
                  onSelect={(value) => {
                    selectionHaptic();
                    setServiceType(value);
                    setActiveField(null);
                  }}
                />
              )}

              {activeField === 'date' && (
                <DateSelector
                  calendarCells={calendarCells}
                  visibleMonth={visibleMonth}
                  changeMonth={changeMonth}
                  today={today}
                  maxDate={maxDate}
                  selectedDate={selectedDate}
                  setSelectedDate={(date) => {
                    selectionHaptic();
                    setSelectedDate(date);
                  }}
                  canGoPrevMonth={canGoPrevMonth}
                  canGoNextMonth={canGoNextMonth}
                  onDone={() => setActiveField(null)}
                />
              )}

              {activeField === 'time' && (
                <TimeSelector
                  timeSlots={timeSlots}
                  time={time}
                  setTime={(value) => {
                    selectionHaptic();
                    setTime(value);
                  }}
                  onSelect={() => setActiveField(null)}
                />
              )}
            </SelectionSheet>,
            document.body
          )}
      </div>
    </>
  );
}

/* =========================================================
   PROGRESS
========================================================= */

function ProgressSegment({ active, label, isDark }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <div
        className={`h-1 rounded-full transition-colors ${
          active ? 'bg-[#D98E1D]' : isDark ? 'bg-white/10' : 'bg-[#EFE9DD]'
        }`}
      />

      <span
        className={`text-[11px] font-medium ${
          active ? (isDark ? 'text-white' : 'text-[#16130F]') : 'text-[#B5AD9E]'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   STEP 1
========================================================= */

function BookingStep({
  section,
  serviceType,
  guests,
  selectedDate,
  time,
  canShowTimes,
  onOpenField,
  isDark,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#16130F]'}`}>
          Booking information
        </h2>

        <p className={`mt-1 text-xs ${isDark ? 'text-white/50' : 'text-[#8B8377]'}`}>
          Choose your preferred table details
        </p>
      </div>

      <BookingField
        label="Location"
        value={section?.name}
        placeholder="Choose a location"
        onClick={() => onOpenField('location')}
        isDark={isDark}
      />

      <BookingField
        label="Guests"
        value={`${guests} ${guests === 1 ? 'guest' : 'guests'}`}
        onClick={() => onOpenField('guests')}
        isDark={isDark}
      />

      <BookingField
        label="Service type"
        value={serviceType?.name}
        placeholder="Choose service type"
        onClick={() => onOpenField('serviceType')}
        isDark={isDark}
      />

      <BookingField
        label="Date"
        value={selectedDate}
        placeholder="Choose a date"
        onClick={() => onOpenField('date')}
        isDark={isDark}
      />

      <BookingField
        label="Time"
        value={time}
        placeholder={
          canShowTimes
            ? 'Choose a time'
            : 'Choose location, service and date first'
        }
        disabled={!canShowTimes}
        onClick={() => onOpenField('time')}
        isDark={isDark}
      />
    </div>
  );
}

/* =========================================================
   STEP 2
========================================================= */

function DetailsStep({
  fullName,
  setFullName,
  contact,
  setContact,
  note,
  setNote,
  telegramUser,
  isInsideTelegram,
  isDark,
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="mb-1">
        <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#16130F]'}`}>
          Your details
        </h2>

        <p className={`mt-1 text-xs ${isDark ? 'text-white/50' : 'text-[#8B8377]'}`}>
          A few details so we can confirm your table
        </p>
      </div>

      <label className="block">
        <span className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/70' : 'text-[#6B6355]'}`}>
          Full name
        </span>

        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Sokha Chan"
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[#B5AD9E] focus:border-[#D98E1D] ${
            isDark ? 'border-white/15 bg-transparent text-white' : 'border-[#E7E1D6] text-[#16130F]'
          }`}
        />
      </label>

      <div>
        <span className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/70' : 'text-[#6B6355]'}`}>
          Identity
        </span>

        {telegramUser ? (
          // Verified simply by virtue of the mini app being opened inside
          // Telegram — Telegram signs the initData Claude reads this from,
          // so there's no separate "connect" step to ask the person to do.
          <div className="flex items-center gap-3 rounded-2xl border border-[#2F4B3C]/20 bg-[#2F4B3C]/5 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2F4B3C]/10">
              {telegramUser.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={telegramUser.photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <CheckIcon className="h-4 w-4 text-[#2F4B3C]" />
              )}
            </div>

            <div className="min-w-0">
              <p className={`truncate text-sm font-medium ${isDark ? 'text-white' : 'text-[#16130F]'}`}>
                {telegramUser.name}
              </p>

              <p className={`truncate text-xs ${isDark ? 'text-white/50' : 'text-[#8B8377]'}`}>
                Verified via Telegram
                {telegramUser.username && <> · @{telegramUser.username}</>}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E7E1D6] px-4 py-3">
            <p className="text-xs text-[#8B8377]">
              {isInsideTelegram
                ? "We couldn't read your Telegram profile — you can still continue with just your name below."
                : 'Open this page inside Telegram to verify your identity automatically. In a regular browser, just fill in your name below.'}
            </p>
          </div>
        )}
      </div>

      <label className="block">
        <span className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/70' : 'text-[#6B6355]'}`}>
          Phone
          <span className="ml-1 font-normal text-[#B5AD9E]">optional</span>
        </span>

        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="e.g. 012 345 678"
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[#B5AD9E] focus:border-[#D98E1D] ${
            isDark ? 'border-white/15 bg-transparent text-white' : 'border-[#E7E1D6] text-[#16130F]'
          }`}
        />
      </label>

      <label className="block">
        <span className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/70' : 'text-[#6B6355]'}`}>
          Note
          <span className="ml-1 font-normal text-[#B5AD9E]">optional</span>
        </span>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Allergies, special occasion, seating preference..."
          rows={4}
          className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[#B5AD9E] focus:border-[#D98E1D] ${
            isDark ? 'border-white/15 bg-transparent text-white' : 'border-[#E7E1D6] text-[#16130F]'
          }`}
        />
      </label>
    </div>
  );
}

/* =========================================================
   BOOKING FIELD
========================================================= */

function BookingField({
  label,
  value,
  placeholder = 'Choose',
  onClick,
  disabled = false,
  isDark = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
        disabled
          ? isDark
            ? 'cursor-not-allowed border-white/5 bg-white/[0.02]'
            : 'cursor-not-allowed border-[#F0EDE5] bg-[#FAF9F6]'
          : isDark
          ? 'border-white/15 hover:border-[#D98E1D]/60 hover:bg-white/5'
          : 'border-[#E7E1D6] hover:border-[#D98E1D]/60 hover:bg-[#FCFAF5]'
      }`}
    >
      <div className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#8B8377]">
          {label}
        </span>

        <span
          className={`mt-1 block truncate text-sm font-medium ${
            value ? (isDark ? 'text-white' : 'text-[#16130F]') : 'text-[#B5AD9E]'
          }`}
        >
          {value || placeholder}
        </span>
      </div>

      {!disabled && (
        <ChevronRightIcon className="ml-3 h-4 w-4 shrink-0 text-[#B5AD9E] transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

/* =========================================================
   SELECTION SHEET (bottom sheet overlay, portaled to body)
========================================================= */

function SelectionSheet({ title, children, onClose, isDark }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[#16130F]/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 max-h-[80vh] w-full max-w-sm overflow-hidden rounded-t-3xl shadow-2xl animate-[fadeScaleIn_0.15s_ease-out] sm:rounded-3xl ${
          isDark ? 'bg-[#1E1A14]' : 'bg-white'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className={`flex items-center justify-between border-b px-5 py-4 ${
            isDark ? 'border-white/10' : 'border-[#E7E1D6]'
          }`}
        >
          <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-[#16130F]'}`}>
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#8B8377] transition-colors hover:bg-[#F5F1E8] hover:text-[#16130F]"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(80vh-65px)] overflow-y-auto p-5">{children}</div>
      </div>

      <style jsx global>{`
        @keyframes fadeScaleIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function getFieldTitle(field) {
  switch (field) {
    case 'location':
      return 'Choose location';

    case 'guests':
      return 'Number of guests';

    case 'serviceType':
      return 'Choose service type';

    case 'date':
      return 'Choose a date';

    case 'time':
      return 'Choose a time';

    default:
      return 'Choose';
  }
}

/* =========================================================
   LOCATION SELECTOR
========================================================= */

function LocationSelector({ sections, selected, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      {sections.map((option) => {
        const isSelected = selected?.id === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
              isSelected
                ? 'border-[#D98E1D] bg-[#D98E1D]/10'
                : 'border-[#E7E1D6] hover:border-[#D98E1D]/60 hover:bg-[#FCFAF5]'
            }`}
          >
            <span
              className={`text-sm font-medium ${
                isSelected ? 'text-[#16130F]' : 'text-[#3A342C]'
              }`}
            >
              {option.name}
            </span>

            {isSelected && <CheckIcon className="h-4 w-4 text-[#D98E1D]" />}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   GUEST SELECTOR
========================================================= */

function GuestSelector({ guests, setGuests, maxGuests, onDone }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-6 py-6">
        <button
          type="button"
          disabled={guests <= 1}
          onClick={() => setGuests((g) => Math.max(1, g - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E7E1D6] text-[#3A342C] transition-colors hover:border-[#D98E1D]/60 disabled:opacity-30"
          aria-label="Decrease guests"
        >
          <MinusIcon className="h-4 w-4" />
        </button>

        <div className="w-20 text-center">
          <div className="text-3xl font-semibold text-[#16130F]">{guests}</div>

          <div className="mt-1 text-xs text-[#8B8377]">
            {guests === 1 ? 'guest' : 'guests'}
          </div>
        </div>

        <button
          type="button"
          disabled={guests >= maxGuests}
          onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E7E1D6] text-[#3A342C] transition-colors hover:border-[#D98E1D]/60 disabled:opacity-30"
          aria-label="Increase guests"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D]"
      >
        Done
      </button>
    </div>
  );
}

/* =========================================================
   SERVICE TYPE SELECTOR
========================================================= */

function ServiceTypeSelector({ serviceTypes, selected, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      {serviceTypes.map((option) => {
        const isSelected = selected?.id === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
              isSelected
                ? 'border-[#D98E1D] bg-[#D98E1D]/10'
                : 'border-[#E7E1D6] hover:border-[#D98E1D]/60 hover:bg-[#FCFAF5]'
            }`}
          >
            <span
              className={`text-sm font-medium ${
                isSelected ? 'text-[#16130F]' : 'text-[#3A342C]'
              }`}
            >
              {option.name}
            </span>

            {isSelected && <CheckIcon className="h-4 w-4 text-[#D98E1D]" />}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   DATE SELECTOR
========================================================= */

function DateSelector({
  calendarCells,
  visibleMonth,
  changeMonth,
  today,
  maxDate,
  selectedDate,
  setSelectedDate,
  canGoPrevMonth,
  canGoNextMonth,
  onDone,
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoPrevMonth}
          onClick={() => changeMonth(-1)}
          className="rounded-full p-2 text-[#3A342C] transition-colors hover:bg-[#F5F1E8] disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <span className="text-sm font-semibold text-[#16130F]">
          {MONTH_LABELS[visibleMonth.month]} {visibleMonth.year}
        </span>

        <button
          type="button"
          disabled={!canGoNextMonth}
          onClick={() => changeMonth(1)}
          className="rounded-full p-2 text-[#3A342C] transition-colors hover:bg-[#F5F1E8] disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((weekday, index) => (
          <span key={`${weekday}-${index}`} className="text-[11px] font-medium text-[#B5AD9E]">
            {weekday}
          </span>
        ))}

        {calendarCells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />;
          }

          const disabled = date < today || date > maxDate;
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={toDateKey(date)}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedDate(date)}
              className={`mx-auto my-0.5 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                selected
                  ? 'bg-[#D98E1D] font-semibold text-[#16130F]'
                  : disabled
                  ? 'text-[#D9D3C6]'
                  : isToday
                  ? 'font-semibold text-[#D98E1D] hover:bg-[#F5F1E8]'
                  : 'text-[#3A342C] hover:bg-[#F5F1E8]'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selectedDate}
        onClick={onDone}
        className="mt-5 w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {selectedDate
          ? `Select ${selectedDate.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}`
          : 'Select a date'}
      </button>
    </div>
  );
}

/* =========================================================
   TIME SELECTOR
========================================================= */

function TimeSelector({ timeSlots, time, setTime, onSelect }) {
  if (timeSlots.length === 0) {
    return (
      <p className="py-5 text-center text-sm text-[#8B8377]">No times available.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {timeSlots.map((slot) => {
        const selected = time === slot.time;

        return (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => {
              setTime(slot.time);
              onSelect();
            }}
            className={`rounded-xl border px-2 py-3 text-sm font-medium transition-colors ${
              selected
                ? 'border-[#D98E1D] bg-[#D98E1D]/10 text-[#16130F]'
                : slot.available
                ? 'border-[#E7E1D6] text-[#3A342C] hover:border-[#D98E1D]/60 hover:bg-[#FCFAF5]'
                : 'border-[#F0EDE5] text-[#D9D3C6] line-through'
            }`}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E7E1D6] border-t-[#D98E1D]" />

      <p className="text-sm text-[#8B8377]">Confirming your table...</p>
    </div>
  );
}

/* =========================================================
   SUCCESS
========================================================= */

function SuccessPanel({ guests, date, section, serviceType, time, onDone, showButton = true }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2F4B3C]/10">
        <CheckIcon className="h-6 w-6 text-[#2F4B3C]" />
      </div>

      <div>
        <p className="text-sm font-semibold text-[#16130F]">Table reserved</p>

        <p className="mt-2 text-sm leading-6 text-[#8B8377]">
          {guests} {guests === 1 ? 'guest' : 'guests'}
          {' · '}
          {section?.name}
          {' · '}
          {serviceType?.name}
          {' · '}
          {time}
          {date && (
            <>
              {' '}
              on{' '}
              {date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </>
          )}
        </p>
      </div>

      {/* When inside Telegram, the native MainButton ("Done") drives this
          instead — see the MainButton effect above. */}
      {showButton && (
        <button
          type="button"
          onClick={onDone}
          className="mt-3 w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D]"
        >
          Done
        </button>
      )}
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function ChevronLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}