"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { SPONSORS } from "@/app/data/sponsors";
import { REVIEWS } from "@/app/data/reviews";
import Link from "next/link";
import Image from "next/image";
import ViewAllModal from "./Components/viewAllModal";
import CafeDetailModal from "./Components/cafeDetailsModal";
import CafeListView from "./Components/cafeListViews";
import SpinSounds from "./Components/spinSounds";
import RollHistory from "./Components/rollHistory";
import { getPusherClient } from "@/lib/pusherClient";
import SessionShareModal from "./Components/sessionShareModal";
import formattedCountdown from "@/lib/formttedCountdown";

const TYPE_FIELD = "category";

const CARD_ACCENTS = [
  { name: "Popular", color: "#4b69ff", bg: "from-blue-600/20 to-transparent", border: "border-blue-500" },
  { name: "Trending", color: "#8847ff", bg: "from-purple-600/20 to-transparent", border: "border-purple-500" },
  { name: "Top Pick", color: "#d32ce6", bg: "from-pink-600/20 to-transparent", border: "border-pink-500" },
  { name: "Featured", color: "#eb4b4b", bg: "from-red-600/20 to-transparent", border: "border-red-500" },
  { name: "Signature", color: "#ffd700", bg: "from-amber-400/25 to-transparent", border: "border-yellow-400" },
  { name: "New", color: "#4b69ff", bg: "from-green-600/20 to-transparent", border: "border-green-500" },
  { name: "Staff Favorite", color: "#22d3ee", bg: "from-cyan-500/25 to-transparent", border: "border-cyan-400" },
  { name: "Hidden Gem", color: "#10b981", bg: "from-emerald-600/20 to-transparent", border: "border-emerald-500" },
];
const ACCENT_MAP = Object.fromEntries(CARD_ACCENTS.map((a) => [a.name, a]));
const DEFAULT_ACCENT = CARD_ACCENTS[0];

const CARD_WIDTH = 180;
const CARD_GAP = 12;
const TOTAL_SLOT_WIDTH = CARD_WIDTH + CARD_GAP;
const REEL_SIZE = 65;
const WINNER_INDEX = 50;

export default function HomeClient({ initialCafes, initialCategories, initialError }) {
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedType, setSelectedType] = useState("cafe");
  const [removedIds, setRemovedIds] = useState([]);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [suggestedSponsors, setSuggestedSponsors] = useState([]);
  const [modalIsList, setModalIsList] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
 const [isMuted, setIsMuted] = useState(false);

 const isMutedRef = useRef(false);

useEffect(() => {
  isMutedRef.current = isMuted;
}, [isMuted]);




