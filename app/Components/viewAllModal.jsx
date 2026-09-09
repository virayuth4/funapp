"use client";

import Image from "next/image";

export default function ViewAllModal({
  isOpen,
  onClose,
  cafes,
  accentMap,
  defaultAccent,
  selectedBranch,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <style jsx global>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 6px 0px var(--glow-color), 0 0 0px 0px var(--glow-color);
          }
          50% {
            box-shadow: 0 0 22px 5px var(--glow-color), 0 0 10px 2px var(--glow-color);
          }
        }
        .staff-favorite-glow {
          animation: pulseGlow 1.8s ease-in-out infinite;
        }
      `}</style>

      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-900 shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              In the Roll
            </h2>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {cafes.length} cafe{cafes.length !== 1 ? "s" : ""}
              {selectedBranch !== "ALL" ? ` in ${selectedBranch}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-sm cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cafes.map((cafe) => {
            const accent = accentMap[cafe.accent] || defaultAccent;
            const isStaffFav = accent.name === "Staff Favorite";
            return (
              <div
                key={cafe.id}
                style={isStaffFav ? { "--glow-color": accent.color } : undefined}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 border-b-2 ${accent.border} ${
                  isStaffFav ? "staff-favorite-glow" : ""
                }`}
              >
                <Image
                  src={cafe.logo_url}
                  alt={cafe.name}
                  width={64}
                  height={64}
                  className="w-10 h-10 rounded-lg object-cover border border-neutral-700/60"
                />
                <h4 className="text-[11px] font-semibold text-neutral-200 text-center truncate w-full">
                  {cafe.name}
                </h4>
                <span className="text-[9px] font-mono text-neutral-500 uppercase">
                  {cafe.branch_location}
                </span>
              </div>
            );
          })}

          {cafes.length === 0 && (
            <p className="col-span-full text-center text-xs text-neutral-500 py-6">
              No cafes available in this filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}