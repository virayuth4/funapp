"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { SPONSORS } from "@/app/data/sponsors";
import { REVIEWS } from "@/app/data/reviews";
import { ACCENT_MAP, DEFAULT_ACCENT } from "@/lib/cardAccent";
import Link from "next/link";
import ViewAllModal from "./Components/viewAllModal";
import CafeDetailModal from "./Components/cafeDetailsModal";
import CafeListView from "./Components/cafeListViews";
import SpinReel, { buildSpin } from "./Components/spinReel";
import RollHistory from "./Components/rollHistory";
import { getPusherClient } from "@/lib/pusherClient";
import SessionShareModal from "./Components/sessionShareModal";
import formattedCountdown from "@/lib/formttedCountdown";
import { HomeNavigation } from "./Components/navigation";

const TYPE_FIELD = "category";

export default function HomeClient({ initialCafes, initialCategories, initialError }) {
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedType, setSelectedType] = useState("cafe");
  const [removedIds, setRemovedIds] = useState([]);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [suggestedSponsors, setSuggestedSponsors] = useState([]);
  const [modalIsList, setModalIsList] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("cafeSpinMuted") === "true";
    } catch {
      return false;
    }
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cafeSpinMuted", String(next));
      } catch {}
      return next;
    });
  };

  const [rollHistory, setRollHistory] = useState([]);
  const [showAllModal, setShowAllModal] = useState(false);

  // Handle to the reel: reelRef.current.play(...) / .cancel()
  const reelRef = useRef(null);

  // --- Shared session state ---
  const [sessionId, setSessionId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const sessionTimeoutRef = useRef(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [countdown, setCountdown] = useState(null); // seconds remaining

  const [cafes, setCafes] = useState(initialCafes);
  const [availableCategories, setAvailableCategories] = useState(initialCategories);
  const [isLoadingCafes, setIsLoadingCafes] = useState(!initialCafes?.length);
  const [loadError, setLoadError] = useState(initialError);

  const leaveSession = useCallback((forced = false) => {
    setSessionId(null);
    setShowShareModal(false);
    setSessionExpiresAt(null);
    setCountdown(null);

    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("session");
    window.history.pushState({}, "", url);

    if (forced) {
      reelRef.current?.cancel();
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
      const remaining = Math.max(0, Math.ceil((sessionExpiresAt - Date.now()) / 1000));

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
      console.log("Data", json);

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

  const HISTORY_KEY = "cafeRollHistory";
  const MAX_HISTORY = 20;

  const branches = ["ALL", "BKK", "TTP", "TK", "IFL"];

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setRollHistory(JSON.parse(stored));
    } catch {
      // ignore malformed/missing data
    }
  }, []);

  // Read ?session= from the URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const sid = url.searchParams.get("session");
    if (sid) {
      setSessionId(sid);
      setSessionExpiresAt(Date.now() + SESSION_TIMEOUT);
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

      const notRemoved = !removedIds.includes(cafe.id);
      return matchInRoll && matchBranch && matchType && notRemoved;
    });
  }, [cafes, selectedBranch, selectedType, removedIds]);

  const pickSponsorsFor = useCallback(
    (cafe) => {
      const sponsors = cafes.filter((c) => c.is_sponsored === true && c.id !== cafe.id);
      if (sponsors.length === 0) return [];

      const matched = sponsors.filter((s) => s.branch_location === cafe.branch_location);
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

  const addToHistory = useCallback((cafe) => {
    const entry = {
      id: cafe.id,
      name: cafe.name,
      branch_location: cafe.branch_location,
      logo_url: cafe.logo_url,
      accentColor: cafe.reelAccent?.color,
      timestamp: Date.now(),
      visited: false,
      historyId: null,
    };

    setRollHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    let userId = null;
    try {
      userId = localStorage.getItem("userId");
    } catch {}
    if (!userId) return;

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
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.entry?.id) return;
        setRollHistory((prev) => {
          const updated = prev.map((e) =>
            e.timestamp === entry.timestamp ? { ...e, historyId: data.entry.id } : e
          );
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      })
      .catch((err) => console.error("Failed to sync history to backend:", err));
  }, []);

  const toggleVisited = (timestamp) => {
    const target = rollHistory.find((e) => e.timestamp === timestamp);
    if (!target) return;
    const nextVisited = !target.visited;

    setRollHistory((prev) => {
      const updated = prev.map((e) =>
        e.timestamp === timestamp ? { ...e, visited: nextVisited } : e
      );
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (!target.historyId) return;

    let userId = null;
    try {
      userId = localStorage.getItem("userId");
    } catch {}
    if (!userId) return;

    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/history/${target.historyId}/visited`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, visited: nextVisited }),
    }).catch((err) => console.error("Failed to sync visited status:", err));
  };

  const clearHistory = () => {
    setRollHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  const closeAllModals = () => {
    setActiveModalItem(null);
    setSuggestedSponsors([]);
  };

  // --- Reel callbacks ---
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
    setActiveModalItem(null);
    setSuggestedSponsors([]);
  }, []);

  const handleSpinEnd = useCallback(
    (winner) => {
      setIsSpinning(false);
      if (!winner) return;
      setSuggestedSponsors(pickSponsorsFor(winner));
      setActiveModalItem(winner);
      addToHistory(winner);
    },
    [pickSponsorsFor, addToHistory]
  );

  // Server payload -> reel.play(). Identity is stable, so the Pusher
  // subscription below no longer re-subscribes when `cafes` changes.
  const playSharedSpin = useCallback((payload) => {
    reelRef.current?.play({
      reelIds: payload.reel,
      targetOffset: payload.targetOffset,
      winnerId: payload.winner_store_id,
    });
  }, []);

  // Subscribe to the session's realtime channel
  useEffect(() => {
    if (!sessionId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`session-${sessionId}`);

    channel.bind("spin", (payload) => {
      playSharedSpin(payload);
    });

    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/session/${sessionId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((state) => {
        if (state?.spinning) playSharedSpin(state);
      })
      .catch((err) => console.error("Failed to fetch session state:", err));

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`session-${sessionId}`);
    };
  }, [sessionId, playSharedSpin]);

  const createSession = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch_location: selectedBranch, selected_type: selectedType }),
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
    }
  };

  // --- Spin button handler: same path for solo and shared ---
  const requestSpin = async () => {
    if (isSpinning || availableCafes.length === 0) return;

    const spin = buildSpin(availableCafes);
    if (!spin) return;

    // Animate instantly for the initiator, no network wait.
    reelRef.current?.play(spin);

    if (!sessionId) return;

    // Shared session: broadcast the same reel/winner to everyone else.
    try {
      const socketId = getPusherClient().connection.socket_id;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/session/${sessionId}/spin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reel: spin.reelIds,
            winnerId: spin.winnerId,
            targetOffset: spin.targetOffset,
            socketId,
          }),
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

  const handleRemoveCafe = (cafeId) => {
    setRemovedIds((prev) => [...prev, cafeId]);
    setActiveModalItem(null);
    setSuggestedSponsors([]);
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
      <HomeNavigation />
      <main className="min-h-screen bg-[#0d0f12] text-neutral-100 flex flex-col items-center relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.06),transparent_70%)] pointer-events-none" />

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
              <SpinReel
                ref={reelRef}
                cafes={cafes}
                availableCafes={availableCafes}
                isSpinning={isSpinning}
                muted={isMuted}
                onSpinStart={handleSpinStart}
                onSpinEnd={handleSpinEnd}
              />

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
                    <span className="relative z-10">
                      {isSpinning ? "Selecting Cafe..." : "Spin"}
                    </span>
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
                    <button
                      onClick={createSession}
                      className="text-xs text-neutral-400 underline hover:text-white cursor-pointer"
                    >
                      Click here to spin with friends
                    </button>
                  )}
                </div>

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
            </>
          )}
        </div>

        <SessionShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          sessionId={sessionId}
          sessionUrl={sessionUrl}
        />

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