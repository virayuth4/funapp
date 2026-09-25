'use client';

import { useEffect, useRef, useId } from 'react';

// Set this to your bot's username (without the @), as registered with
// BotFather. The widget only works on domains you've registered for this
// bot via BotFather's /setdomain command.
const TELEGRAM_BOT_USERNAME = 'your_bot_username';

// Renders Telegram's official "Log in with Telegram" widget. When the
// person confirms in Telegram, `onAuth` is called with the raw payload
// Telegram sends back (id, first_name, last_name, username, photo_url,
// auth_date, hash). That payload is NOT yet trusted — verify the hash
// server-side (see app/api/telegram/verify/route.js) before using it.
export default function TelegramLoginButton({
  onAuth,
  requestWriteAccess = true,
  size = 'large',
  cornerRadius = 12,
}) {
  const containerRef = useRef(null);
  const callbackName = `onTelegramAuth_${useId().replace(/[:]/g, '')}`;

  useEffect(() => {
    window[callbackName] = (user) => {
      onAuth?.(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', String(cornerRadius));
    script.setAttribute('data-onauth', `${callbackName}(user)`);
    if (requestWriteAccess) {
      script.setAttribute('data-request-access', 'write');
    }

    const node = containerRef.current;
    node.appendChild(script);

    return () => {
      delete window[callbackName];
      if (node) node.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} />;
}