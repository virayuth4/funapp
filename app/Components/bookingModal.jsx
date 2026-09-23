'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(
    date.getMonth() + 1
  )}-${pad2(date.getDate())}`;
}

function isSameDay(a, b) {
  return a && b && toDateKey(a) === toDateKey(b);
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

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

function defaultGetAvailableTimes(
  section,
  dateKey,
  serviceType
) {
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
    hash =
      (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return times.map((t, i) => ({
    time: t,
    available: (hash + i) % 5 !== 0,
  }));
}

export default function BookingModal({
  placeName = '',
  sections = DEFAULT_SECTIONS,
  serviceTypes = DEFAULT_SERVICE_TYPES,
  maxGuests = 10,
  maxDaysAhead = 60,
  getAvailableTimes = defaultGetAvailableTimes,
  onConfirm,
  triggerLabel = 'Book a table',
  triggerClassName = '',
  open: controlledOpen,
  onOpenChange,
}) {
  const isControlled =
    controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] =
    useState(false);

  const isOpen = isControlled
    ? controlledOpen
    : internalOpen;

  const [step, setStep] = useState(1);
  const [activeField, setActiveField] =
    useState(null);

  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] =
    useState(null);
  const [section, setSection] =
    useState(null);
  const [serviceType, setServiceType] =
    useState(null);
  const [time, setTime] = useState(null);

  const [fullName, setFullName] =
    useState('');
  const [contact, setContact] =
    useState('');
  const [note, setNote] = useState('');

  const [visibleMonth, setVisibleMonth] =
    useState(() => {
      const d = new Date();

      return {
        year: d.getFullYear(),
        month: d.getMonth(),
      };
    });

  const [submitting, setSubmitting] =
    useState(false);
  const [submitted, setSubmitted] =
    useState(false);
  const [error, setError] =
    useState(null);
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setOpen = useCallback(
    (next) => {
      if (onOpenChange) {
        onOpenChange(next);
      }

      if (!isControlled) {
        setInternalOpen(next);
      }
    },
    [isControlled, onOpenChange]
  );

  const resetState = useCallback(() => {
    setStep(1);
    setActiveField(null);

    setGuests(2);
    setSelectedDate(null);
    setSection(null);
    setServiceType(null);
    setTime(null);

    setFullName('');
    setContact('');
    setNote('');

    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  }, []);

  const close = useCallback(() => {
    setOpen(false);

    setTimeout(() => {
      resetState();
    }, 200);
  }, [setOpen, resetState]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      if (activeField) {
        setActiveField(null);
      } else {
        close();
      }
    };

    window.addEventListener(
      'keydown',
      onKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        onKeyDown
      );
    };
  }, [isOpen, activeField, close]);

  const today = useMemo(() => {
    const d = new Date();

    d.setHours(0, 0, 0, 0);

    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date(today);

    d.setDate(
      d.getDate() + maxDaysAhead
    );

    return d;
  }, [today, maxDaysAhead]);

  const calendarCells = useMemo(
    () =>
      buildMonthGrid(
        visibleMonth.year,
        visibleMonth.month
      ),
    [visibleMonth]
  );

  const canShowTimes = Boolean(
    section &&
      serviceType &&
      selectedDate
  );

  const timeSlots = useMemo(() => {
    if (!canShowTimes) return [];

    return getAvailableTimes(
      section,
      toDateKey(selectedDate),
      serviceType
    );
  }, [
    canShowTimes,
    section,
    selectedDate,
    serviceType,
    getAvailableTimes,
  ]);

  useEffect(() => {
    setTime(null);
  }, [
    section,
    serviceType,
    selectedDate,
  ]);

  const canGoPrevMonth =
    visibleMonth.year >
      today.getFullYear() ||
    (
      visibleMonth.year ===
        today.getFullYear() &&
      visibleMonth.month >
        today.getMonth()
    );

  const canGoNextMonth =
    visibleMonth.year <
      maxDate.getFullYear() ||
    (
      visibleMonth.year ===
        maxDate.getFullYear() &&
      visibleMonth.month <
        maxDate.getMonth()
    );

  function changeMonth(delta) {
    setVisibleMonth(
      ({ year, month }) => {
        const d = new Date(
          year,
          month + delta,
          1
        );

        return {
          year: d.getFullYear(),
          month: d.getMonth(),
        };
      }
    );
  }

  const bookingComplete = Boolean(
    section &&
      serviceType &&
      selectedDate &&
      time &&
      guests
  );

  const contactComplete =
    fullName.trim().length > 0 &&
    contact.trim().length > 0;

  function goToDetails() {
    if (!bookingComplete) return;

    setActiveField(null);
    setStep(2);
  }

  async function handleConfirmBooking() {
    if (
      !bookingComplete ||
      !contactComplete
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (onConfirm) {
        await onConfirm({
          guests,
          date: toDateKey(selectedDate),
          section,
          serviceType,
          time,
          fullName: fullName.trim(),
          contact: contact.trim(),
          note: note.trim(),
        });
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString(
        undefined,
        {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }
      )
    : null;

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ||
          'inline-flex items-center justify-center gap-2 rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D]'
        }
      >
        <CalendarIcon className="h-4 w-4" />
        {triggerLabel}
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Main backdrop */}
            <div
              className="absolute inset-0 bg-[#16130F]/50 backdrop-blur-sm"
              onClick={() => {
                if (activeField) {
                  setActiveField(null);
                } else {
                  close();
                }
              }}
              aria-hidden="true"
            />

            {/* Main modal */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Book a table"
              className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-xl animate-[fadeScaleIn_0.2s_ease-out]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E7E1D6] px-5 py-4">
                <div className="flex items-center gap-2">
                  {step === 2 &&
                    !submitted &&
                    !submitting && (
                      <button
                        type="button"
                        onClick={() =>
                          setStep(1)
                        }
                        className="-ml-1 rounded-full p-1.5 text-[#8B8377] transition-colors hover:bg-[#F5F1E8] hover:text-[#16130F]"
                        aria-label="Back"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                    )}

                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#16130F]">
                      {submitted
                        ? 'Booked'
                        : placeName
                        ? `Book ${placeName}`
                        : 'Book a table'}
                    </h2>

                    {!submitted && (
                      <p className="mt-0.5 text-xs text-[#8B8377]">
                        {step === 1
                          ? 'Booking information'
                          : 'Your details'}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="rounded-full p-1.5 text-[#8B8377] transition-colors hover:bg-[#F5F1E8] hover:text-[#16130F]"
                  aria-label="Close"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Progress */}
              {!submitted &&
                !submitting && (
                  <div className="flex gap-1.5 px-5 pt-4">
                    <ProgressSegment
                      active={step >= 1}
                      label="Booking"
                    />

                    <ProgressSegment
                      active={step >= 2}
                      label="Your details"
                    />
                  </div>
                )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {submitted ? (
                  <SuccessPanel
                    guests={guests}
                    date={selectedDate}
                    section={section}
                    serviceType={serviceType}
                    time={time}
                    onDone={close}
                  />
                ) : submitting ? (
                  <LoadingPanel />
                ) : step === 1 ? (
                  <BookingStep
                    section={section}
                    serviceType={serviceType}
                    guests={guests}
                    selectedDate={
                      formattedDate
                    }
                    time={time}
                    canShowTimes={
                      canShowTimes
                    }
                    onOpenField={
                      setActiveField
                    }
                  />
                ) : (
                  <DetailsStep
                    fullName={fullName}
                    setFullName={
                      setFullName
                    }
                    contact={contact}
                    setContact={setContact}
                    note={note}
                    setNote={setNote}
                  />
                )}
              </div>

              {/* Footer */}
              {!submitted &&
                !submitting && (
                  <div className="border-t border-[#E7E1D6] px-5 py-4">
                    {step === 1 ? (
                      <button
                        type="button"
                        disabled={
                          !bookingComplete
                        }
                        onClick={
                          goToDetails
                        }
                        className="w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Continue
                      </button>
                    ) : (
                      <>
                        {error && (
                          <p className="mb-2 text-xs font-medium text-red-600">
                            {error}
                          </p>
                        )}

                        <button
                          type="button"
                          disabled={
                            !contactComplete
                          }
                          onClick={
                            handleConfirmBooking
                          }
                          className="w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Confirm booking
                        </button>
                      </>
                    )}
                  </div>
                )}
            </div>

            {/* Individual selector modal */}
            {activeField && (
              <SelectionModal
                title={getFieldTitle(
                  activeField
                )}
                onClose={() =>
                  setActiveField(null)
                }
              >
                {activeField ===
                  'location' && (
                  <LocationSelector
                    sections={sections}
                    selected={section}
                    onSelect={(value) => {
                      setSection(value);
                      setActiveField(
                        null
                      );
                    }}
                  />
                )}

                {activeField ===
                  'guests' && (
                  <GuestSelector
                    guests={guests}
                    setGuests={
                      setGuests
                    }
                    maxGuests={
                      maxGuests
                    }
                    onDone={() =>
                      setActiveField(
                        null
                      )
                    }
                  />
                )}

                {activeField ===
                  'serviceType' && (
                  <ServiceTypeSelector
                    serviceTypes={
                      serviceTypes
                    }
                    selected={
                      serviceType
                    }
                    onSelect={(value) => {
                      setServiceType(
                        value
                      );
                      setActiveField(
                        null
                      );
                    }}
                  />
                )}

                {activeField === 'date' && (
                  <DateSelector
                    calendarCells={
                      calendarCells
                    }
                    visibleMonth={
                      visibleMonth
                    }
                    changeMonth={
                      changeMonth
                    }
                    today={today}
                    maxDate={maxDate}
                    selectedDate={
                      selectedDate
                    }
                    setSelectedDate={
                      setSelectedDate
                    }
                    canGoPrevMonth={
                      canGoPrevMonth
                    }
                    canGoNextMonth={
                      canGoNextMonth
                    }
                    onDone={() =>
                      setActiveField(
                        null
                      )
                    }
                  />
                )}

                {activeField === 'time' && (
                  <TimeSelector
                    timeSlots={timeSlots}
                    time={time}
                    setTime={setTime}
                    onSelect={() =>
                      setActiveField(
                        null
                      )
                    }
                  />
                )}
              </SelectionModal>
            )}

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
          </div>,
          document.body
        )}
    </>
  );
}

/* =========================================================
   PROGRESS
========================================================= */

function ProgressSegment({ active, label }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <div
        className={`h-1 rounded-full transition-colors ${
          active
            ? 'bg-[#D98E1D]'
            : 'bg-[#EFE9DD]'
        }`}
      />

      <span
        className={`text-[11px] font-medium ${
          active
            ? 'text-[#16130F]'
            : 'text-[#B5AD9E]'
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
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-[#16130F]">
          Booking information
        </h3>

        <p className="mt-1 text-xs text-[#8B8377]">
          Choose your preferred table details
        </p>
      </div>

      <BookingField
        label="Location"
        value={section?.name}
        placeholder="Choose a location"
        onClick={() =>
          onOpenField('location')
        }
      />

      <BookingField
        label="Guests"
        value={`${guests} ${
          guests === 1
            ? 'guest'
            : 'guests'
        }`}
        onClick={() =>
          onOpenField('guests')
        }
      />

      <BookingField
        label="Service type"
        value={serviceType?.name}
        placeholder="Choose service type"
        onClick={() =>
          onOpenField('serviceType')
        }
      />

      <BookingField
        label="Date"
        value={selectedDate}
        placeholder="Choose a date"
        onClick={() =>
          onOpenField('date')
        }
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
        onClick={() =>
          onOpenField('time')
        }
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
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-[#16130F]">
          Your details
        </h3>

        <p className="mt-1 text-xs text-[#8B8377]">
          A few details so we can confirm your table
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[#6B6355]">
          Full name
        </span>

        <input
          type="text"
          value={fullName}
          onChange={(e) =>
            setFullName(
              e.target.value
            )
          }
          placeholder="e.g. Sokha Chan"
          className="w-full rounded-xl border border-[#E7E1D6] px-3.5 py-2.5 text-sm text-[#16130F] outline-none transition-colors placeholder:text-[#B5AD9E] focus:border-[#D98E1D]"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[#6B6355]">
          Phone or Telegram
        </span>

        <input
          type="text"
          value={contact}
          onChange={(e) =>
            setContact(
              e.target.value
            )
          }
          placeholder="e.g. 012 345 678 or @username"
          className="w-full rounded-xl border border-[#E7E1D6] px-3.5 py-2.5 text-sm text-[#16130F] outline-none transition-colors placeholder:text-[#B5AD9E] focus:border-[#D98E1D]"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[#6B6355]">
          Note
          <span className="ml-1 font-normal text-[#B5AD9E]">
            optional
          </span>
        </span>

        <textarea
          value={note}
          onChange={(e) =>
            setNote(e.target.value)
          }
          placeholder="Allergies, special occasion, seating preference..."
          rows={4}
          className="w-full resize-none rounded-xl border border-[#E7E1D6] px-3.5 py-2.5 text-sm text-[#16130F] outline-none transition-colors placeholder:text-[#B5AD9E] focus:border-[#D98E1D]"
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
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
        disabled
          ? 'cursor-not-allowed border-[#F0EDE5] bg-[#FAF9F6]'
          : 'border-[#E7E1D6] hover:border-[#D98E1D]/60 hover:bg-[#FCFAF5]'
      }`}
    >
      <div className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#8B8377]">
          {label}
        </span>

        <span
          className={`mt-1 block truncate text-sm font-medium ${
            value
              ? 'text-[#16130F]'
              : 'text-[#B5AD9E]'
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
   SELECTION MODAL
========================================================= */

function SelectionModal({
  title,
  children,
  onClose,
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#16130F]/20"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[75vh] w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-[fadeScaleIn_0.15s_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-[#E7E1D6] px-5 py-4">
          <h3 className="text-base font-semibold text-[#16130F]">
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

        <div className="max-h-[calc(75vh-65px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
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

function LocationSelector({
  sections,
  selected,
  onSelect,
}) {
  return (
    <div className="flex flex-col gap-2">
      {sections.map((option) => {
        const isSelected =
          selected?.id === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              onSelect(option)
            }
            className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
              isSelected
                ? 'border-[#D98E1D] bg-[#D98E1D]/10'
                : 'border-[#E7E1D6] hover:border-[#D98E1D]/60 hover:bg-[#FCFAF5]'
            }`}
          >
            <span
              className={`text-sm font-medium ${
                isSelected
                  ? 'text-[#16130F]'
                  : 'text-[#3A342C]'
              }`}
            >
              {option.name}
            </span>

            {isSelected && (
              <CheckIcon className="h-4 w-4 text-[#D98E1D]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   GUEST SELECTOR
========================================================= */

function GuestSelector({
  guests,
  setGuests,
  maxGuests,
  onDone,
}) {
  return (
    <div>
      <div className="flex items-center justify-center gap-6 py-6">
        <button
          type="button"
          disabled={guests <= 1}
          onClick={() =>
            setGuests((g) =>
              Math.max(1, g - 1)
            )
          }
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E7E1D6] text-[#3A342C] transition-colors hover:border-[#D98E1D]/60 disabled:opacity-30"
          aria-label="Decrease guests"
        >
          <MinusIcon className="h-4 w-4" />
        </button>

        <div className="w-20 text-center">
          <div className="text-3xl font-semibold text-[#16130F]">
            {guests}
          </div>

          <div className="mt-1 text-xs text-[#8B8377]">
            {guests === 1
              ? 'guest'
              : 'guests'}
          </div>
        </div>

        <button
          type="button"
          disabled={
            guests >= maxGuests
          }
          onClick={() =>
            setGuests((g) =>
              Math.min(
                maxGuests,
                g + 1
              )
            )
          }
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

function ServiceTypeSelector({
  serviceTypes,
  selected,
  onSelect,
}) {
  return (
    <div className="flex flex-col gap-2">
      {serviceTypes.map((option) => {
        const isSelected =
          selected?.id === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              onSelect(option)
            }
            className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
              isSelected
                ? 'border-[#D98E1D] bg-[#D98E1D]/10'
                : 'border-[#E7E1D6] hover:border-[#D98E1D]/60 hover:bg-[#FCFAF5]'
            }`}
          >
            <span
              className={`text-sm font-medium ${
                isSelected
                  ? 'text-[#16130F]'
                  : 'text-[#3A342C]'
              }`}
            >
              {option.name}
            </span>

            {isSelected && (
              <CheckIcon className="h-4 w-4 text-[#D98E1D]" />
            )}
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
          onClick={() =>
            changeMonth(-1)
          }
          className="rounded-full p-2 text-[#3A342C] transition-colors hover:bg-[#F5F1E8] disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <span className="text-sm font-semibold text-[#16130F]">
          {
            MONTH_LABELS[
              visibleMonth.month
            ]
          }{' '}
          {visibleMonth.year}
        </span>

        <button
          type="button"
          disabled={!canGoNextMonth}
          onClick={() =>
            changeMonth(1)
          }
          className="rounded-full p-2 text-[#3A342C] transition-colors hover:bg-[#F5F1E8] disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map(
          (weekday, index) => (
            <span
              key={`${weekday}-${index}`}
              className="text-[11px] font-medium text-[#B5AD9E]"
            >
              {weekday}
            </span>
          )
        )}

        {calendarCells.map(
          (date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                />
              );
            }

            const disabled =
              date < today ||
              date > maxDate;

            const selected =
              isSameDay(
                date,
                selectedDate
              );

            const isToday =
              isSameDay(
                date,
                today
              );

            return (
              <button
                key={toDateKey(date)}
                type="button"
                disabled={disabled}
                onClick={() =>
                  setSelectedDate(date)
                }
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
          }
        )}
      </div>

      <button
        type="button"
        disabled={!selectedDate}
        onClick={onDone}
        className="mt-5 w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {selectedDate
          ? `Select ${selectedDate.toLocaleDateString(
              undefined,
              {
                month: 'short',
                day: 'numeric',
              }
            )}`
          : 'Select a date'}
      </button>
    </div>
  );
}

/* =========================================================
   TIME SELECTOR
========================================================= */

function TimeSelector({
  timeSlots,
  time,
  setTime,
  onSelect,
}) {
  if (timeSlots.length === 0) {
    return (
      <p className="py-5 text-center text-sm text-[#8B8377]">
        No times available.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {timeSlots.map((slot) => {
        const selected =
          time === slot.time;

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

      <p className="text-sm text-[#8B8377]">
        Confirming your table...
      </p>
    </div>
  );
}

/* =========================================================
   SUCCESS
========================================================= */

function SuccessPanel({
  guests,
  date,
  section,
  serviceType,
  time,
  onDone,
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2F4B3C]/10">
        <CheckIcon className="h-6 w-6 text-[#2F4B3C]" />
      </div>

      <div>
        <p className="text-sm font-semibold text-[#16130F]">
          Table reserved
        </p>

        <p className="mt-2 text-sm leading-6 text-[#8B8377]">
          {guests}{' '}
          {guests === 1
            ? 'guest'
            : 'guests'}
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
              {date.toLocaleDateString(
                undefined,
                {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }
              )}
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-3 w-full rounded-full bg-[#D98E1D] px-5 py-3 text-sm font-semibold text-[#16130F] transition-colors hover:bg-[#E8A33D]"
      >
        Done
      </button>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function ChevronLeftIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function CalendarIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
      />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}