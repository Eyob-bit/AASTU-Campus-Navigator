import { cn } from "@/utils/cn";

interface NeonChevronArrowProps {
  className?: string;
  rotation?: number;
  size?: "sm" | "md" | "lg" | "xl";
}

export function NeonChevronArrow({
  className,
  rotation = 0,
  size = "md",
}: NeonChevronArrowProps) {
  const sizeMap = {
    sm: "w-12 h-6",
    md: "w-20 h-10",
    lg: "w-28 h-14",
    xl: "w-36 h-18",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center transition-transform duration-300 pointer-events-auto filter drop-shadow-[0_0_12px_rgba(0,240,255,0.95)] drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] hover:scale-125 cursor-pointer",
        sizeMap[size],
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <svg
        viewBox="0 0 54 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-pulse"
      >
        <path
          d="M6 4 L16 13 L6 22"
          stroke="#00f0ff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
        />
        <path
          d="M18 4 L28 13 L18 22"
          stroke="#00f0ff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
        <path
          d="M30 4 L40 13 L30 22"
          stroke="#00f0ff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <path
          d="M42 4 L52 13 L42 22"
          stroke="#00f0ff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="1.0"
        />
      </svg>
    </div>
  );
}

/**
 * Returns HTML string for Marzipano 3D hotspots (Enlarged Neon Chevron)
 */
export function getNeonChevronArrowHtml(rotation = 0): string {
  return `
    <div class="inline-flex items-center justify-center transition-transform duration-300 hover:scale-125 pointer-events-auto cursor-pointer" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 12px #00f0ff) drop-shadow(0 0 4px #ffffff);">
      <svg width="76" height="38" viewBox="0 0 54 26" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
        <path d="M6 4 L16 13 L6 22" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />
        <path d="M18 4 L28 13 L18 22" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
        <path d="M30 4 L40 13 L30 22" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95" />
        <path d="M42 4 L52 13 L42 22" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="1.0" />
      </svg>
    </div>
  `;
}
