'use client';

// app/Components/bookingModalClient.js
//
// Thin client-side wrapper around BookingModal. Because this file is
// 'use client', handleBookingConfirm is defined and lives entirely on the
// client — it never has to be passed down from a Server Component, so the
// "Event handlers cannot be passed to Client Component props" error can't
// happen here.
//
// The Node backend is responsible for actually notifying Telegram; this
// component just POSTs the booking payload to it.

import BookingModal from './bookingModal';

export default function BookingModalClient({
  endpoint,
  placeName,
  sections,
  serviceTypes,
  maxGuests,
  maxDaysAhead,
  triggerLabel,
  triggerClassName,
}) {
    const endpointUrl = `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/booking/create`
    console.log("Send booking to", endpointUrl)
  async function handleBookingConfirm(booking) {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });

    if (!res.ok) {
      let message = 'Failed to submit booking';

      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        // Response wasn't JSON — fall back to the generic message.
      }

      throw new Error(message);
    }
  }

  return (
    <BookingModal
      placeName={placeName}
      sections={sections}
      serviceTypes={serviceTypes}
      maxGuests={maxGuests}
      maxDaysAhead={maxDaysAhead}
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
      onConfirm={handleBookingConfirm}
    />
  );
}