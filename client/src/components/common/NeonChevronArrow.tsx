import { cn } from "@/utils/cn";

export type ArrowVariant = "highlighted" | "dimmed" | "normal";

interface NeonChevronArrowProps {
  className?: string;
  rotation?: number;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: ArrowVariant;
  showBadge?: boolean;
}

export function NeonChevronArrow({
  className,
  rotation = 0,
  size = "md",
  variant = "normal",
  showBadge = true,
}: NeonChevronArrowProps) {
  const sizeMap = {
    sm: "w-12 h-6",
    md: "w-20 h-10",
    lg: "w-28 h-14",
    xl: "w-36 h-18",
  };

  const isHighlighted = variant === "highlighted";
  const isDimmed = variant === "dimmed";

  return (
    <div className="inline-flex flex-col items-center justify-center pointer-events-auto select-none">
      <div
        className={cn(
          "inline-flex items-center justify-center transition-all duration-300 pointer-events-auto cursor-pointer",
          sizeMap[size],
          isHighlighted &&
            "filter drop-shadow-[0_0_16px_rgba(0,240,255,1)] drop-shadow-[0_0_32px_rgba(0,240,255,0.85)] drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] hover:scale-130 scale-110",
          isDimmed &&
            "opacity-35 hover:opacity-80 filter drop-shadow-[0_0_3px_rgba(100,116,139,0.4)] hover:scale-110 grayscale-[30%]",
          !isHighlighted &&
            !isDimmed &&
            "filter drop-shadow-[0_0_12px_rgba(0,240,255,0.95)] drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] hover:scale-125",
          className
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg
          viewBox="0 0 54 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("w-full h-full", isHighlighted ? "animate-pulse" : isDimmed ? "" : "animate-pulse")}
        >
          <path
            d="M6 4 L16 13 L6 22"
            stroke={isDimmed ? "#94a3b8" : "#00f0ff"}
            strokeWidth={isHighlighted ? "5" : "4.5"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isHighlighted ? "0.6" : isDimmed ? "0.3" : "0.45"}
          />
          <path
            d="M18 4 L28 13 L18 22"
            stroke={isDimmed ? "#94a3b8" : "#00f0ff"}
            strokeWidth={isHighlighted ? "5" : "4.5"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isHighlighted ? "0.85" : isDimmed ? "0.5" : "0.75"}
          />
          <path
            d="M30 4 L40 13 L30 22"
            stroke={isDimmed ? "#94a3b8" : "#00f0ff"}
            strokeWidth={isHighlighted ? "5" : "4.5"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isHighlighted ? "1.0" : isDimmed ? "0.7" : "0.95"}
          />
          <path
            d="M42 4 L52 13 L42 22"
            stroke={isHighlighted ? "#ffffff" : isDimmed ? "#94a3b8" : "#00f0ff"}
            strokeWidth={isHighlighted ? "5.5" : "4.5"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="1.0"
          />
        </svg>
      </div>

      {isHighlighted && showBadge && (
        <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/90 text-white font-extrabold text-[9px] tracking-wider uppercase shadow-[0_0_14px_rgba(0,240,255,0.9)] backdrop-blur-md animate-bounce">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>Follow Path</span>
        </div>
      )}
    </div>
  );
}

/**
 * Returns HTML string for Marzipano 3D equirectangular hotspots.
 */
export function getNeonChevronArrowHtml(
  rotation = 0,
  variant: ArrowVariant = "normal"
): string {
  if (variant === "highlighted") {
    return `
      <div class="inline-flex flex-col items-center justify-center transition-transform duration-300 hover:scale-130 scale-110 pointer-events-auto cursor-pointer select-none">
        <div style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 16px #00f0ff) drop-shadow(0 0 32px rgba(0,240,255,0.95)) drop-shadow(0 0 6px #ffffff);">
          <svg width="84" height="42" viewBox="0 0 54 26" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
            <path d="M6 4 L16 13 L6 22" stroke="#00f0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
            <path d="M18 4 L28 13 L18 22" stroke="#00f0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
            <path d="M30 4 L40 13 L30 22" stroke="#00f0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="1.0" />
            <path d="M42 4 L52 13 L42 22" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" opacity="1.0" />
          </svg>
        </div>
        <div style="margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; background: rgba(6, 182, 212, 0.95); color: #ffffff; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 0 16px rgba(0, 240, 255, 0.9); animation: bounce 1s infinite;">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></span>
          <span>Target Path</span>
        </div>
      </div>
    `;
  }

  if (variant === "dimmed") {
    return `
      <div class="inline-flex items-center justify-center transition-all duration-300 hover:opacity-90 hover:scale-110 pointer-events-auto cursor-pointer opacity-35 select-none" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 2px rgba(100, 116, 139, 0.5));">
        <svg width="68" height="34" viewBox="0 0 54 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 4 L16 13 L6 22" stroke="#94a3b8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3" />
          <path d="M18 4 L28 13 L18 22" stroke="#94a3b8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" />
          <path d="M30 4 L40 13 L30 22" stroke="#94a3b8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" />
          <path d="M42 4 L52 13 L42 22" stroke="#94a3b8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
        </svg>
      </div>
    `;
  }

  // Normal default (when no route/destination is active)
  return `
    <div class="inline-flex items-center justify-center transition-transform duration-300 hover:scale-125 pointer-events-auto cursor-pointer select-none" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 12px #00f0ff) drop-shadow(0 0 4px #ffffff);">
      <svg width="76" height="38" viewBox="0 0 54 26" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
        <path d="M6 4 L16 13 L6 22" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />
        <path d="M18 4 L28 13 L18 22" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
        <path d="M30 4 L40 13 L30 22" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95" />
        <path d="M42 4 L52 13 L42 22" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="1.0" />
      </svg>
    </div>
  `;
}

