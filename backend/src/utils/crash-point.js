export function generateCrashPoint() {
    // Algoritmo provably fair simplificado
    // En producción, usar hash criptográfico con seeds
    const rand = Math.random();

    if (rand < 0.05) return parseFloat((1.00 + Math.random() * 0.50).toFixed(2)); // 5% crash bajo
    if (rand < 0.30) return parseFloat((1.50 + Math.random() * 1.00).toFixed(2)); // 25% crash medio
    if (rand < 0.70) return parseFloat((2.00 + Math.random() * 3.00).toFixed(2)); // 40% crash normal
    return parseFloat((5.00 + Math.random() * 20.00).toFixed(2)); // 30% crash alto
}