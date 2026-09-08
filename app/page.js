"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { CAFES } from "@/app/data/cafes";
import { SPONSORS } from "@/app/data/sponsors";

// Clean color accents for card styling
const CARD_ACCENTS = [
  { name: "Popular", color: "#4b69ff", bg: "from-blue-600/20 to-transparent", border: "border-blue-500" },
  { name: "Trending", color: "#8847ff", bg: "from-purple-600/20 to-transparent", border: "border-purple-500" },
  { name: "Top Pick", color: "#d32ce6", bg: "from-pink-600/20 to-transparent", border: "border-pink-500" },
  { name: "Featured", color: "#eb4b4b", bg: "from-red-600/20 to-transparent", border: "border-red-500" },
  { name: "Signature", color: "#ffd700", bg: "from-amber-400/25 to-transparent", border: "border-yellow-400" },
  { name: "New", color: "#4b69ff", bg: "from-green-600/20 to-transparent", border: "border-green-500" },
];

const CARD_WIDTH = 180;
const CARD_GAP = 12;
const TOTAL_SLOT_WIDTH = CARD_WIDTH + CARD_GAP;
const REEL_SIZE = 65;
const WINNER_INDEX = 50; // Target landing position within the reel

export default function Home() {
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [removedIds, setRemovedIds] = useState([]);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [suggestedSponsor, setSuggestedSponsor] = useState(null);

  const [reelItems, setReelItems] = useState([]);
  const [translateX, setTranslateX] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("none");

  const lastTickIndexRef = useRef(-1);
  const animationFrameRef = useRef(null);
  const branches = ["ALL", "BKK", "TTP", "TK"];

  // Filter available cafes
  const availableCafes = useMemo(() => {
    return CAFES.filter((cafe) => {
      const matchCategory = cafe.category === "cafe";
      const matchBranch =
        selectedBranch === "ALL" || cafe.branch_location === selectedBranch;
      const notRemoved = !removedIds.includes(cafe.id);
      return matchCategory && matchBranch && notRemoved;
    });
  }, [selectedBranch, removedIds]);

 const ACCENT_MAP = Object.fromEntries(CARD_ACCENTS.map((a) => [a.name, a]));
const DEFAULT_ACCENT = CARD_ACCENTS[0]; // fallback if a cafe has no/unknown accent

function shuffledCopy(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const createReel = useCallback(() => {
  if (availableCafes.length === 0) return [];
  const laps = Math.ceil(REEL_SIZE / availableCafes.length);
  const reel = Array.from({ length: laps }, () => shuffledCopy(availableCafes)).flat();
  return reel.slice(0, REEL_SIZE).map((cafe, i) => ({
    ...cafe,
    reelAccent: ACCENT_MAP[cafe.accent] || DEFAULT_ACCENT,
    instanceId: `${cafe.id}-${i}-${Date.now()}`,
  }));
}, [availableCafes]);

  // Make sure reel is always populated & previewable before spinning
  useEffect(() => {
    if (!isSpinning) {
      setTransitionStyle("none");
      setTranslateX(0);
      setReelItems(createReel());
      lastTickIndexRef.current = -1;
    }
  }, [createReel, isSpinning]);

  let audioCtx = null;
const getAudioContext = () => {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};


 const playTickSound = (speedFactor = 0) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // speedFactor (0 -> 1) lets ticks get higher-pitched as the reel slows
    const baseFreq = 800 + speedFactor * 600;

    osc.type = "square";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch {
    // AudioContext unavailable or blocked
  }
};

// Big reveal sound on landing — layered "unlock clunk" + rising "shimmer"
const playRevealSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Layer 1: low mechanical "clunk"
    const clunkOsc = ctx.createOscillator();
    const clunkGain = ctx.createGain();
    clunkOsc.type = "triangle";
    clunkOsc.frequency.setValueAtTime(180, now);
    clunkOsc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    clunkGain.gain.setValueAtTime(0.3, now);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    clunkOsc.connect(clunkGain);
    clunkGain.connect(ctx.destination);
    clunkOsc.start(now);
    clunkOsc.stop(now + 0.2);

    // Layer 2: rising shimmer/chime, starts slightly after the clunk
    const shimmerStart = now + 0.08;
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = "sine";
    shimmerOsc.frequency.setValueAtTime(500, shimmerStart);
    shimmerOsc.frequency.exponentialRampToValueAtTime(1400, shimmerStart + 0.35);
    shimmerGain.gain.setValueAtTime(0.0001, shimmerStart);
    shimmerGain.gain.exponentialRampToValueAtTime(0.2, shimmerStart + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerStart + 0.4);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.start(shimmerStart);
    shimmerOsc.stop(shimmerStart + 0.4);

    // Layer 3: sparkle harmonic on top, for extra "win" brightness
    const sparkleStart = now + 0.12;
    const sparkleOsc = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkleOsc.type = "sine";
    sparkleOsc.frequency.setValueAtTime(2100, sparkleStart);
    sparkleGain.gain.setValueAtTime(0.0001, sparkleStart);
    sparkleGain.gain.exponentialRampToValueAtTime(0.08, sparkleStart + 0.03);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleStart + 0.3);
    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkleOsc.start(sparkleStart);
    sparkleOsc.stop(sparkleStart + 0.3);
  } catch {
    // AudioContext unavailable or blocked
  }
};
  const startSpin = () => {
    if (isSpinning || availableCafes.length === 0) return;

    setIsSpinning(true);
    setActiveModalItem(null);
    setSuggestedSponsor(null);

    // Build the tape of items
    const generatedReel = createReel();
    const chosenWinner = generatedReel[WINNER_INDEX];

    // Jitter landing offset (-70px to +70px) prevents landing dead-center every time
    const jitter = (Math.random() - 0.5) * (CARD_WIDTH - 28);
    const targetOffset = -(WINNER_INDEX * TOTAL_SLOT_WIDTH + jitter);

    // Reset position instantly
    setTransitionStyle("none");
    setTranslateX(0);
    setReelItems(generatedReel);
    lastTickIndexRef.current = -1;

    // Trigger the horizontal spinning animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionStyle("transform 5.2s cubic-bezier(0.12, 0.8, 0.18, 1)");
        setTranslateX(targetOffset);

        const startTime = performance.now();
        const duration = 5200;

        const checkTicker = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing calculation to sync audio clicks
          const easedProgress = 1 - Math.pow(1 - progress, 4);
          const currentPos = Math.abs(targetOffset * easedProgress);
          const currentSlot = Math.floor((currentPos + CARD_WIDTH / 2) / TOTAL_SLOT_WIDTH);

       if (currentSlot !== lastTickIndexRef.current && currentSlot <= WINNER_INDEX) {
            lastTickIndexRef.current = currentSlot;
            playTickSound(easedProgress);
          }

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(checkTicker);
          } else {
            playRevealSound();
            // Spin finished
            if (SPONSORS && SPONSORS.length > 0) {
              const matched = SPONSORS.filter(
                (s) => s.branch_location === chosenWinner.branch_location
              );
              const pool = matched.length > 0 ? matched : SPONSORS;
              setSuggestedSponsor(pool[Math.floor(Math.random() * pool.length)]);
            }
            setActiveModalItem(chosenWinner);
            setIsSpinning(false);
          }
        };

        animationFrameRef.current = requestAnimationFrame(checkTicker);
      });
    });
  };

  const handleRemoveCafe = (cafeId) => {
    setRemovedIds((prev) => [...prev, cafeId]);
    setActiveModalItem(null);
    setSuggestedSponsor(null);
  };

  return (
    <main className="min-h-screen bg-[#0d0f12] text-neutral-100 flex flex-col  items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.06),transparent_70%)] pointer-events-none" />

      <div className="flex flex-col items-center w-full max-w-4xl relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
        
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-white uppercase drop-shadow-md">
            Where to next?  
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Spin to select your next cafe destination.
          </p>
        </header>

        {/* Branch Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-lg border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md mb-8">
          {branches.map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              disabled={isSpinning}
              className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer disabled:opacity-40 ${
                selectedBranch === branch
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {branch === "ALL" ? "All Locations" : branch}
            </button>
          ))}
        </div>

        {/* Horizontal Spinning Reel */}
        <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border-2 border-neutral-800 bg-[#12151b] shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] py-6">
          {/* Top & Bottom Selection Indicators */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-amber-400 z-30 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[14px] border-b-amber-400 z-30 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />

          {/* Center Indicator Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-amber-400 z-20 shadow-[0_0_12px_#fbbf24] opacity-90" />

          {/* Horizontal Vignette Fade */}
          <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#12151b] via-[#12151b]/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#12151b] via-[#12151b]/80 to-transparent z-10 pointer-events-none" />

          {/* Horizontal Track */}
          <div className="h-[210px] flex items-center relative">
            <div
              className="flex items-center absolute"
              style={{
                left: "50%",
                marginLeft: `-${CARD_WIDTH / 2}px`, // Anchors index 0 dead-center on load
                gap: `${CARD_GAP}px`,
                transform: `translate3d(${translateX}px, 0, 0)`,
                transition: transitionStyle,
                willChange: "transform",
              }}
            >
              {reelItems.map((cafe) => (
                <div
                  key={cafe.instanceId}
                  style={{ width: `${CARD_WIDTH}px` }}
                  className={`h-[185px] shrink-0 bg-gradient-to-b ${cafe.reelAccent.bg} bg-neutral-900/90 rounded-md border-b-4 ${cafe.reelAccent.border} border-t border-x border-neutral-800/80 p-3 flex flex-col justify-between relative shadow-lg group`}
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
                    <img
                      src={cafe.logo_url}
                      alt={cafe.name}
                      className="w-16 h-16 rounded-lg object-cover border border-neutral-700/60 shadow-md"
                    />
                  </div>

                  <div className="text-center">
                    <h4 className="text-xs font-bold text-neutral-100 truncate">
                      {cafe.name}
                    </h4>
                    <p className="text-[10px] text-neutral-400 capitalize">
                      {cafe.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={startSpin}
            disabled={isSpinning || availableCafes.length === 0}
            className="px-10 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-extrabold rounded shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all uppercase tracking-widest text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-amber-300/30"
          >
            {isSpinning ? "Selecting Cafe..." : "Spin"}
          </button>

          {removedIds.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>{removedIds.length} cafe(s) excluded</span>
              <span>•</span>
              <button
                onClick={() => setRemovedIds([])}
                className="text-amber-500 underline hover:text-amber-400 cursor-pointer"
              >
                Reset excluded
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Cafe Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Accent Top Strip */}
            <div
              className="h-1.5 w-full rounded-t -mt-6 -mx-6 mb-6"
              style={{ backgroundColor: activeModalItem.reelAccent.color }}
            />

            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-sm cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <img
                src={activeModalItem.logo_url}
                alt={activeModalItem.name}
                className="w-16 h-16 rounded-xl object-cover border border-neutral-700 shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span
                  className="text-[10px] font-mono uppercase font-bold tracking-widest"
                  style={{ color: activeModalItem.reelAccent.color }}
                >
                  Selected Cafe
                </span>
                <h2 className="text-lg font-extrabold text-white truncate">
                  {activeModalItem.name}
                </h2>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300">
                  {activeModalItem.branch_location}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-neutral-400 leading-relaxed">
              {activeModalItem.description}
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={activeModalItem.map}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
              >
                <span>View on Google Maps ↗</span>
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRemoveCafe(activeModalItem.id)}
                  className="flex-1 py-2 rounded bg-red-950/40 border border-red-900 hover:bg-red-900/60 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Exclude Cafe
                </button>
                <button
                  onClick={() => {
                    setActiveModalItem(null);
                    startSpin();
                  }}
                  className="flex-1 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer"
                >
                  Spin Again
                </button>
              </div>
            </div>

            {/* Sponsored Suggestion */}
            {suggestedSponsor && (
              <div className="mt-5 pt-4 border-t border-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                    Nearby In {suggestedSponsor.branch_location}
                  </span>
                  <span className="text-[9px] font-mono tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    Sponsored
                  </span>
                </div>

                <a
                  href={suggestedSponsor.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg border border-neutral-900 bg-neutral-900/50 hover:bg-neutral-900 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={suggestedSponsor.logo_url}
                      alt={suggestedSponsor.name}
                      className="w-8 h-8 rounded object-cover border border-neutral-800"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-medium text-neutral-200 truncate group-hover:text-white">
                        {suggestedSponsor.name}
                      </h4>
                    </div>
                  </div>
                  <span className="text-neutral-500 group-hover:text-white text-xs pl-2">↗</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}