const toggleMute = () => {
  setIsMuted((prev) => {
    const next = !prev;
    try {
      localStorage.setItem("cafeSpinMuted", String(next));
    } catch {}
    return next;
  });
};

 useEffect(() => {
  try {
    setIsMuted(localStorage.getItem("cafeSpinMuted") === "true");
  } catch {}
}, []);

  const [reelItems, setReelItems] = useState([]);
  const [translateX, setTranslateX] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("none");
  const rollHistoryRef = useRef(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // --- Shared session state ---
  const [sessionId, setSessionId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false); 
  const [linkCopied, setLinkCopied] = useState(false);
  const activeSpinRef = useRef(null);
    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    const sessionTimeoutRef = useRef(null);
    const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
    const [countdown, setCountdown] = useState(null); // seconds remaining

  const [cafes, setCafes] = useState(initialCafes);
  const [availableCategories, setAvailableCategories] = useState(initialCategories);
  const [isLoadingCafes, setIsLoadingCafes] = useState(!initialCafes?.length);
  const [loadError, setLoadError] = useState(initialError);
  const [sessionError, setSessionError] = useState(null);
const [isCreatingSession, setIsCreatingSession] = useState(false);
const itemNoun = selectedType === "ALL" ? "place" : selectedType;
const excludedLabel = `${removedIds.length} ${itemNoun}${removedIds.length === 1 ? "" : "s"} excluded`;


const leaveSession = useCallback((forced = false) => {
  setSessionId(null);
  setShowShareModal(false);
  setSessionExpiresAt(null);
  setCountdown(null);
  activeSpinRef.current = null;

  if (sessionTimeoutRef.current) {
    clearTimeout(sessionTimeoutRef.current);
    sessionTimeoutRef.current = null;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("session");
  window.history.pushState({}, "", url);

  if (forced) {
    setIsSpinning(false);
    // Optional: surface this to the user however you show transient messages
    console.log("Session ended — time limit reached.");
  }
}, []);

useEffect(() => {
  if (!sessionId) return;

  sessionTimeoutRef.current = setTimeout(() => {
    leaveSession(true);
  }, SESSION_TIMEOUT);

  return () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };
}, [sessionId, leaveSession]);

useEffect(() => {
  if (!sessionExpiresAt) {
    setCountdown(null);
    return;
  }

  const updateCountdown = () => {
    const remaining = Math.max(
      0,
      Math.ceil((sessionExpiresAt - Date.now()) / 1000)
    );

    setCountdown(remaining);

    if (remaining <= 0) {
      leaveSession(true);
    }
  };

  updateCountdown();

  const interval = setInterval(updateCountdown, 1000);

  return () => clearInterval(interval);
}, [sessionExpiresAt, leaveSession]);

  const loadData = useCallback(async (signal) => {
    setIsLoadingCafes(true);
    setLoadError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishments`, {
        signal,
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const json = await res.json();
      console.log("Data", json)

      setCafes(Array.isArray(json.data) ? json.data : []);
      setAvailableCategories(Array.isArray(json.categories) ? json.categories : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Failed to fetch establishments:", err);
      setLoadError("Couldn't load cafes right now. Please try again.");
      setCafes([]);
    } finally {
      setIsLoadingCafes(false);
    }
  }, []);

useEffect(() => {
  if (initialCafes?.length) return; // SSR already gave us good data, skip refetch
  const controller = new AbortController();
  loadData(controller.signal);
  return () => controller.abort();
}, [loadData, initialCafes]);


  const lastTickIndexRef = useRef(-1);
  const animationFrameRef = useRef(null);
  const spinSoundsRef = useRef(null);
  const branches = ["ALL", "BKK", "TTP", "TK", "IFL"];



  // Read ?session= from the URL on mount
useEffect(() => {
  const url = new URL(window.location.href);
  const sid = url.searchParams.get("session");
  if (sid) {
    setSessionId(sid);
    setSessionExpiresAt(Date.now() + SESSION_TIMEOUT);
  }

  const branchParam = url.searchParams.get("branch");
  if (branchParam && branches.includes(branchParam)) {
    setSelectedBranch(branchParam);
  }

  const typeParam = url.searchParams.get("type");
  if (typeParam) {
    setSelectedType(typeParam);
  }
}, []); // run once on mount

  const typeTabs = useMemo(() => {
    const known = new Set(["cafe", "restaurant"]);
    availableCategories.forEach((c) => {
      if (c) {
        String(c)
          .toLowerCase()
          .split(",")
          .forEach((cat) => {
            const trimmed = cat.trim();
            if (trimmed) known.add(trimmed);
          });
      }
    });
    return ["ALL", ...Array.from(known)];
  }, [availableCategories]);

  useEffect(() => {
  const url = new URL(window.location.href);
  const typeParam = url.searchParams.get("type");
  if (typeParam && !typeTabs.includes(typeParam)) {
    setSelectedType("cafe");
  }
}, [typeTabs]);

  const openCafeModal = (cafe, fromList = false) => {
    setActiveModalItem(cafe);
    setShowReviews(false);
    setModalIsList(fromList);
    setSuggestedSponsors(pickSponsorsFor(cafe));
  };

  const closeCafeModal = () => {
    setActiveModalItem(null);
    setSuggestedSponsors([]);
    setModalIsList(false);
    setShowReviews(false);
  };

  const availableCafes = useMemo(() => {
    return cafes.filter((cafe) => {
      const matchInRoll = cafe.in_roll === true;
      const matchBranch = selectedBranch === "ALL" || cafe.branch_location === selectedBranch;

      const cafeCategories = String(cafe[TYPE_FIELD] || "")
        .toLowerCase()
        .split(",")
        .map((cat) => cat.trim());

      const matchType =
        selectedType === "ALL" || cafeCategories.includes(selectedType.toLowerCase());

        const notRemoved = !removedIds.includes(String(cafe.id));
      return matchInRoll && matchBranch && matchType && notRemoved;
    });
  }, [cafes, selectedBranch, selectedType, removedIds]);

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

const pickSponsorsFor = useCallback(
  (cafe) => {
    const sponsors = cafes.filter((c) => c.is_sponsored === true && c.id !== cafe.id);
    if (sponsors.length === 0) return [];

    const matched = sponsors.filter((s) => s.category === cafe.category);
    const pool = matched.length > 0 ? matched : sponsors;

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 1);
  },
  [cafes]
);
  useEffect(() => {
    if (!isSpinning) {
      setTransitionStyle("none");
      setTranslateX(0);
      setReelItems(createReel());
      lastTickIndexRef.current = -1;
    }
  }, [createReel, isSpinning]);

// Keep ?branch= and ?type= in sync with selections, preserving other params
useEffect(() => {
  const url = new URL(window.location.href);

  if (selectedBranch && selectedBranch !== "ALL") {
    url.searchParams.set("branch", selectedBranch);
  } else {
    url.searchParams.delete("branch");
  }

  if (selectedType && typeTabs.includes(selectedType) && selectedType !== "ALL") {
    url.searchParams.set("type", selectedType);
  } else {
    url.searchParams.delete("type");
  }

  window.history.replaceState({}, "", url);
}, [selectedBranch, selectedType, typeTabs]);



  const preloadImage = (src, label = "") => {
    if (!src) return;
    const fullUrl = `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
    const img = new window.Image();
    img.fetchPriority = "high";
    img.src = fullUrl;
  };

  // --- Solo spin (used when there's no shared session) ---
  const startSpin = () => {
    if (isSpinning || availableCafes.length === 0) return;

    setIsSpinning(true);
    setActiveModalItem(null);
    setSuggestedSponsors([]);

    const generatedReel = createReel();
    const chosenWinner = generatedReel[WINNER_INDEX];

    const imagesToPreload = chosenWinner?.image_paths?.slice(0, 2) || [];
    imagesToPreload.forEach((path, index) => preloadImage(path, `Index ${index}`));

    const jitter = (Math.random() - 0.5) * (CARD_WIDTH - 28);
    const targetOffset = -(WINNER_INDEX * TOTAL_SLOT_WIDTH + jitter);

    setTransitionStyle("none");
    setTranslateX(0);
    setReelItems(generatedReel);
    lastTickIndexRef.current = -1;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionStyle("transform 5.2s cubic-bezier(0.12, 0.8, 0.18, 1)");
        setTranslateX(targetOffset);

        const startTime = performance.now();
        const duration = 5200;

        const checkTicker = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);

          const easedProgress = 1 - Math.pow(1 - progress, 4);
          const currentPos = Math.abs(targetOffset * easedProgress);
          const currentSlot = Math.floor((currentPos + CARD_WIDTH / 2) / TOTAL_SLOT_WIDTH);

          if (currentSlot !== lastTickIndexRef.current && currentSlot <= WINNER_INDEX) {
            lastTickIndexRef.current = currentSlot;
            if (!isMuted) {
            spinSoundsRef.current?.playTickSound(easedProgress);
          }
          }

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(checkTicker);
          } else {
            if (!isMuted) {
            spinSoundsRef.current?.playRevealSound();
          }
            setSuggestedSponsors(pickSponsorsFor(chosenWinner));
            setActiveModalItem(chosenWinner);
            rollHistoryRef.current?.addEntry(chosenWinner);
            setIsSpinning(false);
          }
        };

        animationFrameRef.current = requestAnimationFrame(checkTicker);
      });
    });
  };

  // --- Shared spin: finish + play, driven by server payload ---
  const finishSpin = useCallback(
    (winnerCafe) => {
      if (!winnerCafe) {
        setIsSpinning(false);
        return;
      }
      if (!isMutedRef.current) {
        spinSoundsRef.current?.playRevealSound();
      }
      setSuggestedSponsors(pickSponsorsFor(winnerCafe));
      setActiveModalItem(winnerCafe);
      rollHistoryRef.current?.addEntry(winnerCafe);
      setIsSpinning(false);
    },
    [pickSponsorsFor]
  );



