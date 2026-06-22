const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*-_";

function pick(chars: string, random: () => number): string {
  return chars[Math.floor(random() * chars.length)]!;
}

function shuffle(values: string[], random: () => number): string[] {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Cryptographically strong temporary password for new team members. */
export function generateSecurePassword(length = 16): string {
  const random =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? () => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32
      : () => Math.random();

  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const chars = [
    pick(UPPER, random),
    pick(LOWER, random),
    pick(DIGITS, random),
    pick(SYMBOLS, random),
  ];
  while (chars.length < length) chars.push(pick(all, random));
  return shuffle(chars, random).join("");
}
