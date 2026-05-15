// Apostrophe-preserving tokenizer.
// Mirrors collect.py: lowercase, keep apostrophes INSIDE words ("didn't", "let's"),
// strip surrounding punctuation, split on whitespace.
//
// Why: contractions are signal. "didn't" lives in `excuse`, "let's" lives in `energy`.
// Collapsing them ("didnt") loses the apostrophe variant of the same human voice.

const WORD_RE = /[a-z0-9][a-z0-9']*[a-z0-9]|[a-z0-9]/g;

export function tokenize(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase().replace(/[''']/g, "'");
  return lower.match(WORD_RE) ?? [];
}
