// app/Components/ExpandableText.jsx
'use client';

import { useState } from 'react';

export default function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p
        className={`mt-2 max-w-2xl text-gray-600 ${
          expanded ? '' : 'line-clamp-3'
        }`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-1 text-sm font-medium text-black underline underline-offset-2"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  );
}