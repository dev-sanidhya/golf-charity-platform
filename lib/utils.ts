import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

// Draw engine: random or algorithmic weighted
export function runDraw(
  scores: number[],
  mode: 'random' | 'algorithmic' = 'random'
): number[] {
  if (mode === 'random') {
    // Pick 5 unique numbers between 1-45
    const nums = new Set<number>()
    while (nums.size < 5) {
      nums.add(Math.floor(Math.random() * 45) + 1)
    }
    return Array.from(nums).sort((a, b) => a - b)
  }

  // Algorithmic: weighted by most frequent scores submitted
  // Scores array should be all user scores; bias toward common numbers
  const freq: Record<number, number> = {}
  for (const s of scores) {
    freq[s] = (freq[s] || 0) + 1
  }

  // Build weighted pool
  const pool: number[] = []
  for (let i = 1; i <= 45; i++) {
    const weight = freq[i] ? freq[i] * 3 : 1
    for (let w = 0; w < weight; w++) pool.push(i)
  }

  const picked = new Set<number>()
  while (picked.size < 5) {
    picked.add(pool[Math.floor(Math.random() * pool.length)])
  }
  return Array.from(picked).sort((a, b) => a - b)
}

// Count how many of a user's 5 scores match the draw numbers
export function countMatches(userScores: number[], drawNumbers: number[]): number {
  const drawSet = new Set(drawNumbers)
  return userScores.filter((s) => drawSet.has(s)).length
}

// Calculate prize pool amounts from subscriber count
export function calculatePrizePools(activeSubscribers: number, monthlyPrice: number) {
  const totalPool = activeSubscribers * monthlyPrice * 0.3 // 30% to prize pool
  return {
    jackpot: totalPool * 0.4,
    fourMatch: totalPool * 0.35,
    threeMatch: totalPool * 0.25,
    total: totalPool,
  }
}
