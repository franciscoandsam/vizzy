/**
 * Portfolio Service
 *
 * Persistent portfolio data backed by AsyncStorage.
 * Seeds with demo holdings on first launch, then persists all changes.
 */

import { loadHoldings, saveHoldings, isInitialized } from './storage';

export type Holding = {
  id: string;
  name: string;
  ticker: string;
  category: string;
  emoji: string;
  iconColor: string;
  color: string;
  shares: number;
  price: number;
  totalValue: number;
  costBasis: number;
  changePercent: number;
  vizzyComment: string;
  platform: string;
  platformUrl: string;
  roi24m: number;
  logoUrl?: string;
};

export type Portfolio = {
  userId: string;
  holdings: Holding[];
  lastUpdated: string;
};

export type AssetCategory = {
  id: string;
  name: string;
  emoji: string;
  gradientColors: [string, string];
  totalValue: number;
  changePercent: number;
  holdingCount: number;
  holdings: Holding[];
};

// ── FMP Live Price Sync ──

const FMP_SYMBOLS: Record<string, string> = {
  AAPL: 'AAPL',
  NVDA: 'NVDA',
  VOO: 'VOO',
  TSLA: 'TSLA',
  BTC: 'BTCUSD',
  ETH: 'ETHUSD',
  SOL: 'SOLUSD',
  XAU: 'GCUSD',
  XAG: 'SIUSD',
};

/**
 * Register a new ticker for FMP live price sync.
 * Crypto tickers get "USD" suffix, stocks use ticker as-is.
 */
export function registerFmpTicker(ticker: string, isCrypto: boolean): void {
  if (!ticker || FMP_SYMBOLS[ticker]) return;
  FMP_SYMBOLS[ticker] = isCrypto ? `${ticker}USD` : ticker;
}

