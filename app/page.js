"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { CAFES } from "@/app/data/cafes";
import { SPONSORS } from "@/app/data/sponsors";

// Colorful wheel palette
const WHEEL_PALETTE = [
  "#8529CD", // Rakuten Purple
  "#06B6D4", // Electric Cyan
  "#F59E0B", // Vivid Amber
  "#EC4899", // Neon Pink
  "#10B981", // Emerald Green
  "#3B82F6", // Deep Sky Blue
  "#F97316", // Bright Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#E11D48", // Crimson Rose
];

export default function Home() {
  const canvasRef = useRef(null);

  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [removedIds, setRemovedIds] = useState([]);
  const [maxChoices, setMaxChoices] = useState("ALL");
  const [activePool, setActivePool] = useState([]);
  const [activeModalItem, setActiveModalItem] = useState(null); // Used for both cafe winner & clicked sponsor
  const [isSpinning, setIsSpinning] = useState(false);

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
      ctx.fillStyle = "#1e0b30";
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

      // Slice
      ctx.beginPath();
      ctx.fillStyle = WHEEL_PALETTE[i % WHEEL_PALETTE.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, segmentAngle, segmentAngle + arcSize);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Divider line
      ctx.strokeStyle = "#0d0414";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segmentAngle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;

      const displayName =
        cafe.name.length > 15 ? cafe.name.slice(0, 13) + "…" : cafe.name;
      ctx.fillText(displayName, radius - 20, 5);
      ctx.restore();
    });

    // Outer edge border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = "#0d0414";
    ctx.fill();
    ctx.strokeStyle = "#8529CD";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center Icon
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

        setActiveModalItem(activePool[winningIndex]);
        setIsSpinning(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleRemoveCafe = (cafeId) => {
    setRemovedIds((prev) => [...prev, cafeId]);
    setActiveModalItem(null);
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
    <main className="min-h-screen bg-[#0d0414] text-neutral-100 flex flex-col justify-between items-center p-4 sm:p-8 relative">
      {/* Top Main Section */}
      <div className="flex flex-col items-center w-full max-w-xl">
        {/* Header */}
        <header className="text-center max-w-md mb-4">
          <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-wider text-[#d8b4fe] uppercase bg-[#8529CD]/20 border border-[#8529CD]/40 rounded-full">
            Phnom Penh Cafe Picker
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Cafe Roulette
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Spin the wheel to discover where your next coffee stop will be.
          </p>
        </header>

        {/* Filter Controls */}
        <div className="flex flex-col items-center gap-3 mb-6 w-full">
          {/* Branch Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {branches.map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                disabled={isSpinning}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-150 cursor-pointer disabled:opacity-50 ${
                  selectedBranch === branch
                    ? "bg-[#8529CD] text-white font-semibold shadow-md shadow-[#8529CD]/40 border border-[#a24ce8]"
                    : "bg-[#180926] text-neutral-300 hover:bg-[#230d37] border border-[#3b1959]"
                }`}
              >
                {branch === "ALL" ? "All Locations" : branch}
              </button>
            ))}
          </div>

          {/* Max Choice Limits */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span>Max choices:</span>
            {["ALL", 2, 3, 4, 6].map((limit) => (
              <button
                key={limit}
                onClick={() => setMaxChoices(limit === "ALL" ? "ALL" : limit)}
                disabled={isSpinning}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  maxChoices === limit
                    ? "bg-[#8529CD] text-white"
                    : "bg-[#180926] text-neutral-400 hover:text-white border border-[#3b1959]"
                }`}
              >
                {limit}
              </button>
            ))}
          </div>

          {/* Removed Items Counter */}
          {removedIds.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>{removedIds.length} cafe(s) excluded</span>
              <button
                onClick={handleResetPool}
                className="text-[#c084fc] underline hover:text-[#d8b4fe] cursor-pointer"
              >
                Reset pool
              </button>
            </div>
          )}
        </div>

        {/* Wheel Area */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Top Pointer Indicator */}
          <div className="absolute -top-3.5 z-10 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-[#8529CD] drop-shadow-[0_4px_10px_rgba(133,41,205,0.7)]" />

          {/* Outer Wheel Container */}
          <div className="p-2 rounded-full bg-[#180926] border-4 border-[#30124d] shadow-[0_0_40px_rgba(133,41,205,0.3)]">
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="rounded-full shadow-inner block"
            />
          </div>

          {/* Spin Button */}
          <button
            onClick={spinWheel}
            disabled={isSpinning || activePool.length === 0}
            className="mt-5 px-8 py-3 bg-[#8529CD] hover:bg-[#993be0] active:scale-95 text-white font-bold rounded-full shadow-lg shadow-[#8529CD]/35 transition-all text-sm sm:text-base tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#a24ce8]"
          >
            {isSpinning ? "Selecting..." : "Spin the Wheel"}
          </button>
        </div>
      </div>

      {/* Sponsors Showcase Banner (Clickable to open modal) */}
      <section className="w-full max-w-4xl mt-12 pt-6 border-t border-[#29113e]">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#c084fc]">
            Featured Partners & Sponsors
          </span>
          <span className="text-[11px] text-neutral-500">
            Click partner for info
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SPONSORS.map((sponsor) => (
            <button
              key={sponsor.id}
              onClick={() => setActiveModalItem(sponsor)}
              disabled={isSpinning}
              className="flex items-center text-left gap-3 p-2.5 rounded-xl bg-[#160a24] hover:bg-[#200e33] border border-[#391559] hover:border-[#8529CD]/60 transition-all group cursor-pointer disabled:opacity-50"
            >
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="w-10 h-10 rounded-lg object-cover border border-[#481c6e] group-hover:border-[#8529CD] transition-colors"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#d8b4fe]">
                  {sponsor.name}
                </h4>
                <p className="text-[10px] text-neutral-400 truncate">
                  {sponsor.branch_location} • {sponsor.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Shared Centered Modal for Wheel Winner OR Clicked Sponsor */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#160a24] border border-[#8529CD]/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(133,41,205,0.4)] animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full text-lg cursor-pointer leading-none"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4">
              <img
                src={activeModalItem.logo_url}
                alt={activeModalItem.name}
                className="w-16 h-16 rounded-xl object-cover border border-[#481c6e] shadow-md"
              />
              <div className="flex-1 min-w-0 pr-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c084fc]">
                  {activeModalItem.category === "cafe" ? "🎉 Winner Picked!" : "⭐ Featured Partner"}
                </span>
                <h2 className="text-xl font-bold text-white truncate">
                  {activeModalItem.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-[#8529CD]/20 text-[#d8b4fe] border border-[#8529CD]/40">
                    {activeModalItem.branch_location}
                  </span>
                  <span className="text-xs text-neutral-400 capitalize">
                    • {activeModalItem.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-neutral-300 leading-relaxed">
              {activeModalItem.description}
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={activeModalItem.map}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#8529CD]/40 bg-[#2b1046] hover:bg-[#39155c] text-purple-100 text-sm font-semibold transition-colors"
              >
                <span>📍 View Location on Google Maps</span>
              </a>

              {/* Conditional bottom actions based on whether it's a cafe or sponsor */}
              {activeModalItem.category === "cafe" ? (
                <div className="flex gap-2.5">
                  <button
                    onClick={() => handleRemoveCafe(activeModalItem.id)}
                    className="flex-1 py-2 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    ✕ Remove from Pool
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalItem(null);
                      spinWheel();
                    }}
                    className="flex-1 py-2 rounded-xl border border-[#8529CD]/50 bg-[#8529CD] hover:bg-[#993be0] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    🎲 Spin Again
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="w-full py-2 rounded-xl border border-[#8529CD]/30 bg-[#1e0b30] hover:bg-[#280e42] text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}