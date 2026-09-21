"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  DAYS,
  getPeriods,
  formatPeriod,
  getHoursSummary,
  useTodayKey,
} from "@/lib/openingHours";

function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function OpeningHoursList({
  hours,
  note,
  showFootnote = true,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const todayKey = useTodayKey();

  if (!hours) return null;

  const summary = getHoursSummary(hours, todayKey) || "Opening hours";

  return (
    <div className={className}>
      {/* Collapsed state */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className="flex cursor-pointer items-center gap-1.5 text-left text-xs hover:opacity-80"
        aria-haspopup="dialog"
      >
        <span>{summary}</span>
        <ChevronIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </button>

      {note && <p className="mt-1 text-xs text-amber-500">{note}</p>}

      {/* Modal with the full week */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-50"
        // React events bubble through portals, so stop them from reaching a
        // clickable parent (like the CafeRow) when used inside one.
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 cursor-pointer text-sm text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>

            <DialogTitle className="text-base font-bold">Opening hours</DialogTitle>

            {note && (
              <p className="mt-2 rounded bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                {note}
              </p>
            )}

            <ul className="mt-4 space-y-0.5 text-sm">
              {DAYS.map(({ key, label }) => {
                const isToday = todayKey === key;
                const isClosed = hours[key]?.closed;
                const periods = getPeriods(hours[key]);

                return (
                  <li
                    key={key}
                    className={`flex items-start justify-between gap-6 rounded px-2 py-1.5 ${
                      isToday ? "bg-slate-100 text-gray-900" : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {label}
                      {isToday && (
                        <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Today
                        </span>
                      )}
                    </span>

                    <span
                      className={`text-right tabular-nums ${
                        isClosed ? "text-rose-600" : ""
                      }`}
                    >
                      {isClosed
                        ? "Closed"
                        : periods.length
                        ? periods.map((p, i) => (
                            <span key={i} className="block">
                              {formatPeriod(p)}
                            </span>
                          ))
                        : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>

            {showFootnote && (
              <p className="mt-3 text-xs text-gray-400">
                Hours may change on public holidays.
              </p>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}