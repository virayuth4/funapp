"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { CAFES } from "@/app/data/cafes";
import { SPONSORS } from "@/app/data/sponsors";
import { REVIEWS } from "@/app/data/reviews";
import Link from "next/link";
import Image from "next/image";
import ViewAllModal from "./Components/viewAllModal";
import CafeDetailModal from "./Components/cafeDetailsModal";

// Clean color accents for card styling
const CARD_ACCENTS = [
  { name: "Popular", color: "#4b69ff", bg: "from-blue-600/20 to-transparent", border: "border-blue-500" },
  { name: "Trending", color: "#8847ff", bg: "from-purple-600/20 to-transparent", border: "border-purple-500" },
  { name: "Top Pick", color: "#d32ce6", bg: "from-pink-600/20 to-transparent", border: "border-pink-500" },
  { name: "Featured", color: "#eb4b4b", bg: "from-red-600/20 to-transparent", border: "border-red-500" },
  { name: "Signature", color: "#ffd700", bg: "from-amber-400/25 to-transparent", border: "border-yellow-400" },
  { name: "New", color: "#4b69ff", bg: "from-green-600/20 to-transparent", border: "border-green-500" },
  { name: "Staff Favorite", color: "#22d3ee", bg: "from-cyan-500/25 to-transparent", border: "border-cyan-400" },
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
  const [showReviews, setShowReviews] = useState(false);
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);

  const [reelItems, setReelItems] = useState([]);
  const [translateX, setTranslateX] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("none");
    const [rollHistory, setRollHistory] = useState(() => {
      if (typeof window === "undefined") return [];
      try {
        const stored = localStorage.getItem("cafeRollHistory");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    });
  const [showAllModal, setShowAllModal] = useState(false);
  

  const HISTORY_KEY = "cafeRollHistory";
  const MAX_HISTORY = 20;

  const lastTickIndexRef = useRef(-1);
  const animationFrameRef = useRef(null);
  const branches = ["ALL", "BKK", "TTP", "TK", "IFL"];
  

const openCafeModal = (cafe) => {
  setActiveModalItem(cafe);
  setShowReviews(false);
  setShowPartnerInfo(false);
};

const closeCafeModal = () => {
  setActiveModalItem(null);
  setShowReviews(false);
  setShowPartnerInfo(false);
};


  // Filter available cafes
  const availableCafes = useMemo(() => {
    return CAFES.filter((cafe) => {
      const matchInRoll = cafe.in_roll === true;
      const matchBranch =
        selectedBranch === "ALL" || cafe.branch_location === selectedBranch;
      const notRemoved = !removedIds.includes(cafe.id);
      return matchInRoll && matchBranch && notRemoved;
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



const addToHistory = useCallback((cafe) => {
  const entry = {
    id: cafe.id,
    name: cafe.name,
    branch_location: cafe.branch_location,
    logo_url: cafe.logo_url,
    accentColor: cafe.reelAccent?.color,
    timestamp: Date.now(),
  };

  // Update local state + local cache first (optimistic, instant UI)
  setRollHistory((prev) => {
    const updated = [entry, ...prev].slice(0, MAX_HISTORY);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // storage full or blocked — fail silently, state still updates
    }
    return updated;
  });

  // Get userId from localStorage and send to backend
  let userId = null;
  try {
    userId = localStorage.getItem("userId");
  } catch {
    // localStorage blocked (e.g. private browsing) — skip backend sync
  }

  if (!userId) {
    console.warn("No userId found in localStorage — skipping history sync");
    return;
  }
  // console.log("Sending request to", `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/history/add`)
  fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/history/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      id: entry.id,
      name: entry.name,
      branch_location: entry.branch_location,
      logo_url: entry.logo_url,
      accentColor: entry.accentColor,
    }),
  }).catch((err) => {
    // fail silently for UX — history sync isn't critical path
    console.error("Failed to sync history to backend:", err);
  });
}, []);
 

const clearHistory = () => {
  setRollHistory([]);
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
};

const audioCtxRef = useRef(null);

const getAudioContext = () => {
  if (typeof window === "undefined") return null;

  if (!audioCtxRef.current) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtxRef.current = new AudioCtx();
  }

  if (audioCtxRef.current.state === "suspended") {
    audioCtxRef.current.resume();
  }

  return audioCtxRef.current;
};

