"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import SpinSounds from "./spinSounds";
import { ACCENT_MAP, DEFAULT_ACCENT } from "@/lib/cardAccent";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CARD_WIDTH = 180;
const CARD_GAP = 12;
const TOTAL_SLOT_WIDTH = CARD_WIDTH + CARD_GAP;
const REEL_SIZE = 65;
const WINNER_INDEX = 50;
const SPIN_DURATION_MS = 5200;
const SPIN_TRANSITION = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.8, 0.18, 1)`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function shuffledCopy(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Repeats shuffled laps of `cafes` until the reel is REEL_SIZE long.
function shuffledReel(cafes) {
  if (cafes.length === 0) return [];
  const laps = Math.ceil(REEL_SIZE / cafes.length);
  return Array.from({ length: laps }, () => shuffledCopy(cafes))
    .flat()
    .slice(0, REEL_SIZE);
}

// Adds the render-only fields (accent + unique key) to a cafe.
function decorate(cafe, index) {
  return {
    ...cafe,
    reelAccent: ACCENT_MAP[cafe.accent] || DEFAULT_ACCENT,
    instanceId: `${cafe.id}-${index}-${Date.now()}`,
  };
}

function preloadImage(src) {
  if (!src) return;
  const img = new window.Image();
  img.fetchPriority = "high";
  img.src = `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
}

/**
 * Picks a random reel + winner + landing offset.
 * Returns plain ids so the same payload can be sent to the server
 * (shared sessions) and handed straight to reelRef.current.play().
 */
export function buildSpin(cafes) {
  const reel = shuffledReel(cafes);
  if (reel.length <= WINNER_INDEX) return null;

  const jitter = (Math.random() - 0.5) * (CARD_WIDTH - 28);
  return {
    reelIds: reel.map((c) => c.id),
    winnerId: reel[WINNER_INDEX].id,
    targetOffset: -(WINNER_INDEX * TOTAL_SLOT_WIDTH + jitter),
  };
}

