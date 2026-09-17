"use client";

import { useState, useEffect } from "react";

export default function SessionShareModal({ isOpen, onClose, sessionId, sessionUrl }) {
    const [copied, setCopied] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setCopied(false);
  }

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(sessionUrl);
      } else {
        fallbackCopy(sessionUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard write failed:", err);
      fallbackCopy(sessionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = () => {
    if (!navigator.share) return;
    navigator.share({ title: "Spin with me", url: sessionUrl }).catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#12151b] border border-neutral-800 rounded-xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-500 hover:text-white text-lg leading-none cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-1">
          Spin together
        </h2>
        <p className="text-xs text-neutral-400 mb-5">
          Share this link — everyone who opens it will see the same spin land on the same cafe.
        </p>

        <div className="mb-2">
          <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
            Session code
          </label>
          <div className="mt-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-amber-400 font-mono text-sm tracking-widest text-center">
            {sessionId}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
            Invite link
          </label>
          <div className="mt-1 flex items-stretch gap-2">
            <input
              readOnly
              value={sessionUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-300 text-xs truncate"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-md transition-colors cursor-pointer"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>

          {typeof navigator !== "undefined" && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 font-bold text-xs uppercase tracking-widest rounded-md transition-colors cursor-pointer"
            >
              Share via...
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-neutral-500 hover:text-neutral-300 text-xs uppercase tracking-widest cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("execCommand copy failed:", err);
  }
  document.body.removeChild(textarea);
}