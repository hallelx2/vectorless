import { cn } from "@/lib/utils";

interface VectorlessIconProps {
  size?: number;
  className?: string;
}

/**
 * Vectorless brand icon — a stylized "V" formed by document structure lines
 * converging into a focal point, representing structure-preserving retrieval.
 */
export function VectorlessIcon({ size = 32, className }: VectorlessIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {/* Background circle */}
      <rect width="32" height="32" rx="8" fill="#1456f0" />

      {/* Structural lines (document sections) converging to a point */}
      {/* Left section lines */}
      <line x1="7" y1="8" x2="16" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="7" x2="16" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Right section lines */}
      <line x1="25" y1="8" x2="16" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22" y1="7" x2="16" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Focal point — the retrieval target */}
      <circle cx="16" cy="24" r="2" fill="#ea5ec1" />
    </svg>
  );
}

/**
 * Small dot icon used in the sidebar and nav — brand pink circle.
 */
export function VectorlessDot({ size = 16, className }: VectorlessIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <circle cx="8" cy="8" r="8" fill="#ea5ec1" />
      <path
        d="M4.5 5L8 11.5L11.5 5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default VectorlessIcon;
