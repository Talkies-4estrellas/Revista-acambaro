import type { Tono } from "@/lib/ediciones";

const tones: Record<Tono, { bg: string; fg: string; accent: string }> = {
  terracota: { bg: "#068562", fg: "#f1f5f9", accent: "#49c59f" },
  ocre: { bg: "#49c59f", fg: "#1e293b", accent: "#068562" },
  oliva: { bg: "#046a4b", fg: "#f1f5f9", accent: "#e2e8f0" },
  indigo: { bg: "#013f4a", fg: "#f1f5f9", accent: "#49c59f" },
  tinta: { bg: "#1e293b", fg: "#f1f5f9", accent: "#068562" },
};

/** Ilustración geométrica provisional hasta tener fotografías reales. */
export default function Placeholder({
  tone,
  label,
  className = "",
  showLabel = true,
}: {
  tone: Tono;
  label: string;
  className?: string;
  showLabel?: boolean;
}) {
  const t = tones[tone];
  return (
    <div
      role="img"
      aria-label={`Imagen provisional: ${label}`}
      className={`relative overflow-hidden ${className}`}
      style={{ background: t.bg, color: t.fg }}
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <circle cx="300" cy="90" r="64" fill={t.accent} opacity="0.9" />
        <path d="M0 300 L0 210 Q100 140 200 200 T400 170 L400 300 Z" fill={t.fg} opacity="0.14" />
        <path d="M0 300 L0 250 Q120 200 220 245 T400 225 L400 300 Z" fill={t.fg} opacity="0.22" />
        <g stroke={t.fg} strokeOpacity="0.25" strokeWidth="1">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={i * 50} y1="0" x2={i * 50 - 80} y2="300" />
          ))}
        </g>
      </svg>
      {showLabel && (
        <span className="kicker absolute bottom-3 left-3 max-w-[90%] opacity-80">{label}</span>
      )}
    </div>
  );
}
