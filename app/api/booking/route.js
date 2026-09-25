// app/api/booking/route.js
//
// Sends a new booking to your merchant Telegram chat using a Telegram bot.
//
// Setup:
// 1. Message @BotFather on Telegram, run /newbot, copy the bot token.
// 2. Get the chat ID to send messages to:
//    - For a personal DM: message your new bot once, then visit
//      https://api.telegram.org/bot<TOKEN>/getUpdates and read "chat":{"id": ...}
//    - For a group: add the bot to the group, send any message in the group,
//      then hit the same getUpdates URL to find the group's (negative) chat id.
// 3. Add to .env.local (never commit this file):
//      TELEGRAM_BOT_TOKEN=123456:ABC-your-token
//      TELEGRAM_CHAT_ID=123456789
// 4. Restart `next dev` after adding env vars.

export async function POST(request) {
  const {
    guests,
    date,
    section,
    serviceType,
    time,
    fullName,
    contact,
    note,
  } = await request.json();

  // Basic validation so bad/empty requests never hit Telegram.
  if (!guests || !date || !section || !serviceType || !time || !fullName || !contact) {
    return Response.json(
      { error: 'Missing required booking fields.' },
      { status: 400 }
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars');
    return Response.json(
      { error: 'Server is not configured to send bookings.' },
      { status: 500 }
    );
  }

  const lines = [
    '📅 *New booking request*',
    '',
    `👤 *Name:* ${escapeMd(fullName)}`,
    `📞 *Contact:* ${escapeMd(contact)}`,
    `👥 *Guests:* ${guests}`,
    `📍 *Location:* ${escapeMd(section?.name || section)}`,
    `🍽️ *Service:* ${escapeMd(serviceType?.name || serviceType)}`,
    `🗓️ *Date:* ${escapeMd(date)}`,
    `⏰ *Time:* ${escapeMd(time)}`,
  ];

  if (note && note.trim()) {
    lines.push('', `📝 *Note:* ${escapeMd(note)}`);
  }

  const text = lines.join('\n');

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'MarkdownV2',
        }),
      }
    );

    const data = await telegramRes.json();

    if (!telegramRes.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return Response.json(
        { error: 'Failed to notify Telegram.' },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Telegram request failed:', err);
    return Response.json(
      { error: 'Failed to reach Telegram.' },
      { status: 502 }
    );
  }
}

// Telegram's MarkdownV2 requires escaping these characters, or the whole
// message send fails with a 400.
function escapeMd(value) {
  return String(value ?? '').replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}