const playSharedSpin = useCallback(
  (payload) => {
    const { reel: reelIds, targetOffset, winner_store_id } = payload;

    if (!Array.isArray(reelIds)) {
      console.log("BAILING: reelIds not an array");
      return;
    }

    // Dedupe: if we're already animating this exact spin (e.g. initiator's
    // optimistic call + the Pusher echo, or a late-join race), skip the repeat.
      if (winner_store_id != null && String(activeSpinRef.current) === String(winner_store_id)) {
      return;
    }
    activeSpinRef.current = winner_store_id;

    const resolvedReel = reelIds.map((id, i) => {
      const cafe = cafes.find((c) => String(c.id) === String(id));
      return {
        ...(cafe || { id }),
        reelAccent: ACCENT_MAP[cafe?.accent] || DEFAULT_ACCENT,
        instanceId: `${id}-${i}-${Date.now()}`,
      };
    });
    const winnerCafe = cafes.find((c) => String(c.id) === String(winner_store_id));

    setIsSpinning(true);
    setActiveModalItem(null);
    setSuggestedSponsors([]);

    const imagesToPreload = winnerCafe?.image_paths?.slice(0, 2) || [];
    imagesToPreload.forEach((path, index) => preloadImage(path, `Index ${index}`));

    setTransitionStyle("none");
    setTranslateX(0);
    setReelItems(resolvedReel);
    lastTickIndexRef.current = -1;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionStyle("transform 5.2s cubic-bezier(0.12, 0.8, 0.18, 1)");
        setTranslateX(targetOffset);

        const startTime = performance.now();
        const duration = 5200;

        const checkTicker = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);

          const easedProgress = 1 - Math.pow(1 - progress, 4);
          const currentPos = Math.abs(targetOffset * easedProgress);
          const currentSlot = Math.floor((currentPos + CARD_WIDTH / 2) / TOTAL_SLOT_WIDTH);

        if (currentSlot !== lastTickIndexRef.current && currentSlot <= WINNER_INDEX) {
          lastTickIndexRef.current = currentSlot;
          if (!isMutedRef.current) {
            spinSoundsRef.current?.playTickSound(easedProgress);
          }
        }


        if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(checkTicker);
          } else {
            if (!isMutedRef.current) {
              spinSoundsRef.current?.playRevealSound();
            }
            setSuggestedSponsors(pickSponsorsFor(winnerCafe));
            setActiveModalItem(winnerCafe);
            rollHistoryRef.current?.addEntry(winnerCafe);
            setIsSpinning(false);
            activeSpinRef.current = null;
          }
        };

        animationFrameRef.current = requestAnimationFrame(checkTicker);
      });
    });
  },
  [cafes, pickSponsorsFor]
);

  // Subscribe to the session's realtime channel
