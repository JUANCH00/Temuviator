export function generateCrashPoint() {
    const rand = Math.random();

    if (rand < 0.05) return parseFloat((1.00 + Math.random() * 0.50).toFixed(2));
    if (rand < 0.30) return parseFloat((1.50 + Math.random() * 1.00).toFixed(2));
    if (rand < 0.70) return parseFloat((2.00 + Math.random() * 3.00).toFixed(2));
    return parseFloat((5.00 + Math.random() * 20.00).toFixed(2));
}