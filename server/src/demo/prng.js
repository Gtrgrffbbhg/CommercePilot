// Deterministic Mulberry32 Pseudo-Random Number Generator (PRNG)
// Guarantees identical output across runs given the same integer seed

export function createPrng(seed = 42) {
  let s = (Math.floor(seed) || 1) >>> 0;

  function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    // Return float between min (inclusive) and max (exclusive)
    float(min = 0, max = 1) {
      return min + next() * (max - min);
    },
    // Return integer between min and max (inclusive)
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    // Return a random element from an array
    pick(array) {
      if (!array || array.length === 0) return null;
      return array[Math.floor(next() * array.length)];
    },
    // Return weighted choice from an array of [item, weight] pairs
    weightedPick(itemsWithWeights) {
      const totalWeight = itemsWithWeights.reduce((sum, [, w]) => sum + w, 0);
      let threshold = next() * totalWeight;
      for (const [item, weight] of itemsWithWeights) {
        threshold -= weight;
        if (threshold <= 0) return item;
      }
      return itemsWithWeights[itemsWithWeights.length - 1][0];
    },
    // Boolean with given probability of being true (0.0 to 1.0)
    chance(probability) {
      return next() < probability;
    },
  };
}