useEffect(() => {
  if (!sessionId) return;

  let pusher, channel;
  try {
    pusher = getPusherClient();
    channel = pusher.subscribe(`session-${sessionId}`);
    channel.bind("spin", (payload) => playSharedSpin(payload));
    channel.bind("exclude", (payload) => {
      if (Array.isArray(payload?.excluded_ids)) setRemovedIds(payload.excluded_ids);
    });
  } catch (err) {
    console.error("Pusher setup failed:", err);
    return;
  }

  fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/session/${sessionId}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((state) => {
      if (!state) return;
      if (Array.isArray(state.excluded_ids)) setRemovedIds(state.excluded_ids);
      if (state.spinning) playSharedSpin(state);
    })
    .catch((err) => console.error("Failed to fetch session state:", err));

  return () => {
    channel.unbind_all();
    pusher.unsubscribe(`session-${sessionId}`);
  };
}, [sessionId, playSharedSpin]);

const createSession = async () => {
  if (isCreatingSession) return;
  setIsCreatingSession(true);
  setSessionError(null);

  try {
    const base = process.env.NEXT_PUBLIC_BACKEND;
    if (!base) throw new Error("NEXT_PUBLIC_BACKEND is not set in this build");

    const res = await fetch(`${base}/api/eatdoko/session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branch_location: selectedBranch,
        selected_type: selectedType,
        excluded_ids: removedIds,
      }),
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const { id } = await res.json();
    setSessionId(id);
    setSessionExpiresAt(Date.now() + SESSION_TIMEOUT);

    const url = new URL(window.location.href);
    url.searchParams.set("session", id);
    window.history.pushState({}, "", url);

    setShowShareModal(true);
  } catch (err) {
    console.error("Failed to create session:", err);
    setSessionError("Couldn't start a session. Please try again.");
  } finally {
    setIsCreatingSession(false);
  }
};




  // --- Spin button handler: routes to solo or shared spin ---
const requestSpin = async () => {
  if (isSpinning || availableCafes.length === 0) return;

  if (!sessionId) {
    startSpin();
    return;
  }

  // Build the reel/winner locally, same as solo — no network wait needed to animate.
  const generatedReel = createReel();
  const winnerCafe = generatedReel[WINNER_INDEX];
  const jitter = (Math.random() - 0.5) * (CARD_WIDTH - 28);
  const targetOffset = -(WINNER_INDEX * TOTAL_SLOT_WIDTH + jitter);
  const reelIds = generatedReel.map((c) => c.id);

  // Animate instantly for the initiator.
  playSharedSpin({ reel: reelIds, targetOffset, winner_store_id: winnerCafe.id });

  try {
    const socketId = getPusherClient().connection.socket_id;

   const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/session/${sessionId}/spin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reel: reelIds, winnerId: winnerCafe.id, targetOffset, socketId }),
      }
    );
    if (res.status === 409) {
      console.warn("Lost the race — the other spin's Pusher event will take over");
    } else if (!res.ok) {
      console.error("Failed to persist spin");
    }
  } catch (err) {
    console.error("Failed to request spin:", err);
  }
};

const handleRemoveCafe = async (cafeId) => {
  const id = String(cafeId);
  setRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id])); // optimistic
  setActiveModalItem(null);
  setSuggestedSponsors([]);

  if (!sessionId) return;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/session/${sessionId}/exclude`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeId: id }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.excluded_ids)) setRemovedIds(data.excluded_ids);
    }
  } catch (err) {
    console.error("Failed to sync exclusion:", err);
  }
};

