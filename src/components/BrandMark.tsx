// Camper Retreat sun-spiral mark (logo variant A, 2026-11). Uses currentColor.
const SPIRAL = "M58 60a4 4 0 0 1 8 0a8 8 0 0 1-16 0a12 12 0 0 1 24 0a16 16 0 0 1-32 0a20 20 0 0 1 40 0";
const RAYS =
  "M90 60h8M86.3 74l6.9 4M76 84.3l4 6.9M62 88v8M48 84.3l-4 6.9M37.7 74l-6.9 4M34 60h-8M37.7 46l-6.9-4M48 35.7l-4-6.9M62 32v-8M76 35.7l4-6.9M86.3 46l6.9-4";

export function BrandMark({ className, strokeWidth = 6 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="22 20 80 80" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d={SPIRAL} />
      <path d={RAYS} />
    </svg>
  );
}
