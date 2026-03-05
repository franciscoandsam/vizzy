/**
 * Chart generation utilities for portfolio sparklines.
 *
 * Generates deterministic price histories from existing holding data
 * (price, roi24m) using a seeded random walk — no API calls needed.
 */

import type { Holding } from './portfolio';

// ── Types ──

export type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'All';

type ViewBox = { width: number; height: number };

export type ChartPaths = {
  linePath: string;
  fillPath: string;
};

// ── Seeded PRNG ──

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashTicker(ticker: string): number {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = (hash * 31 + ticker.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ── Volatility Classification ──

function getVolatility(roi24m: number): number {
  const absRoi = Math.abs(roi24m);
  if (absRoi > 80) return 0.035;   // crypto-level volatility
  if (absRoi > 40) return 0.025;   // growth stocks
  if (absRoi > 15) return 0.015;   // index funds / moderate
  if (absRoi > 2) return 0.008;    // savings / bonds
  return 0.002;                     // cash-like, near-flat
}

// ── Price History Generation ──

/**
 * Generate a realistic price history using geometric Brownian motion.
 * The walk starts at the implied historical price and ends exactly at currentPrice.
 */
export function generatePriceHistory(
  ticker: string,
  currentPrice: number,
  roi24m: number,
  numPoints = 730,
): number[] {
  if (currentPrice <= 0) return Array(numPoints).fill(0);

  const rand = mulberry32(hashTicker(ticker));
  const volatility = getVolatility(roi24m);
  const startPrice = currentPrice / (1 + roi24m / 100);

  // Drift per step to reach current price over numPoints steps
  const totalDrift = Math.log(currentPrice / startPrice);
  const driftPerStep = totalDrift / numPoints;

  const prices: number[] = [startPrice];

  for (let i = 1; i < numPoints; i++) {
    // Box-Muller transform for normal distribution
    const u1 = rand();
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);

    const prev = prices[i - 1];
    const shock = volatility * z;
    const next = prev * Math.exp(driftPerStep + shock);
    prices.push(Math.max(next, startPrice * 0.01)); // floor at 1% of start
  }

  // Smooth correction over last 30 points so final price = exactly currentPrice
  const correctionWindow = Math.min(30, Math.floor(numPoints * 0.1));
  const rawEnd = prices[numPoints - 1];
  const correction = currentPrice - rawEnd;

  for (let i = 0; i < correctionWindow; i++) {
    const t = (i + 1) / correctionWindow; // 0→1 easing
    const idx = numPoints - correctionWindow + i;
    prices[idx] += correction * (t * t); // quadratic ease-in
  }

  // Force exact final price
  prices[numPoints - 1] = currentPrice;

  return prices;
}

// ── Period Filtering ──

const PERIOD_DAYS: Record<TimePeriod, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'All': 730,
};

export function filterByPeriod(prices: number[], period: TimePeriod): number[] {
  const days = PERIOD_DAYS[period];
  if (days >= prices.length) return prices;
  return prices.slice(prices.length - days);
}

// ── Downsampling ──

export function downsample(prices: number[], targetPoints: number): number[] {
  if (prices.length <= targetPoints) return prices;

  const result: number[] = [];
  const step = (prices.length - 1) / (targetPoints - 1);

  for (let i = 0; i < targetPoints; i++) {
    const idx = Math.round(i * step);
    result.push(prices[idx]);
  }

  return result;
}

// ── SVG Path Generation ──

/**
 * Convert price array to a smooth SVG path using Catmull-Rom spline interpolation.
 */
export function pricesToSvgPath(
  prices: number[],
  viewBox: ViewBox = { width: 100, height: 40 },
): string {
  if (prices.length < 2) return '';

  const { width, height } = viewBox;
  const padding = 2; // vertical padding so strokes don't clip
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((p, i) => ({
    x: (i / (prices.length - 1)) * width,
    y: padding + (1 - (p - min) / range) * (height - padding * 2),
  }));

  // Catmull-Rom to cubic bezier segments
  const tension = 0.3;
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

/**
 * Same as pricesToSvgPath but closed at the bottom for gradient fill.
 */
export function pricesToFilledPath(
  prices: number[],
  viewBox: ViewBox = { width: 100, height: 40 },
): string {
  const linePath = pricesToSvgPath(prices, viewBox);
  if (!linePath) return '';
  return `${linePath} V ${viewBox.height} H 0 Z`;
}

// ── Convenience: single-holding chart data ──

export function getHoldingChart(
  holding: Holding,
  period: TimePeriod = 'All',
  samplePoints = 40,
): ChartPaths {
  const history = generatePriceHistory(
    holding.ticker,
    holding.price,
    holding.roi24m,
  );
  const filtered = filterByPeriod(history, period);
  const sampled = downsample(filtered, samplePoints);

  return {
    linePath: pricesToSvgPath(sampled),
    fillPath: pricesToFilledPath(sampled),
  };
}

// ── Category-level aggregate chart ──

/**
 * Generate an aggregate price history for a category by:
 * 1. Generating per-holding price histories
 * 2. Multiplying each day's price by the holding's shares
 * 3. Summing all holdings day-by-day
 */
export function aggregateCategoryHistory(
  holdings: Holding[],
  period: TimePeriod = 'All',
  samplePoints = 80,
): ChartPaths {
  if (holdings.length === 0) {
    return { linePath: '', fillPath: '' };
  }

  const numPoints = 730;

  // Generate value histories (price * shares) for each holding
  const valueHistories = holdings.map((h) => {
    const prices = generatePriceHistory(h.ticker, h.price, h.roi24m, numPoints);
    return prices.map((p) => p * h.shares);
  });

  // Sum day-by-day
  const aggregate: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    let sum = 0;
    for (const values of valueHistories) {
      sum += values[i];
    }
    aggregate.push(sum);
  }

  const filtered = filterByPeriod(aggregate, period);
  const sampled = downsample(filtered, samplePoints);

  return {
    linePath: pricesToSvgPath(sampled),
    fillPath: pricesToFilledPath(sampled),
  };
}