const resetExcluded = async () => {
  setRemovedIds([]);
  if (!sessionId) return;

  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/session/${sessionId}/exclude/reset`,
      { method: "POST" }
    );
  } catch (err) {
    console.error("Failed to sync reset:", err);
  }
};

  const openHistoryEntry = (entry) => {
    const fullCafe = cafes.find((c) => String(c.id) === String(entry.id));

    if (!fullCafe) {
      console.warn("No matching cafe found for history entry:", entry);
      return;
    }

    setSuggestedSponsors([]);
    setModalIsList(false);
    setActiveModalItem({
      ...fullCafe,
      reelAccent: ACCENT_MAP[fullCafe.accent] || DEFAULT_ACCENT,
    });
  };

  const sessionUrl = useMemo(() => {
  if (typeof window === "undefined" || !sessionId) return "";
  const url = new URL(window.location.href);
  url.searchParams.set("session", sessionId);
  return url.toString();
}, [sessionId]);

  return (
    <>
 
<main className="min-h-dvh bg-[#0d0f12] text-neutral-100 flex flex-col items-center relative overflow-hidden select-none">      <SpinSounds ref={spinSoundsRef}  muted={isMuted} />
    <style jsx global>{`
  html,
  body {
    background-color: #0d0f12;
  }

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.06),transparent_70%)] pointer-events-none " />

      <div className="flex flex-col items-center w-full max-w-4xl relative z-10">
        <header className="text-center mb-8 mt-12 md:mt-24">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-white uppercase drop-shadow-md">
            Where to next?
          </h1>
        </header>

       

        <div className="flex flex-nowrap items-center overflow-x-auto gap-1.5 p-1 rounded-lg border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md mb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {branches.map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              disabled={isSpinning}
              className={`shrink-0 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer disabled:opacity-40 ${
                selectedBranch === branch
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {branch}
            </button>
          ))}
        </div>

        <div className="flex flex-nowrap items-center overflow-x-auto gap-1.5 p-1 rounded-lg border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md mb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {typeTabs.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              disabled={isSpinning}
              className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer disabled:opacity-40 ${
                selectedType === t
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {isLoadingCafes && (
          <div className="w-full max-w-3xl text-center text-xs text-neutral-500 py-6">
            Loading cafes…
          </div>
        )}
        {!isLoadingCafes && loadError && (
          <div className="w-full max-w-3xl text-center text-xs text-red-400 py-6 flex flex-col items-center gap-2">
            <span>{loadError}</span>
            <button
              onClick={() => loadData()}
              className="text-amber-500 underline hover:text-amber-400 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoadingCafes && !loadError && (
          <>
            <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border-2 border-neutral-800 bg-[#12151b] shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] py-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-amber-400 z-30 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[14px] border-b-amber-400 z-30 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-amber-400 z-20 shadow-[0_0_12px_#fbbf24] opacity-90" />
              <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#12151b] via-[#12151b]/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#12151b] via-[#12151b]/80 to-transparent z-10 pointer-events-none" />

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
                          <h4 className="text-xs font-bold text-neutral-100 truncate">{cafe.name}</h4>
                          <p className="text-[10px] text-neutral-400 capitalize">{cafe.category}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
{sessionId && (
  <div className="flex flex-row items-center gap-3 mt-4">
    {countdown != null && (
      <span
        className={`text-xs font-mono tabular-nums ${
          countdown <= 30 ? "text-red-400" : "text-neutral-400"
        }`}
      >
        {formattedCountdown(countdown)}
      </span>
    )}

    <button
      onClick={() => leaveSession(false)}
      className="text-xs text-red-400 underline hover:text-red-300 cursor-pointer"
    >
      Leave session
    </button>
  </div>
)}
            
<div className="mt-4 flex flex-col items-center gap-3">
  <div className="relative flex items-center justify-center">
    <button
      onClick={requestSpin}
      disabled={isSpinning || availableCafes.length === 0}
      className="relative px-10 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-[length:200%_200%] hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 active:scale-95 text-black font-extrabold rounded shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all uppercase tracking-widest text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:animate-none cursor-pointer border border-amber-300/40 animate-gradient-x animate-pulse-glow overflow-hidden"
    >
      <span className="relative z-10">{isSpinning ? "Selecting Cafe..." : "Spin"}</span>
      <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
    </button>

    <button
      onClick={toggleMute}
      aria-label={isMuted ? "Unmute sound" : "Mute sound"}
      title={isMuted ? "Unmute sound" : "Mute sound"}
      className="absolute left-full ml-3 w-10 h-10 flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
    >
      {isMuted ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  </div>

               {/* Session controls */}
<div className="mb-4">
  {sessionId ? (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowShareModal(true)}
        className="text-xs text-neutral-400 underline hover:text-white cursor-pointer"
      >
        Click here to invite others
      </button>
    </div>
  ) : (
    <>
      <button
        onClick={createSession}
        disabled={isCreatingSession}
        className="text-xs text-neutral-400 underline hover:text-white cursor-pointer disabled:opacity-40"
      >
        {isCreatingSession
          ? "Starting session…"
          : "Click here to spin with friends"}
      </button>

      {sessionError && (
        <p className="text-xs text-red-400 mt-1">
          {sessionError}
        </p>
      )}
    </>
  )}
</div>

            {removedIds.length > 0 && (
  <div className="flex items-center gap-2 text-xs text-neutral-500">
    <span>{excludedLabel}</span>
    <span>•</span>
    <button
      onClick={resetExcluded}
      className="text-amber-500 underline hover:text-amber-400 cursor-pointer"
    >
      Reset excluded
    </button>
  </div>
)}
            </div>
          </>
        )}
      </div>

<SessionShareModal
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
  sessionId={sessionId}
  sessionUrl={sessionUrl}
/>

<RollHistory ref={rollHistoryRef} onOpenEntry={openHistoryEntry} />


      <CafeListView
        cafes={availableCafes}
        accentMap={ACCENT_MAP}
        defaultAccent={DEFAULT_ACCENT}
        onSelect={(cafe) => openCafeModal(cafe, true)}
      />

      <CafeDetailModal
        key={`cafe-${activeModalItem?.id ?? "none"}`}
        isOpen={!!activeModalItem}
        onClose={closeCafeModal}
        cafe={activeModalItem}
        sponsors={suggestedSponsors}
        accentColor={activeModalItem?.reelAccent?.color}
        isList={modalIsList}
        onExclude={() => activeModalItem && handleRemoveCafe(activeModalItem.id)}
        onSpinAgain={() => {
          setActiveModalItem(null);
          requestSpin();
        }}
      />
    </main>
    </>
  );
}