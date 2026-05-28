interface PlayerPanelProps {
  name: string;
  position: number;
  color: string;
  isActive: boolean;
  isComputer?: boolean;
}

export default function PlayerPanel({ name, position, color, isActive, isComputer }: PlayerPanelProps) {
  const initials = name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="rounded-2xl p-3 transition-all duration-300 flex items-center gap-3"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${color}22, ${color}11)`
          : "rgba(255,255,255,0.05)",
        border: `2px solid ${isActive ? color : "rgba(255,255,255,0.1)"}`,
        boxShadow: isActive ? `0 0 18px ${color}44` : "none",
      }}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-sm shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          boxShadow: isActive ? `0 0 12px ${color}88` : `0 2px 8px rgba(0,0,0,0.4)`,
        }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-sm truncate">{name}</span>
          {isComputer && (
            <span className="text-[10px] bg-white/10 text-white/60 rounded px-1 py-0.5 flex-shrink-0">CPU</span>
          )}
        </div>
        <div className="text-xs text-white/50 mt-0.5">
          {position === 0 ? "At start" : `Square ${position}`}
        </div>
      </div>

      {isActive && (
        <div className="flex-shrink-0 text-xs font-bold text-white/80 animate-pulse">
          ●
        </div>
      )}
    </div>
  );
}
