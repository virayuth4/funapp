"use client";

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Image from "next/image";

const CARD_WIDTH = 180;
const CARD_GAP = 12;
const TOTAL_SLOT_WIDTH = CARD_WIDTH + CARD_GAP;
const REEL_SIZE = 65;
const WINNER_INDEX = 50;

const CARD_ACCENTS = [
  {
    name: "Popular",
    color: "#4b69ff",
    bg: "from-blue-600/20 to-transparent",
    border: "border-blue-500",
  },
  {
    name: "Trending",
    color: "#8847ff",
    bg: "from-purple-600/20 to-transparent",
    border: "border-purple-500",
  },
  {
    name: "Top Pick",
    color: "#d32ce6",
    bg: "from-pink-600/20 to-transparent",
    border: "border-pink-500",
  },
  {
    name: "Featured",
    color: "#eb4b4b",
    bg: "from-red-600/20 to-transparent",
    border: "border-red-500",
  },
  {
    name: "Signature",
    color: "#ffd700",
    bg: "from-amber-400/25 to-transparent",
    border: "border-yellow-400",
  },
  {
    name: "New",
    color: "#4b69ff",
    bg: "from-green-600/20 to-transparent",
    border: "border-green-500",
  },
  {
    name: "Staff Favorite",
    color: "#22d3ee",
    bg: "from-cyan-500/25 to-transparent",
    border: "border-cyan-400",
  },
];

const ACCENT_MAP = Object.fromEntries(
  CARD_ACCENTS.map((accent) => [accent.name, accent])
);

const DEFAULT_ACCENT = CARD_ACCENTS[0];

