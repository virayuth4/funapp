async function handleBookingConfirm(booking) {
  'use server';
  await sendBookingToTelegram(booking);
}