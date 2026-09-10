"use client";

import { useRef, useState } from "react";

// ---- Brand palette (from the Happy Potato logo) -----------------------
const BRAND = {
  yellow: "#F7A81E",
  red: "#E0342A",
  navy: "#1C2B4A",
  cream: "#FDEDC7",
};

function IconDiscount({ size = 40 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size}>
      <circle cx="24" cy="24" r="18" fill={BRAND.red} stroke={BRAND.navy} strokeWidth="2" />
      <circle cx="18" cy="18" r="4" fill={BRAND.cream} />
      <circle cx="30" cy="30" r="4" fill={BRAND.cream} />
      <line x1="17" y1="31" x2="31" y2="17" stroke={BRAND.cream} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---- Static prize data -----------------------------------------------
// Every prize except the discount uses a real photo (image field).
// The discount prize falls back to the flat icon above (no natural photo
// for "20% off" as a physical item).
const PRIZES = [
  {
    id: "fries",
    label: "Baby Fries",
    color: BRAND.yellow,
    textColor: BRAND.navy,
    image: "/logos/happy-potato/baby-fries.jpg",
  },
  {
    id: "drink",
    label: "Coca Drink",
    color: BRAND.navy,
    textColor: BRAND.yellow,
    image:
      "/logos/happy-potato/coca-cola.png",
  },
  {
    id: "chicken",
    label: "Buy 1 Regular Fries Get 1 Regular Fries Voucher",
    color: BRAND.red,
    textColor: BRAND.cream,
    image: "/logos/happy-potato/regular-fries.jpg",
  },
 
  {
    id: "ticket",
    label: "Buy 1 Chicken Nugget Get 1 Chicken Nugget",
    color: BRAND.navy,
    textColor: BRAND.yellow,
    image: "/logos/happy-potato/jumbo-nugget.jpg",
  },
  { id: "discount", 
    label: "20% Discount", 
    color: BRAND.red, 
    textColor: BRAND.cream ,
    image: "/logos/happy-potato/save  .jpg",
  },
];

const SIZE = 320; // svg viewbox size
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 10;
const SEGMENT_ANGLE = 360 / PRIZES.length;
const SPIN_DURATION_MS = 4200;
const EXTRA_FULL_SPINS = 6;

// ---- Geometry helpers ---------------------------------------------------
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(startAngle, endAngle) {
  const start = polarToCartesian(CENTER, CENTER, RADIUS, endAngle);
  const end = polarToCartesian(CENTER, CENTER, RADIUS, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

// Greedily wrap a label onto multiple short lines (max 3) so it stays
// inside a slice instead of overflowing past its edges.
const MAX_CHARS_PER_LINE = 9;
const MAX_LINES = 3;

function wrapLabel(label) {
  const words = label.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > MAX_CHARS_PER_LINE && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length > MAX_LINES) {
    const capped = lines.slice(0, MAX_LINES);
    capped[MAX_LINES - 1] = `${capped[MAX_LINES - 1]}…`;
    return capped;
  }
  return lines;
}

export default function SpinWheel() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rotationRef = useRef(0);

  function handleSpin() {
    if (isSpinning) return;

    setWinner(null);
    setShowModal(false);
    setIsSpinning(true);

    const winningIndex = Math.floor(Math.random() * PRIZES.length);

    const jitter = (Math.random() - 0.5) * SEGMENT_ANGLE * 0.6;
    const targetCenterAngle =
      winningIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 + jitter;

    const neededRotation = (360 - targetCenterAngle) % 360;

    const currentRotation = rotationRef.current;
    const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
    const delta = ((neededRotation - normalizedCurrent) % 360 + 360) % 360;

    const finalRotation = currentRotation + EXTRA_FULL_SPINS * 360 + delta;

    rotationRef.current = finalRotation;
    setRotation(finalRotation);

    window.setTimeout(() => {
      setIsSpinning(false);
      setWinner(PRIZES[winningIndex]);
      setShowModal(true);
    }, SPIN_DURATION_MS);
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16"
      style={{ backgroundColor: BRAND.cream }}
    >
      {/* Logo + typography header */}
      <div className="flex flex-col items-center gap-1">
        <img
          src="/logos/happy-potato-logo.png"
          alt="Happy Potato"
          className="h-24 w-auto"
        />
        {/* <h1
          className="text-5xl italic tracking-tight sm:text-6xl"
          style={{
            color: BRAND.red,
            fontWeight: 800,
            WebkitTextStroke: `1.5px ${BRAND.navy}`,
          }}
        >
          Happy Potato
        </h1>
        <p
          className="text-sm font-bold uppercase tracking-[0.3em]"
          style={{ color: BRAND.navy }}
        >
          Happy Together
        </p> */}
        <p
          className="mt-2 text-sm font-bold uppercase tracking-widest"
          style={{ color: BRAND.red }}
        >
          Spin &amp; Win
        </p>
      </div>

      {/* Wheel */}
      <div className="relative" style={{ width: SIZE + 24, height: SIZE + 24 }}>
        {/* Outer badge ring, echoing the logo's pill border */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `6px solid ${BRAND.red}`,
            boxShadow: `0 0 0 3px ${BRAND.navy} inset`,
          }}
        />

        {/* Pointer — apex points straight down into the wheel */}
        <div
          className="absolute left-1/2 top-[-6px] z-10 h-7 w-7 -translate-x-1/2"
          style={{
            clipPath: "polygon(50% 100%, 0 0, 100% 0)",
            background: BRAND.red,
            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))",
          }}
        />

        <div className="absolute inset-3">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="h-full w-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                : "none",
            }}
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS + 4}
              fill={BRAND.cream}
              stroke={BRAND.navy}
              strokeWidth={4}
            />
            {PRIZES.map((prize, i) => {
              const startAngle = i * SEGMENT_ANGLE;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const midAngle = startAngle + SEGMENT_ANGLE / 2;
              const textPos = polarToCartesian(
                CENTER,
                CENTER,
                RADIUS * 0.62,
                midAngle
              );

              return (
                <g key={prize.label}>
                  <path
                    d={describeSlice(startAngle, endAngle)}
                    fill={prize.color}
                    stroke={BRAND.navy}
                    strokeWidth={2}
                  />
                  {(() => {
                    const lines = wrapLabel(prize.label);
                    const fontSize = lines.length >= 3 ? 9.5 : 11;
                    const lineHeight = lines.length >= 3 ? 10.5 : 12;
                    // Shift the block up so it stays vertically centered
                    // on textPos as the number of lines grows.
                    const startDy = -((lines.length - 1) * lineHeight) / 2;
                    return (
                      <text
                        x={textPos.x}
                        y={textPos.y}
                        transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="select-none"
                        fill={prize.textColor}
                        fontSize={fontSize}
                        fontWeight={800}
                      >
                        {lines.map((line, idx) => (
                          <tspan
                            key={idx}
                            x={textPos.x}
                            dy={idx === 0 ? startDy : lineHeight}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    );
                  })()}
                </g>
              );
            })}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={24}
              fill={BRAND.red}
              stroke={BRAND.yellow}
              strokeWidth={4}
            />
          </svg>
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning}
        className="rounded-full px-10 py-3 text-lg font-extrabold uppercase tracking-wide text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: BRAND.red,
          border: `3px solid ${BRAND.navy}`,
        }}
      >
        {isSpinning ? "Spinning..." : "Spin"}
      </button>

      {/* Result modal */}
      {showModal && winner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl px-8 py-10 text-center shadow-2xl"
            style={{
              backgroundColor: BRAND.yellow,
              border: `4px solid ${BRAND.red}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-xl font-bold leading-none"
              style={{ color: BRAND.navy }}
              aria-label="Close"
            >
              ×
            </button>

            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: BRAND.navy }}
            >
              Congratulations!
            </p>

            <div
              className="mx-auto mt-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full"
              style={{ backgroundColor: BRAND.cream, border: `3px solid ${BRAND.navy}` }}
            >
              {winner.image ? (
                <img
                  src={winner.image}
                  alt={winner.label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <IconDiscount size={44} />
              )}
            </div>

            <p
              className="mt-3 text-3xl font-extrabold italic"
              style={{ color: BRAND.red }}
            >
              {winner.label}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: BRAND.navy }}>
              You just won this prize. Happy Together!
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 rounded-full px-8 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition hover:brightness-110"
              style={{ backgroundColor: BRAND.red, border: `2px solid ${BRAND.navy}` }}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}