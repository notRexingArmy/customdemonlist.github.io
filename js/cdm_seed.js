// --- SEEDED RNG UTILITY ---
// Linear Congruential Generator
// Allows deterministic random number generation based on a seed.

class SeededRandom {
    constructor(seed) {
        // Ensure seed is within integer range and positive
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    // Generate next integer
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed;
    }

    // Generate float between 0 and 1
    nextFloat() {
        return (this.next() - 1) / 2147483646;
    }
}

// Make globally available
window.SeededRandom = SeededRandom;