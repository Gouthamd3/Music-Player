export function fmtTime(ms: number): string {
  if (!isFinite(ms) || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function pickCover(seed: string): string {
  // Deterministic art using picsum
  const id = Math.abs(hash(seed)) % 1000;
  return `https://picsum.photos/seed/wave-${id}/600/600`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
