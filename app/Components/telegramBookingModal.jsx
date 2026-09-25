'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

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

function buildDateStrip(today, maxDaysAhead) {
  const days = [];

  for (let i = 0; i <= maxDaysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  return days;
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

/* =========================================================
   TELEGRAM WEBAPP BRIDGE
   Wraps window.Telegram.WebApp so the component still works
   (with sensible fallbacks) when previewed in a normal browser.
========================================================= */

function useTelegramWebApp() {
  const [tg, setTg] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready();
    webApp.expand();

    setTg(webApp);
  }, []);

  return tg;
}

function haptic(tg, kind = 'light') {
  try {
    if (kind === 'success' || kind === 'error' || kind === 'warning') {
      tg?.HapticFeedback?.notificationOccurred(kind);
    } else if (kind === 'select') {
      tg?.HapticFeedback?.selectionChanged();
    } else {
      tg?.HapticFeedback?.impactOccurred(kind);
    }
  } catch {
    // HapticFeedback unsupported on this client — ignore silently
  }
}

const THEME_DEFAULTS = {
  bg_color: '#ffffff',
  secondary_bg_color: '#f5f1e8',
  text_color: '#16130f',
  hint_color: '#8b8377',
  link_color: '#d98e1d',
  button_color: '#d98e1d',
  button_text_color: '#16130f',
  section_separator_color: '#e7e1d6',
};

function useTelegramTheme(tg) {
  const [theme, setTheme] = useState(THEME_DEFAULTS);

  useEffect(() => {
    if (!tg) return;

    const apply = () => {
      setTheme({ ...THEME_DEFAULTS, ...(tg.themeParams || {}) });
    };

    apply();

    tg.onEvent?.('themeChanged', apply);
    return () => tg.offEvent?.('themeChanged', apply);
  }, [tg]);

  return theme;
}

const STEP_ORDER = ['location', 'guests', 'serviceType', 'date', 'time', 'contact'];

const STEP_TITLES = {
  location: 'Where would you like to sit?',
  guests: 'How many guests?',
  serviceType: 'Indoor or outdoor?',
  date: 'Pick a date',
  time: 'Pick a time',
  contact: 'Last step — how do we reach you?',
};

