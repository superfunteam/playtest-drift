function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedForRound(sessionSeed: string, roundId: string): string {
  return `${sessionSeed}:${roundId}`;
}

export function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const output = items.slice();
  const random = mulberry32(hashSeed(seed));

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const temp = output[index];
    output[index] = output[swapIndex];
    output[swapIndex] = temp;
  }

  return output;
}

export function makeSessionSeed(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `seed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