let priceCache: { prices: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes — refresh often for live feel

export async function refreshPrices(forceRefresh = false): Promise<{ updated: boolean; lastRefreshed: Date }> {
  // Return cached if fresh (unless forced)
  if (!forceRefresh && priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
    return { updated: false, lastRefreshed: new Date(priceCache.timestamp) };
  }

  const apiKey = process.env.EXPO_PUBLIC_FMP_API_KEY || 'tRnj1OCgtAYqbvxqktzQJ9oWIxjZGNa6';
  if (!apiKey || apiKey === 'placeholder') {
    return { updated: false, lastRefreshed: new Date() };
  }

  try {
    // Free tier: one symbol per request, fetch all in parallel
    const entries = Object.entries(FMP_SYMBOLS);
    const results = await Promise.allSettled(
      entries.map(async ([, fmpSymbol]) => {
        const res = await fetch(
          `https://financialmodelingprep.com/stable/quote?symbol=${fmpSymbol}&apikey=${apiKey}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
      })
    );

    const prices: Record<string, number> = {};
    entries.forEach(([ticker], i) => {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value) {
        const quote = result.value;
        if (typeof quote.price === 'number' && quote.price > 0) {
          prices[ticker] = quote.price;
        }
      }
    });

    // Update holdings with live prices
    let changed = false;
    for (const holding of portfolio.holdings) {
      const livePrice = prices[holding.ticker];
      if (livePrice !== undefined) {
        holding.price = livePrice;
        holding.totalValue = holding.shares * livePrice;
        changed = true;
      }
    }

    const now = Date.now();
    priceCache = { prices, timestamp: now };
    portfolio.lastUpdated = new Date(now).toISOString();

    // Persist updated prices
    if (changed) {
      await saveHoldings(portfolio.holdings);
    }

    return { updated: true, lastRefreshed: new Date(now) };
  } catch {
    return { updated: false, lastRefreshed: priceCache ? new Date(priceCache.timestamp) : new Date() };
  }
}

// ── Seed Data (used on first launch only) ──

const SEED_HOLDINGS: Holding[] = [
  // ── Stocks ──
  {
    id: 'aapl',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    category: 'Stock',
    emoji: '🍎',
    iconColor: '#007AFF',
    color: '#E3F2FD',
    shares: 85,
    price: 242.50,
    totalValue: 20612,
    costBasis: 15300,
    changePercent: 1.8,
    vizzyComment: "We're marrying this bag, aren't we?",
    platform: 'Fidelity',
    platformUrl: 'https://www.fidelity.com',
    roi24m: 34.7,
    logoUrl: 'https://financialmodelingprep.com/image-stock/AAPL.png',
  },
  {
    id: 'nvda',
    name: 'Nvidia',
    ticker: 'NVDA',
    category: 'Stock',
    emoji: '🟢',
    iconColor: '#76B900',
    color: '#E8F5E9',
    shares: 40,
    price: 875.30,
    totalValue: 35012,
    costBasis: 18000,
    changePercent: 3.2,
    vizzyComment: "Jensen's leather jacket energy. 🚀",
    platform: 'Schwab',
    platformUrl: 'https://www.schwab.com',
    roi24m: 94.5,
    logoUrl: 'https://financialmodelingprep.com/image-stock/NVDA.png',
  },
  {
    id: 'voo',
    name: 'Vanguard S&P 500',
    ticker: 'VOO',
    category: 'ETF',
    emoji: '📊',
    iconColor: '#007AFF',
    color: '#E3F2FD',
    shares: 120,
    price: 535.80,
    totalValue: 64296,
    costBasis: 48000,
    changePercent: 0.9,
    vizzyComment: "Set it and forget it. The lazy millionaire move.",
    platform: 'Vanguard',
    platformUrl: 'https://www.vanguard.com',
    roi24m: 33.9,
    logoUrl: 'https://financialmodelingprep.com/image-stock/VOO.png',
  },
  {
    id: 'tsla',
    name: 'Tesla',
    ticker: 'TSLA',
    category: 'Stock',
    emoji: '⚡',
    iconColor: '#CC0000',
    color: '#FFEBEE',
    shares: 25,
    price: 385.40,
    totalValue: 9635,
    costBasis: 6250,
    changePercent: -2.1,
    vizzyComment: "Rollercoaster ride. Buckle up.",
    platform: 'Robinhood',
    platformUrl: 'https://www.robinhood.com',
    roi24m: 54.2,
    logoUrl: 'https://financialmodelingprep.com/image-stock/TSLA.png',
  },
  // ── Crypto ──
  {
    id: 'btc',
    name: 'Bitcoin',
    ticker: 'BTC',
    category: 'Crypto',
    emoji: '₿',
    iconColor: '#F7931A',
    color: '#FFF8E1',
    shares: 0.85,
    price: 104250.00,
    totalValue: 88612,
    costBasis: 52000,
    changePercent: 2.4,
    vizzyComment: 'Diamond hands paying off. Satoshi would be proud.',
    platform: 'Coinbase',
    platformUrl: 'https://www.coinbase.com',
    roi24m: 70.4,
    logoUrl: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    ticker: 'ETH',
    category: 'Crypto',
    emoji: '💎',
    iconColor: '#627EEA',
    color: '#EDE7F6',
    shares: 12.5,
    price: 3820.00,
    totalValue: 47750,
    costBasis: 25000,
    changePercent: -1.3,
    vizzyComment: "Smart contracts, smart money. Vitalik approves.",
    platform: 'Coinbase',
    platformUrl: 'https://www.coinbase.com',
    roi24m: 91.0,
    logoUrl: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png',
  },
  {
    id: 'sol',
    name: 'Solana',
    ticker: 'SOL',
    category: 'Crypto',
    emoji: '🟣',
    iconColor: '#9945FF',
    color: '#F3E5F5',
    shares: 150,
    price: 178.50,
    totalValue: 26775,
    costBasis: 12000,
    changePercent: 4.7,
    vizzyComment: "Speed demon of crypto. TPS go brrr.",
    platform: 'Phantom',
    platformUrl: 'https://phantom.app',
    roi24m: 123.1,
    logoUrl: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png',
  },
  // ── Real Estate ──
  {
    id: 'rental',
    name: 'Rental Property',
    ticker: 'Real Estate',
    category: 'Los Angeles, CA',
    emoji: '🏘️',
    iconColor: '#AF52DE',
    color: '#F3E5F5',
    shares: 1,
    price: 485000,
    totalValue: 485000,
    costBasis: 380000,
    changePercent: 0.5,
    vizzyComment: "California dreamin' with real cash flow.",
    platform: 'Zillow',
    platformUrl: 'https://www.zillow.com',
    roi24m: 27.6,
  },
  // ── Cash & Savings ──
  {
    id: 'hysa',
    name: 'High Yield Savings',
    ticker: 'Cash',
    category: '4.6% APY',
    emoji: '🏦',
    iconColor: '#34C759',
    color: '#E8F5E9',
    shares: 1,
    price: 65000,
    totalValue: 65000,
    costBasis: 65000,
    changePercent: 0,
    vizzyComment: "Boring money is still money. Respect the 4.6%.",
    platform: 'Marcus by Goldman Sachs',
    platformUrl: 'https://www.marcus.com',
    roi24m: 9.2,
    logoUrl: 'https://financialmodelingprep.com/image-stock/GS.png',
  },
  {
    id: 'checking',
    name: 'Checking Account',
    ticker: 'Cash',
    category: '0.01%',
    emoji: '💳',
    iconColor: '#34C759',
    color: '#E8F5E9',
    shares: 1,
    price: 12400,
    totalValue: 12400,
    costBasis: 12400,
    changePercent: 0,
    vizzyComment: "Just vibing. Not growing, not shrinking.",
    platform: 'Chase',
    platformUrl: 'https://www.chase.com',
    roi24m: 0,
    logoUrl: 'https://financialmodelingprep.com/image-stock/JPM.png',
  },
  // ── Commodities ──
  {
    id: 'gold',
    name: 'Gold',
    ticker: 'XAU',
    category: 'Precious Metal',
    emoji: '🥇',
    iconColor: '#D4A017',
    color: '#FFF8E1',
    shares: 5.0,
    price: 2680.00,
    totalValue: 13400,
    costBasis: 9500,
    changePercent: 1.1,
    vizzyComment: "Old school flex. Gold never goes out of style.",
    platform: 'Vanguard',
    platformUrl: 'https://www.vanguard.com',
    roi24m: 41.1,
  },
  {
    id: 'silver',
    name: 'Silver',
    ticker: 'XAG',
    category: 'Precious Metal',
    emoji: '🪙',
    iconColor: '#A8A8A8',
    color: '#F1F5F9',
    shares: 100,
    price: 31.20,
    totalValue: 3120,
    costBasis: 2400,
    changePercent: 0.8,
    vizzyComment: "Gold's underrated little brother.",
    platform: 'JM Bullion',
    platformUrl: 'https://www.jmbullion.com',
    roi24m: 30.0,
  },
];

// ── In-memory portfolio (loaded from storage on init) ──

export const portfolio: Portfolio = {
  userId: 'demo-user',
  lastUpdated: new Date().toISOString(),
  holdings: [...SEED_HOLDINGS],
};

// Keep backward compat — anything importing mockPortfolio still works
export const mockPortfolio = portfolio;

let _initialized = false;

/**
 * Initialize portfolio from persistent storage.
 * Call once at app startup. Seeds with demo data on first launch.
 */
export async function initPortfolio(): Promise<void> {
  if (_initialized) return;

  const initialized = await isInitialized();
  if (initialized) {
    const stored = await loadHoldings();
    if (stored && stored.length > 0) {
      portfolio.holdings = stored;
    }
  } else {
    // First launch — seed storage with demo data
    await saveHoldings(SEED_HOLDINGS);
  }

  // Register FMP tickers for any stored holdings
  for (const h of portfolio.holdings) {
    const isCrypto = classifyHolding(h) === 'crypto';
    registerFmpTicker(h.ticker, isCrypto);
  }

  _initialized = true;
}

/**
 * Add a holding to the portfolio and persist.
 */
export async function addHoldingToPortfolio(holding: Holding): Promise<void> {
  portfolio.holdings.push(holding);
  await saveHoldings(portfolio.holdings);

  // Auto-register for FMP price sync
  const isCrypto = classifyHolding(holding) === 'crypto';
  registerFmpTicker(holding.ticker, isCrypto);

  // Immediately fetch live price for the new holding
  refreshPrices(true).catch(() => {});
}

/**
 * Remove a holding from the portfolio and persist.
 */
export async function removeHoldingFromPortfolio(holdingId: string): Promise<void> {
  portfolio.holdings = portfolio.holdings.filter((h) => h.id !== holdingId);
  await saveHoldings(portfolio.holdings);
}

/**
 * Update a holding in the portfolio and persist.
 */
export async function updateHoldingInPortfolio(
  holdingId: string,
  updates: Partial<Holding>
): Promise<void> {
  portfolio.holdings = portfolio.holdings.map((h) =>
    h.id === holdingId ? { ...h, ...updates } : h
  );
  await saveHoldings(portfolio.holdings);
}

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Get total portfolio value
 */
export function getTotalValue(): number {
  return portfolio.holdings.reduce((sum, h) => sum + h.totalValue, 0);
}

/**
 * Get total gains/losses
 */
export function getTotalGain(): { amount: number; percent: number } {
  const totalValue = getTotalValue();
  const totalCost = portfolio.holdings.reduce(
    (sum, h) => sum + h.costBasis,
    0
  );
  const amount = totalValue - totalCost;
  const percent = totalCost > 0 ? (amount / totalCost) * 100 : 0;
  return { amount, percent };
}

/**
 * Get portfolio allocation by category
 */
export function getAllocation(): { category: string; percent: number; value: number }[] {
  const total = getTotalValue();
  if (total === 0) return [];
  const categories = new Map<string, number>();

  portfolio.holdings.forEach((h) => {
    const current = categories.get(h.category) || 0;
    categories.set(h.category, current + h.totalValue);
  });

  return Array.from(categories.entries()).map(([category, value]) => ({
    category,
    value,
    percent: (value / total) * 100,
  }));
}

const CATEGORY_MAP: Record<string, { name: string; emoji: string; gradientColors: [string, string] }> = {
  stocks: { name: 'Stocks', emoji: '📈', gradientColors: ['#10b981', '#065f46'] },
  crypto: { name: 'Crypto', emoji: '₿', gradientColors: ['#f97316', '#9a3412'] },
  realestate: { name: 'Real Estate', emoji: '🏘️', gradientColors: ['#0ea5e9', '#1e3a5f'] },
  cash: { name: 'Savings', emoji: '💰', gradientColors: ['#eab308', '#b45309'] },
  commodities: { name: 'Commodities', emoji: '🥇', gradientColors: ['#64748b', '#334155'] },
};

export function classifyHolding(h: Holding): string {
  // Check category field first (set by manual add flow)
  const cat = h.category?.toLowerCase() ?? '';
  if (cat === 'crypto') return 'crypto';
  if (cat === 'stock' || cat === 'etf') return 'stocks';
  if (cat === 'precious metal') return 'commodities';

  // Fallback: check ticker patterns
  if (['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'DOT', 'AVAX', 'LINK', 'MATIC', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'SHIB', 'PEPE'].includes(h.ticker)) return 'crypto';
  if (h.ticker === 'Real Estate') return 'realestate';
  if (h.ticker === 'Cash') return 'cash';
  if (['XAU', 'XAG', 'Commodity'].includes(h.ticker)) return 'commodities';
  return 'stocks';
}

/**
 * Group holdings into asset categories for card stack display
 */
export function getCategories(): AssetCategory[] {
  const groups = new Map<string, Holding[]>();

  portfolio.holdings.forEach((h) => {
    const key = classifyHolding(h);
    const existing = groups.get(key) || [];
    existing.push(h);
    groups.set(key, existing);
  });

  const order = ['stocks', 'crypto', 'realestate', 'cash', 'commodities'];

  return order
    .filter((key) => groups.has(key))
    .map((key) => {
      const holdings = groups.get(key)!;
      const meta = CATEGORY_MAP[key];
      const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
      const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
      const changePercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

      return {
        id: key,
        name: meta.name,
        emoji: meta.emoji,
        gradientColors: meta.gradientColors,
        totalValue,
        changePercent: Math.round(changePercent * 10) / 10,
        holdingCount: holdings.length,
        holdings,
      };
    });
}

/**
 * Local asset logos for holdings that don't have remote logoUrl.
 * Components should check this map first, then fall back to logoUrl.
 */
import { ImageSource } from 'expo-image';

export const LOCAL_LOGOS: Record<string, ImageSource> = {
  gold: require('../assets/logos/gold.png'),
  silver: require('../assets/logos/silver.png'),
  rental: require('../assets/logos/house.png'),
};