const closeAllModals = () => {
  setShowPartnerInfo(false);
  setActiveModalItem(null);
  setSuggestedSponsor(null);
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
            const sponsors = CAFES.filter((c) => c.is_sponsored === true);
            if (sponsors.length > 0) {
              const matched = sponsors.filter(
                (s) => s.branch_location === chosenWinner.branch_location
              );
              const pool = matched.length > 0 ? matched : sponsors;
              setSuggestedSponsor(pool[Math.floor(Math.random() * pool.length)]);
            }
            setActiveModalItem(chosenWinner);
            addToHistory(chosenWinner); 
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

  const openHistoryEntry = (entry) => {
  const fullCafe = CAFES.find((c) => c.id === entry.id);
  if (!fullCafe) return;

  setSuggestedSponsor(null); // no sponsor context for a re-opened history item
  setActiveModalItem({
    ...fullCafe,
    reelAccent: ACCENT_MAP[fullCafe.accent] || DEFAULT_ACCENT,
  });
};

  return (
    <main className="min-h-screen bg-[#0d0f12] text-neutral-100 flex flex-col  items-center px-4 py-8 relative overflow-hidden select-none">
    <style jsx global>{`
  @keyframes pulseGlow {
    0%, 100% {
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
        <div className="mt-3 flex justify-end w-full max-w-3xl">
      <button
        onClick={() => setShowAllModal(true)}
        disabled={availableCafes.length === 0}
        className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        View all ({availableCafes.length}) →
      </button>
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
              
           {reelItems.map((cafe) => {
            const isStaffFav = cafe.reelAccent.name === "Staff Favorite";
            return (
              <div
                key={cafe.instanceId}
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
              )})}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex flex-col items-center gap-3">
       <button
      onClick={startSpin}
      disabled={isSpinning || availableCafes.length === 0}
      className="relative px-10 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-[length:200%_200%] hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 active:scale-95 text-black font-extrabold rounded shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all uppercase tracking-widest text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:animate-none cursor-pointer border border-amber-300/40 animate-gradient-x animate-pulse-glow overflow-hidden"
    >
      <span className="relative z-10">
        {isSpinning ? "Selecting Cafe..." : "Spin"}
      </span>
      <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
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
          {rollHistory.length > 0 && (
  <div className="mt-6 w-full max-w-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
        Recent Spins
      </span>
      <button
        onClick={clearHistory}
        className="text-[10px] text-neutral-500 hover:text-amber-400 underline cursor-pointer"
      >
        Clear
      </button>
    </div>

    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
     {rollHistory.map((entry, idx) => (
  <button
    key={`${entry.id}-${entry.timestamp}-${idx}`}
    onClick={() => openHistoryEntry(entry)}
    className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-neutral-900/60 border border-neutral-800/70 text-xs w-full text-left hover:bg-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer"
  >
    <Image
      src={entry.logo_url}
      alt={entry.name}
      width={64}
      height={64}
      className="w-10 h-10 rounded-lg object-cover border border-neutral-700/60 shadow-md"
    />
    <span className="truncate text-neutral-200 flex-1">{entry.name}</span>
    <span
      className="text-[9px] font-mono uppercase px-1 rounded"
      style={{ color: entry.accentColor }}
    >
      {entry.branch_location}
    </span>
    <span className="text-[9px] font-mono text-neutral-600 shrink-0">
      {new Date(entry.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  </button>
))}
    </div>
  </div>
)}
        </div>
      </div>

      <ViewAllModal
  isOpen={showAllModal}
  onClose={() => setShowAllModal(false)}
  cafes={availableCafes}
  accentMap={ACCENT_MAP}
  defaultAccent={DEFAULT_ACCENT}
  selectedBranch={selectedBranch}
/>

    {/* Selected Cafe Modal */}
    <CafeDetailModal
  isOpen={!!activeModalItem}
  onClose={closeCafeModal}
  cafe={activeModalItem}
  variant="cafe"
  accentColor={activeModalItem?.reelAccent?.color}
  onExclude={() => activeModalItem && handleRemoveCafe(activeModalItem.id)}
  onSpinAgain={() => {
    setActiveModalItem(null);
    startSpin();
  }}
  footer={
    suggestedSponsor && (
      <div className="mt-5 pt-4 border-t border-neutral-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
            Nearby In {suggestedSponsor.branch_location}
          </span>
          <span className="text-[9px] font-mono tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
            Partner
          </span>
        </div>

        <button
          onClick={() => setShowPartnerInfo(true)}
          className="w-full flex items-center justify-between p-2 rounded-lg border border-neutral-900 bg-neutral-900/50 hover:bg-neutral-900 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src={suggestedSponsor.logo_url}
              alt={suggestedSponsor.name}
              width={64}
              height={64}
              className="w-8 h-8 rounded-lg object-cover border border-neutral-700/60 shadow-md"
            />
            <div className="min-w-0">
              <h4 className="text-xs font-medium text-neutral-200 truncate group-hover:text-white">
                {suggestedSponsor.name}
              </h4>
            </div>
          </div>
          <span className="text-neutral-500 group-hover:text-white text-xs pl-2">→</span>
        </button>

        <div className="mt-2 text-right">
          <Link
            href="/partner"
            className="text-[9px] font-mono text-neutral-600 hover:text-neutral-400 transition-colors inline-flex items-center gap-1"
          >
            <span>Become a partner & feature your cafe</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    )
  }
/>

<CafeDetailModal
  isOpen={showPartnerInfo}
  onClose={closeAllModals}
  onBack={() => setShowPartnerInfo(false)}
  cafe={suggestedSponsor}
  variant="sponsor"
  accentColor="#fbbf24"
  zIndex={60}
/>

    </main>
  );
}