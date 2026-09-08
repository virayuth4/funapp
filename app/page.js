"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { CAFES } from "@/app/data/cafes";
import { SPONSORS } from "@/app/data/sponsors";

const WHEEL_PALETTE = [
  "#8529CD",
  "#06B6D4",
  "#F59E0B",
  "#EC4899",
  "#10B981",
  "#3B82F6",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#E11D48",
];

export default function Home() {
  const canvasRef = useRef(null);

  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [removedIds, setRemovedIds] = useState([]);
  const [maxChoices, setMaxChoices] = useState("ALL");
  const [activePool, setActivePool] = useState([]);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Store the contextual sponsor picked specifically for this spin result
  const [suggestedSponsor, setSuggestedSponsor] = useState(null);

  const branches = ["ALL", "BKK", "TTP", "TK"];

  // 1. Filter available cafes based on branch & removals
  const availableCafes = useMemo(() => {
    return CAFES.filter((cafe) => {
      const matchCategory = cafe.category === "cafe";
      const matchBranch =
        selectedBranch === "ALL" || cafe.branch_location === selectedBranch;
      const notRemoved = !removedIds.includes(cafe.id);
      return matchCategory && matchBranch && notRemoved;
    });
  }, [selectedBranch, removedIds]);

  // 2. Uniform sample up to maxChoices
  useEffect(() => {
    if (availableCafes.length === 0) {
      setActivePool([]);
      return;
    }

    if (maxChoices === "ALL" || Number(maxChoices) >= availableCafes.length) {
      setActivePool(availableCafes);
    } else {
      const shuffled = [...availableCafes].sort(() => 0.5 - Math.random());
      setActivePool(shuffled.slice(0, Number(maxChoices)));
    }
  }, [availableCafes, maxChoices]);

  const currentAngleRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Draw wheel
  const drawWheel = (angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const numSegments = activePool.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (numSegments === 0) {
      ctx.fillStyle = "#121212";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 12, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 12;
    const arcSize = (2 * Math.PI) / numSegments;

    activePool.forEach((cafe, i) => {
      const segmentAngle = angle + i * arcSize;

      ctx.beginPath();
      ctx.fillStyle = WHEEL_PALETTE[i % WHEEL_PALETTE.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, segmentAngle, segmentAngle + arcSize);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segmentAngle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
      ctx.shadowBlur = 4;

      const displayName =
        cafe.name.length > 15 ? cafe.name.slice(0, 13) + "…" : cafe.name;
      ctx.fillText(displayName, radius - 20, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☕", centerX, centerY);
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [activePool]);

  // Spin with ease-out cubic
  const spinWheel = () => {
    if (isSpinning || activePool.length === 0) return;

    setIsSpinning(true);
    setActiveModalItem(null);
    setSuggestedSponsor(null);

    const fullRotations = (6 + Math.random() * 4) * (2 * Math.PI);
    const extraStop = Math.random() * (2 * Math.PI);
    const totalDelta = fullRotations + extraStop;

    const startAngle = currentAngleRef.current;
    const duration = 4300;
    let startTime = null;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentRotation = startAngle + totalDelta * easeOutCubic(progress);
      currentAngleRef.current = currentRotation;
      drawWheel(currentRotation);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        const numSegments = activePool.length;
        const arcSize = (2 * Math.PI) / numSegments;
        const pointerAngle = (3 * Math.PI) / 2;

        const normalizedAngle =
          ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const relativeAngle =
          (pointerAngle - normalizedAngle + 2 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(relativeAngle / arcSize) % numSegments;
        const winner = activePool[winningIndex];

        // Pick a relevant partner matching the winning location
        if (SPONSORS && SPONSORS.length > 0) {
          const matched = SPONSORS.filter(
            (s) => s.branch_location === winner.branch_location
          );
          const pool = matched.length > 0 ? matched : SPONSORS;
          setSuggestedSponsor(pool[Math.floor(Math.random() * pool.length)]);
        }

        setActiveModalItem(winner);
        setIsSpinning(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleRemoveCafe = (cafeId) => {
    setRemovedIds((prev) => [...prev, cafeId]);
    setActiveModalItem(null);
    setSuggestedSponsor(null);
  };

  const handleResetPool = () => {
    setRemovedIds([]);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-neutral-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative antialiased selection:bg-white selection:text-black">
      {/* Top Main Section */}
      <div className="flex flex-col items-center w-full max-w-xl">
        {/* Header */}
        <header className="text-center max-w-md mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase">
            Where to Next?
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-400 font-normal">
            Spin the wheel to discover your next coffee destination.
          </p>
        </header>

        {/* Filter Controls */}
        <div className="flex flex-col items-center gap-4 mb-8 w-full">
          {/* Branch Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-full border border-neutral-800 bg-neutral-950">
            {branches.map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                disabled={isSpinning}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-150 cursor-pointer disabled:opacity-40 ${
                  selectedBranch === branch
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {branch === "ALL" ? "All Locations" : branch}
              </button>
            ))}
          </div>

          {/* Max Choice Limits */}
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              Limit:
            </span>
            {["ALL", 2, 3, 4, 6].map((limit) => (
              <button
                key={limit}
                onClick={() => setMaxChoices(limit === "ALL" ? "ALL" : limit)}
                disabled={isSpinning}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                  maxChoices === limit
                    ? "bg-neutral-800 text-white border border-neutral-700"
                    : "text-neutral-500 hover:text-neutral-300 border border-transparent"
                }`}
              >
                {limit}
              </button>
            ))}
          </div>

          {/* Removed Items Counter */}
          {removedIds.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>{removedIds.length} cafe(s) removed</span>
              <span>•</span>
              <button
                onClick={handleResetPool}
                className="text-white underline hover:text-neutral-300 cursor-pointer transition-colors"
              >
                Reset pool
              </button>
            </div>
          )}
        </div>

        {/* Wheel Area */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute -top-3 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-white drop-shadow-md" />

          <div className="p-2 rounded-full bg-neutral-950 border border-neutral-800 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="rounded-full block"
            />
          </div>

          <button
            onClick={spinWheel}
            disabled={isSpinning || activePool.length === 0}
            className="mt-6 px-8 py-3 bg-white text-black hover:bg-neutral-200 active:scale-95 font-semibold rounded-full shadow-sm transition-all text-xs sm:text-sm tracking-wider uppercase disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSpinning ? "Selecting..." : "Spin Wheel"}
          </button>
        </div>
      </div>

      {/* Result Modal with Post-Spin Sponsored Spotlight */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white p-1 text-sm cursor-pointer transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Winner Cafe Information */}
            <div className="flex items-center gap-3.5">
              <img
                src={activeModalItem.logo_url}
                alt={activeModalItem.name}
                className="w-14 h-14 rounded-xl object-cover border border-neutral-800 shrink-0"
              />
              <div className="flex-1 min-w-0 pr-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  Selected Destination
                </span>
                <h2 className="text-lg font-bold text-white truncate">
                  {activeModalItem.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-neutral-400">
                  <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                    {activeModalItem.branch_location}
                  </span>
                  <span className="capitalize text-neutral-500">
                    • {activeModalItem.category}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
              {activeModalItem.description}
            </p>

            {/* Main Cafe Action Buttons */}
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={activeModalItem.map}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium transition-colors"
              >
                <span>View on Google Maps ↗</span>
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRemoveCafe(activeModalItem.id)}
                  className="flex-1 py-2 rounded-lg border border-neutral-800 bg-red-500/90 hover:bg-red-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Remove & Respin
                </button>
                <button
                  onClick={() => {
                    setActiveModalItem(null);
                    spinWheel();
                  }}
                  className="flex-1 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors cursor-pointer"
                >
                  Spin Again
                </button>
              </div>
            </div>

            {/* Post-Spin Sponsored Alternative Spot */}
            {suggestedSponsor && (
              <div className="mt-5 pt-4 border-t border-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                    Also in {suggestedSponsor.branch_location}
                  </span>
                  <span className="text-[9px] font-mono tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    Partner Pick
                  </span>
                </div>

                <a
                  href={suggestedSponsor.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-900 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={suggestedSponsor.logo_url}
                      alt={suggestedSponsor.name}
                      className="w-9 h-9 rounded-lg object-cover border border-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-medium text-neutral-200 truncate group-hover:text-white">
                        {suggestedSponsor.name}
                      </h4>
                      <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                        {suggestedSponsor.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-neutral-500 group-hover:text-neutral-200 text-xs pl-2 font-mono shrink-0">
                    ↗
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}