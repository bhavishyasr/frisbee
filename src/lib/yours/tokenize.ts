// Lowercase, strip punctuation (keep apostrophes collapsed), split on whitespace.
// Intentionally NO stopword removal — "actually", "literally", "bro", "still"
// are signal in teen voice.
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/['']/g, "") // collapse contractions: didn't -> didnt
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