function shuffledCopy(arr) {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export default function SpinWheel({
  cafes = [],
  onWinner,
  onSpinningChange,
  spinSoundsRef,
  disabled = false,
}) {
  const [reelItems, setReelItems] = useState([]);
  const [translateX, setTranslateX] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("none");
  const [isSpinning, setIsSpinning] = useState(false);

  const lastTickIndexRef = useRef(-1);
  const animationFrameRef = useRef(null);

  const availableCafes = useMemo(() => {
    return cafes.filter(Boolean);
  }, [cafes]);

  const createReel = useCallback(() => {
    if (availableCafes.length === 0) return [];

    const laps = Math.ceil(REEL_SIZE / availableCafes.length);

    const reel = Array.from(
      { length: laps },
      () => shuffledCopy(availableCafes)
    ).flat();

    return reel.slice(0, REEL_SIZE).map((cafe, index) => ({
      ...cafe,
      reelAccent: ACCENT_MAP[cafe.accent] || DEFAULT_ACCENT,
      instanceId: `${cafe.id}-${index}-${Date.now()}`,
    }));
  }, [availableCafes]);

  const preloadImage = useCallback((src) => {
    if (!src) return;

    const fullUrl =
      `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;

    const img = new window.Image();

    img.fetchPriority = "high";
    img.src = fullUrl;
  }, []);

  const startSpin = useCallback(() => {
    if (
      isSpinning ||
      disabled ||
      availableCafes.length === 0
    ) {
      return;
    }

    const generatedReel = createReel();

    const chosenWinner = generatedReel[WINNER_INDEX];

    if (!chosenWinner) return;

    setIsSpinning(true);

    // Preload first two gallery images
    const imagesToPreload =
      chosenWinner.image_paths?.slice(0, 2) || [];

    imagesToPreload.forEach(preloadImage);

    const jitter =
      (Math.random() - 0.5) *
      (CARD_WIDTH - 28);

    const targetOffset =
      -(
        WINNER_INDEX *
          TOTAL_SLOT_WIDTH +
        jitter
      );

    setTransitionStyle("none");
    setTranslateX(0);
    setReelItems(generatedReel);

    lastTickIndexRef.current = -1;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionStyle(
          "transform 5.2s cubic-bezier(0.12, 0.8, 0.18, 1)"
        );

        setTranslateX(targetOffset);

        const startTime = performance.now();
        const duration = 5200;

        const checkTicker = (now) => {
          const elapsed = now - startTime;

          const progress = Math.min(
            elapsed / duration,
            1
          );

          const easedProgress =
            1 - Math.pow(1 - progress, 4);

          const currentPos =
            Math.abs(
              targetOffset *
                easedProgress
            );

          const currentSlot = Math.floor(
            (currentPos + CARD_WIDTH / 2) /
              TOTAL_SLOT_WIDTH
          );

          if (
            currentSlot !==
              lastTickIndexRef.current &&
            currentSlot <= WINNER_INDEX
          ) {
            lastTickIndexRef.current =
              currentSlot;

            spinSoundsRef?.current?.playTickSound(
              easedProgress
            );
          }

          if (progress < 1) {
            animationFrameRef.current =
              requestAnimationFrame(
                checkTicker
              );
          } else {
            spinSoundsRef?.current?.playRevealSound();

            setIsSpinning(false);

            if (onWinner) {
              onWinner(chosenWinner);
            }
          }
        };

        animationFrameRef.current =
          requestAnimationFrame(checkTicker);
      });
    });
  }, [
    isSpinning,
    disabled,
    availableCafes,
    createReel,
    preloadImage,
    onWinner,
    spinSoundsRef,
  ]);

  useEffect(() => {
    if (!isSpinning) {
      setTransitionStyle("none");
      setTranslateX(0);
      setReelItems(createReel());

      lastTickIndexRef.current = -1;
    }
  }, [createReel, isSpinning]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <style jsx>{`
        @keyframes pulseGlow {
          0%,
          100% {
            box-shadow:
              0 0 6px 0px var(--glow-color),
              0 0 0px 0px var(--glow-color);
          }

          50% {
            box-shadow:
              0 0 26px 6px var(--glow-color),
              0 0 12px 3px var(--glow-color);
          }
        }

        .staff-favorite-glow {
          animation:
            pulseGlow 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Reel */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border-2 border-neutral-800 bg-[#12151b] shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] py-6">

        {/* Top indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-amber-400 z-30 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />

        {/* Bottom indicator */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[14px] border-b-amber-400 z-30 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />

        {/* Center line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-amber-400 z-20 shadow-[0_0_12px_#fbbf24] opacity-90" />

        {/* Left fade */}
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#12151b] via-[#12151b]/80 to-transparent z-10 pointer-events-none" />

        {/* Right fade */}
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#12151b] via-[#12151b]/80 to-transparent z-10 pointer-events-none" />

        {/* Track */}
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
            {reelItems.map((cafe) => {
              const accent =
                cafe.reelAccent ||
                DEFAULT_ACCENT;

              const isStaffFav =
                accent.name ===
                "Staff Favorite";

              return (
                <div
                  key={cafe.instanceId}
                  style={{
                    width: `${CARD_WIDTH}px`,
                    ...(isStaffFav
                      ? {
                          "--glow-color":
                            accent.color,
                        }
                      : {}),
                  }}
                  className={`
                    h-[185px]
                    shrink-0
                    bg-gradient-to-b
                    ${accent.bg}
                    bg-neutral-900/90
                    rounded-md
                    border-b-4
                    ${accent.border}
                    border-t
                    border-x
                    border-neutral-800/80
                    p-3
                    flex
                    flex-col
                    justify-between
                    relative
                    shadow-lg
                    group
                    ${isStaffFav ? "staff-favorite-glow" : ""}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">
                      {cafe.branch_location}
                    </span>

                    <span
                      className="text-[9px] font-mono font-bold tracking-wider uppercase px-1 rounded"
                      style={{
                        color: accent.color,
                      }}
                    >
                      {accent.name}
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Spin button */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={startSpin}
          disabled={
            isSpinning ||
            disabled ||
            availableCafes.length === 0
          }
          className="relative px-10 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-[length:200%_200%] hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 active:scale-95 text-black font-extrabold rounded shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all uppercase tracking-widest text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:animate-none cursor-pointer border border-amber-300/40 animate-gradient-x animate-pulse-glow overflow-hidden"
        >
          <span className="relative z-10">
            {isSpinning
              ? "Selecting Cafe..."
              : "Spin"}
          </span>

          <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
        </button>
      </div>
    </div>
  );
}