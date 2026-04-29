export function tokensToCredits(tokens: number): number {
  return Math.floor(tokens / 1000);
}

export function formatCredits(credits: number): string {
  if (credits >= 1_000_000) return `${(credits / 1_000_000).toFixed(1)}M`;
  if (credits >= 1_000) return `${(credits / 1_000).toFixed(1)}k`;
  return credits.toString();
}