// ---------------------------------------------------------------------------
// Single card on the reel
// ---------------------------------------------------------------------------
function ReelCard({ cafe }) {
  const isStaffFav = cafe.reelAccent.name === "Staff Favorite";

  return (
    <div
      style={{
        width: `${CARD_WIDTH}px`,
        ...(isStaffFav ? { "--glow-color": cafe.reelAccent.color } : {}),
      }}
      className={`h-[185px] shrink-0 bg-gradient-to-b ${cafe.reelAccent.bg} bg-neutral-900/90 rounded-md border-b-4 ${cafe.reelAccent.border} border-t border-x border-neutral-800/80 p-3 flex flex-col justify-between relative shadow-lg group ${
        isStaffFav ? "staff-favorite-glow" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-neutral-400 uppercase">
          {cafe.branch_location}
        </span>
        <span
          className="text-[9px] font-mono font-bold tracking-wider uppercase px-1 rounded"
          style={{ color: cafe.reelAccent.color }}
        >
          {cafe.reelAccent.name}
        </span>
      </div>

      <div className="flex flex-col items-center my-auto">
        <Image
          src={cafe.logo_url}
          alt={cafe.name}
          width={64}
          height={64}
          unoptimized
          className="w-16 h-16 rounded-lg object-cover border border-neutral-700/60 shadow-md"
        />
      </div>

      <div className="text-center">
        <h4 className="text-xs font-bold text-neutral-100 truncate">{cafe.name}</h4>
        <p className="text-[10px] text-neutral-400 capitalize">{cafe.category}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpinReel
//
// Props
//   cafes          all known cafes — used to resolve ids from shared sessions
//   availableCafes the currently filtered pool — used for the idle reel
//   isSpinning     owned by the parent; the idle reel reshuffles when false
//   muted          mute tick/reveal sounds
//   onSpinStart()  fired when an animation begins
//   onSpinEnd(winner | null)  fired when the animation lands
//
// Ref handle
//   play({ reelIds, winnerId, targetOffset })
//   cancel()       stop the animation without firing onSpinEnd
// ---------------------------------------------------------------------------
const SpinReel = forwardRef(function SpinReel(
  { cafes, availableCafes, isSpinning, muted, onSpinStart, onSpinEnd },
  ref
) {
  const [reelItems, setReelItems] = useState([]);
  const [translateX, setTranslateX] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("none");

  const soundsRef = useRef(null);
  const frameRef = useRef(null);
  const lastTickRef = useRef(-1);
  const activeSpinRef = useRef(null); // winner id of the spin in flight (dedupe)

  // Latest props, readable from inside the animation loop without
  // making `play` change identity on every render.
  const cafesRef = useRef(cafes);
  const mutedRef = useRef(muted);
  const onSpinStartRef = useRef(onSpinStart);
  const onSpinEndRef = useRef(onSpinEnd);
  useEffect(() => {
    cafesRef.current = cafes;
    mutedRef.current = muted;
    onSpinStartRef.current = onSpinStart;
    onSpinEndRef.current = onSpinEnd;
  });

  // Idle reel: reshuffle whenever we're not spinning and the pool changes.
  useEffect(() => {
    if (isSpinning) return;
    setTransitionStyle("none");
    setTranslateX(0);
    setReelItems(shuffledReel(availableCafes).map(decorate));
    lastTickRef.current = -1;
  }, [availableCafes, isSpinning]);

  // Stop any running animation on unmount.
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const cancel = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    activeSpinRef.current = null;
  }, []);

  const play = useCallback(({ reelIds, winnerId, targetOffset }) => {
    if (!Array.isArray(reelIds)) return;

    // Already animating this exact spin (optimistic local call + server echo).
    if (winnerId != null && String(activeSpinRef.current) === String(winnerId)) return;
    activeSpinRef.current = winnerId;

    // A different spin replaced the one in flight — stop the old ticker.
    cancelAnimationFrame(frameRef.current);

    const lookup = (id) => cafesRef.current.find((c) => String(c.id) === String(id));

    const resolvedReel = reelIds.map((id, i) => decorate(lookup(id) || { id }, i));
    const winnerBase = lookup(winnerId);
    const winner = winnerBase ? decorate(winnerBase, WINNER_INDEX) : null;

    onSpinStartRef.current?.();

    (winner?.image_paths?.slice(0, 2) || []).forEach(preloadImage);

    setTransitionStyle("none");
    setTranslateX(0);
    setReelItems(resolvedReel);
    lastTickRef.current = -1;

    // Two frames so the reset above is painted before the transition starts.
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => {
        setTransitionStyle(SPIN_TRANSITION);
        setTranslateX(targetOffset);

        const startTime = performance.now();

        const tick = (now) => {
          const progress = Math.min((now - startTime) / SPIN_DURATION_MS, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 4);
          const currentPos = Math.abs(targetOffset * easedProgress);
          const currentSlot = Math.floor((currentPos + CARD_WIDTH / 2) / TOTAL_SLOT_WIDTH);

          if (currentSlot !== lastTickRef.current && currentSlot <= WINNER_INDEX) {
            lastTickRef.current = currentSlot;
            if (!mutedRef.current) soundsRef.current?.playTickSound(easedProgress);
          }

          if (progress < 1) {
            frameRef.current = requestAnimationFrame(tick);
            return;
          }

          frameRef.current = null;
          activeSpinRef.current = null; // free up the next spin
          if (!mutedRef.current) soundsRef.current?.playRevealSound();
          onSpinEndRef.current?.(winner);
        };

        frameRef.current = requestAnimationFrame(tick);
      });
    });
  }, []);

  useImperativeHandle(ref, () => ({ play, cancel }), [play, cancel]);

  return (
    <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border-2 border-neutral-800 bg-[#12151b] shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] py-6">
      <SpinSounds ref={soundsRef} muted={muted} />

      <style jsx global>{`
        @keyframes pulseGlow {
          0%,
          100% {
            box-shadow: 0 0 6px 0px var(--glow-color), 0 0 0px 0px var(--glow-color);
          }
          50% {
            box-shadow: 0 0 26px 6px var(--glow-color), 0 0 12px 3px var(--glow-color);
          }
        }
        .staff-favorite-glow {
          animation: pulseGlow 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Pointer + centre line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-amber-400 z-30 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[14px] border-b-amber-400 z-30 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-amber-400 z-20 shadow-[0_0_12px_#fbbf24] opacity-90" />

      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#12151b] via-[#12151b]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#12151b] via-[#12151b]/80 to-transparent z-10 pointer-events-none" />

      {/* Moving strip */}
      <div className="h-[210px] flex items-center relative">
        <div
          className="flex items-center absolute"
          style={{
            left: "40%",
            marginLeft: `-${CARD_WIDTH / 2}px`,
            gap: `${CARD_GAP}px`,
            transform: `translate3d(${translateX}px, 0, 0)`,
            transition: transitionStyle,
            willChange: "transform",
          }}
        >
          {reelItems.map((cafe) => (
            <ReelCard key={cafe.instanceId} cafe={cafe} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default SpinReel;