export default function TelegramBookingModal({
  placeName = '',
  sections = DEFAULT_SECTIONS,
  serviceTypes = DEFAULT_SERVICE_TYPES,
  maxGuests = 10,
  maxDaysAhead = 30,
  getAvailableTimes = defaultGetAvailableTimes,
  onConfirm,
}) {
  const tg = useTelegramWebApp();
  const theme = useTelegramTheme(tg);

  const tgUser = tg?.initDataUnsafe?.user || null;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dateStrip = useMemo(
    () => buildDateStrip(today, maxDaysAhead),
    [today, maxDaysAhead]
  );

  const [activeStep, setActiveStep] = useState('location');

  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  const [section, setSection] = useState(null);
  const [serviceType, setServiceType] = useState(null);
  const [time, setTime] = useState(null);

  const [fullName, setFullName] = useState(
    [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ')
  );
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Prefill the name once Telegram user data becomes available
  useEffect(() => {
    if (!tgUser) return;
    setFullName((prev) =>
      prev
        ? prev
        : [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    );
  }, [tgUser]);

  useEffect(() => {
    setTime(null);
  }, [section, serviceType, selectedDate]);

  const canShowTimes = Boolean(section && serviceType && selectedDate);

  const timeSlots = useMemo(() => {
    if (!canShowTimes) return [];
    return getAvailableTimes(section, toDateKey(selectedDate), serviceType);
  }, [canShowTimes, section, selectedDate, serviceType, getAvailableTimes]);

  const stepComplete = {
    location: Boolean(section),
    guests: guests >= 1,
    serviceType: Boolean(serviceType),
    date: Boolean(selectedDate),
    time: Boolean(time),
    contact: fullName.trim().length > 0 && phone.trim().length > 0,
  };

  const allBookingComplete =
    stepComplete.location &&
    stepComplete.guests &&
    stepComplete.serviceType &&
    stepComplete.date &&
    stepComplete.time;

  const advanceTo = useCallback((stepId) => {
    setActiveStep(stepId);
  }, []);

  const goNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(activeStep);
    haptic(tg, 'select');

    if (idx < STEP_ORDER.length - 1) {
      advanceTo(STEP_ORDER[idx + 1]);
    }
  }, [activeStep, advanceTo, tg]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(activeStep);
    haptic(tg, 'select');

    if (idx > 0) {
      advanceTo(STEP_ORDER[idx - 1]);
    }
  }, [activeStep, advanceTo, tg]);

  // Auto-advance the moment a step becomes complete — keeps the flow feeling
  // like a chat rather than a form.
  function selectAndAdvance(setter, value) {
    setter(value);
    haptic(tg, 'select');

    const idx = STEP_ORDER.indexOf(activeStep);
    if (idx < STEP_ORDER.length - 1) {
      setTimeout(() => setActiveStep(STEP_ORDER[idx + 1]), 150);
    }
  }

  async function handleSubmit() {
    if (!allBookingComplete || !stepComplete.contact) return;

    setSubmitting(true);
    setError(null);
    haptic(tg, 'medium');

    const payload = {
      guests,
      date: toDateKey(selectedDate),
      section,
      serviceType,
      time,
      fullName: fullName.trim(),
      contact: phone.trim(),
      note: note.trim(),
      telegramUser: tgUser
        ? { id: tgUser.id, username: tgUser.username }
        : null,
    };

    try {
      if (onConfirm) {
        await onConfirm(payload);
      } else if (tg?.sendData) {
        // Default behaviour: hand the booking straight back to the bot.
        tg.sendData(JSON.stringify(payload));
      }

      setSubmitted(true);
      haptic(tg, 'success');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      haptic(tg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function requestPhoneViaTelegram() {
    if (!tg?.requestContact) return;

    tg.requestContact((granted) => {
      if (!granted) return;

      const contact =
        tg.initDataUnsafe?.contact ||
        tg.initDataUnsafe?.user_contact ||
        null;

      const number = contact?.phone_number;
      if (number) {
        setPhone(number);
        haptic(tg, 'success');
      }
    });
  }

  // ---- Telegram MainButton wiring ----
  useEffect(() => {
    if (!tg?.MainButton) return;

    const mb = tg.MainButton;

    if (submitted) {
      mb.setText('Close');
      mb.show();
      mb.enable();
      const onClick = () => tg.close();
      mb.onClick(onClick);
      return () => mb.offClick(onClick);
    }

    if (submitting) {
      mb.showProgress(true);
      return () => mb.hideProgress();
    }

    const idx = STEP_ORDER.indexOf(activeStep);
    const isLastStep = idx === STEP_ORDER.length - 1;
    const label = isLastStep ? 'Confirm booking' : 'Continue';
    const enabled = isLastStep ? stepComplete.contact : stepComplete[activeStep];

    mb.setText(label);
    mb.show();
    enabled ? mb.enable() : mb.disable();

    const onClick = () => {
      if (isLastStep) {
        handleSubmit();
      } else {
        goNext();
      }
    };

    mb.onClick(onClick);
    return () => mb.offClick(onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tg, activeStep, stepComplete, submitting, submitted]);

  // ---- Telegram BackButton wiring ----
  useEffect(() => {
    if (!tg?.BackButton) return;

    const bb = tg.BackButton;
    const idx = STEP_ORDER.indexOf(activeStep);

    if (submitted || idx === 0) {
      bb.hide();
      return;
    }

    bb.show();
    bb.onClick(goBack);
    return () => bb.offClick(goBack);
  }, [tg, activeStep, submitted, goBack]);

  const themeStyle = {
    '--tg-bg': theme.bg_color,
    '--tg-bg-secondary': theme.secondary_bg_color,
    '--tg-text': theme.text_color,
    '--tg-hint': theme.hint_color,
    '--tg-accent': theme.button_color,
    '--tg-accent-text': theme.button_text_color,
    '--tg-border': theme.section_separator_color,
    backgroundColor: 'var(--tg-bg)',
    color: 'var(--tg-text)',
  };

  if (submitted) {
    return (
      <div
        style={themeStyle}
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tg-accent)]/15">
          <CheckIcon className="h-7 w-7 text-[var(--tg-accent)]" />
        </div>

        <p className="text-base font-semibold">Table reserved</p>

        <p className="text-sm leading-6 text-[var(--tg-hint)]">
          {guests} {guests === 1 ? 'guest' : 'guests'} · {section?.name} ·{' '}
          {serviceType?.name} · {time}
          {selectedDate && (
            <>
              {' '}
              on{' '}
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </>
          )}
        </p>

        {!tg?.MainButton && (
          <button
            type="button"
            onClick={() => tg?.close?.()}
            className="mt-2 rounded-full bg-[var(--tg-accent)] px-6 py-3 text-sm font-semibold text-[var(--tg-accent-text)]"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={themeStyle} className="flex min-h-screen flex-col pb-28">
      <div className="px-5 pb-3 pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--tg-hint)]">
          {placeName || 'Book a table'}
        </p>
        <h1 className="mt-1 text-lg font-semibold">
          {STEP_TITLES[activeStep]}
        </h1>
      </div>

      {/* Completed-step summary trail */}
      <div className="flex flex-col gap-2 px-5">
        {STEP_ORDER.map((stepId) => {
          if (stepId === activeStep) return null;
          if (!stepComplete[stepId]) return null;

          const idxActive = STEP_ORDER.indexOf(activeStep);
          const idxThis = STEP_ORDER.indexOf(stepId);
          if (idxThis > idxActive) return null;

          return (
            <SummaryChip
              key={stepId}
              label={summaryLabel(stepId, {
                section,
                guests,
                serviceType,
                selectedDate,
                time,
              })}
              onClick={() => advanceTo(stepId)}
            />
          );
        })}
      </div>

      <div className="flex-1 px-5 pt-4">
        {activeStep === 'location' && (
          <OptionList
            options={sections}
            selected={section}
            onSelect={(v) => selectAndAdvance(setSection, v)}
          />
        )}

        {activeStep === 'guests' && (
          <GuestStepper
            guests={guests}
            setGuests={setGuests}
            maxGuests={maxGuests}
            onDone={goNext}
            tg={tg}
          />
        )}

        {activeStep === 'serviceType' && (
          <OptionList
            options={serviceTypes}
            selected={serviceType}
            onSelect={(v) => selectAndAdvance(setServiceType, v)}
          />
        )}

        {activeStep === 'date' && (
          <DateStrip
            days={dateStrip}
            selectedDate={selectedDate}
            onSelect={(d) => selectAndAdvance(setSelectedDate, d)}
          />
        )}

        {activeStep === 'time' && (
          <TimeGrid
            timeSlots={timeSlots}
            time={time}
            onSelect={(t) => selectAndAdvance(setTime, t)}
          />
        )}

        {activeStep === 'contact' && (
          <ContactForm
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            note={note}
            setNote={setNote}
            canRequestContact={Boolean(tg?.requestContact)}
            onRequestContact={requestPhoneViaTelegram}
          />
        )}

        {error && (
          <p className="mt-3 text-xs font-medium text-red-500">{error}</p>
        )}
      </div>

      {/* Fallback controls for browsers without the Telegram MainButton/BackButton */}
      {!tg?.MainButton && (
        <div className="fixed inset-x-0 bottom-0 flex gap-2 border-t border-[var(--tg-border)] bg-[var(--tg-bg)] px-5 py-4">
          {STEP_ORDER.indexOf(activeStep) > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-[var(--tg-border)] px-4 py-3 text-sm font-medium"
            >
              Back
            </button>
          )}

          <button
            type="button"
            disabled={
              submitting ||
              (activeStep === STEP_ORDER[STEP_ORDER.length - 1]
                ? !stepComplete.contact
                : !stepComplete[activeStep])
            }
            onClick={() =>
              activeStep === STEP_ORDER[STEP_ORDER.length - 1]
                ? handleSubmit()
                : goNext()
            }
            className="flex-1 rounded-full bg-[var(--tg-accent)] px-5 py-3 text-sm font-semibold text-[var(--tg-accent-text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? 'Confirming…'
              : activeStep === STEP_ORDER[STEP_ORDER.length - 1]
              ? 'Confirm booking'
              : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}

function summaryLabel(stepId, { section, guests, serviceType, selectedDate, time }) {
  switch (stepId) {
    case 'location':
      return section?.name;
    case 'guests':
      return `${guests} ${guests === 1 ? 'guest' : 'guests'}`;
    case 'serviceType':
      return serviceType?.name;
    case 'date':
      return selectedDate?.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    case 'time':
      return time;
    default:
      return '';
  }
}

/* =========================================================
   PIECES
========================================================= */

function SummaryChip({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-[var(--tg-border)] bg-[var(--tg-bg-secondary)] px-3.5 py-2 text-left text-sm"
    >
      <span className="flex items-center gap-2">
        <CheckIcon className="h-3.5 w-3.5 text-[var(--tg-accent)]" />
        {label}
      </span>
      <span className="text-xs text-[var(--tg-hint)]">Edit</span>
    </button>
  );
}

function OptionList({ options, selected, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const isSelected = selected?.id === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
              isSelected
                ? 'border-[var(--tg-accent)] bg-[var(--tg-accent)]/10'
                : 'border-[var(--tg-border)]'
            }`}
          >
            <span className="text-sm font-medium">{option.name}</span>
            {isSelected && (
              <CheckIcon className="h-4 w-4 text-[var(--tg-accent)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function GuestStepper({ guests, setGuests, maxGuests, onDone, tg }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-6 py-6">
        <button
          type="button"
          disabled={guests <= 1}
          onClick={() => {
            setGuests((g) => Math.max(1, g - 1));
            haptic(tg, 'light');
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--tg-border)] disabled:opacity-30"
          aria-label="Decrease guests"
        >
          <MinusIcon className="h-4 w-4" />
        </button>

        <div className="w-20 text-center">
          <div className="text-3xl font-semibold">{guests}</div>
          <div className="mt-1 text-xs text-[var(--tg-hint)]">
            {guests === 1 ? 'guest' : 'guests'}
          </div>
        </div>

        <button
          type="button"
          disabled={guests >= maxGuests}
          onClick={() => {
            setGuests((g) => Math.min(maxGuests, g + 1));
            haptic(tg, 'light');
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--tg-border)] disabled:opacity-30"
          aria-label="Increase guests"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-full bg-[var(--tg-accent)] px-5 py-3 text-sm font-semibold text-[var(--tg-accent-text)]"
      >
        Continue
      </button>
    </div>
  );
}

function DateStrip({ days, selectedDate, onSelect }) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
      {days.map((date) => {
        const selected = isSameDay(date, selectedDate);

        return (
          <button
            key={toDateKey(date)}
            type="button"
            onClick={() => onSelect(date)}
            className={`flex shrink-0 flex-col items-center rounded-2xl border px-3.5 py-3 ${
              selected
                ? 'border-[var(--tg-accent)] bg-[var(--tg-accent)]/10'
                : 'border-[var(--tg-border)]'
            }`}
          >
            <span className="text-[11px] font-medium text-[var(--tg-hint)]">
              {date.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            <span className="mt-1 text-base font-semibold">
              {date.getDate()}
            </span>
            <span className="text-[10px] text-[var(--tg-hint)]">
              {date.toLocaleDateString(undefined, { month: 'short' })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TimeGrid({ timeSlots, time, onSelect }) {
  if (timeSlots.length === 0) {
    return (
      <p className="py-5 text-center text-sm text-[var(--tg-hint)]">
        No times available.
      </p>
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
            onClick={() => onSelect(slot.time)}
            className={`rounded-xl border px-2 py-3 text-sm font-medium ${
              selected
                ? 'border-[var(--tg-accent)] bg-[var(--tg-accent)]/10'
                : slot.available
                ? 'border-[var(--tg-border)]'
                : 'border-[var(--tg-border)] text-[var(--tg-hint)] line-through opacity-50'
            }`}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}

function ContactForm({
  fullName,
  setFullName,
  phone,
  setPhone,
  note,
  setNote,
  canRequestContact,
  onRequestContact,
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[var(--tg-hint)]">
          Full name
        </span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Sokha Chan"
          className="w-full rounded-xl border border-[var(--tg-border)] bg-transparent px-3.5 py-2.5 text-sm outline-none"
        />
      </label>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-[var(--tg-hint)]">
          Phone number
        </span>

        {canRequestContact && !phone && (
          <button
            type="button"
            onClick={onRequestContact}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--tg-accent)]/10 px-3.5 py-2.5 text-sm font-medium text-[var(--tg-accent)]"
          >
            <PhoneIcon className="h-4 w-4" />
            Share phone number via Telegram
          </button>
        )}

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="012 345 678"
          className="w-full rounded-xl border border-[var(--tg-border)] bg-transparent px-3.5 py-2.5 text-sm outline-none"
        />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[var(--tg-hint)]">
          Note <span className="font-normal">optional</span>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Allergies, special occasion, seating preference..."
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--tg-border)] bg-transparent px-3.5 py-2.5 text-sm outline-none"
        />
      </label>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

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

function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}