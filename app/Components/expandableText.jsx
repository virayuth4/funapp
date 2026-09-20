// app/Components/ExpandableText.jsx
'use client';

import { useState, useRef, useLayoutEffect } from 'react';

export default function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(true);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) {
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [text, expanded]);

  return (
    <div>
      <p
        ref={ref}
        className={`mt-2 max-w-2xl text-gray-600 ${
          expanded ? '' : 'line-clamp-3'
        }`}
      >
        {text}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-1 text-sm font-medium text-black underline underline-offset-2"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}