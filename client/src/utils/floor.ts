/**
 * Converts a floor number into a human-readable label.
 *   0  → "Ground Floor"
 *   1  → "1st Floor"
 *   2  → "2nd Floor"
 *   11 → "11th Floor"   (handles 11/12/13 edge cases)
 */
export function formatFloorLabel(n: number): string {
  if (n === 0) return "Ground Floor";
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th Floor`;
  switch (n % 10) {
    case 1:  return `${n}st Floor`;
    case 2:  return `${n}nd Floor`;
    case 3:  return `${n}rd Floor`;
    default: return `${n}th Floor`;
  }
}
