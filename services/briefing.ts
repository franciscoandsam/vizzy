/**
 * Daily Briefing Card Generation
 *
 * Generates personalized daily briefing cards via Gemini Flash Lite,
 * based on the user's real portfolio data.
 *
 * Card types:
 * - Insight: portfolio/market observations (green gradient)
 * - Roast: sassy spending/behavior callouts (red gradient)
 * - Action: actionable financial suggestions (orange gradient)
 */

import { mockPortfolio, getTotalValue, getTotalGain, getCategories, formatCurrency, formatPercent } from './portfolio';
import { loadProfile } from './investorProfile';

export type CardType = 'insight' | 'roast' | 'action';

export type BriefingCardData = {
  id: string;
  type: CardType;
  message: string;
  detail: string;
  createdAt: string;
  read: boolean;
};

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '';
const MODEL = 'google/gemini-2.5-flash-lite-preview-09-2025:nitro';

function buildPortfolioContext(): string {
  const totalValue = getTotalValue();
  const gain = getTotalGain();
  const categories = getCategories();

  const holdingsSummary = mockPortfolio.holdings
    .map(
      (h) =>
        `${h.name} (${h.ticker}): total ${formatCurrency(h.totalValue)}, ${h.shares} shares at ${formatCurrency(h.price)} each, cost basis ${formatCurrency(h.costBasis)}, ${formatPercent(h.changePercent)} today, on ${h.platform}`
    )
    .join('\n');

  const allocationSummary = categories
    .map((c) => `${c.name}: ${formatCurrency(c.totalValue)} (${Math.round((c.totalValue / totalValue) * 100)}%)`)
    .join('\n');

  return `Total portfolio value: ${formatCurrency(totalValue)}
Total gain/loss: ${formatCurrency(gain.amount)} (${formatPercent(gain.percent)})

HOLDINGS:
${holdingsSummary}

ALLOCATION:
${allocationSummary}`;
}

const BRIEFING_PROMPT = `You are Vizzy, a snarky financial fox. Analyze this portfolio and generate exactly 5 daily briefing cards.

CARD MIX: 2 insights, 2 roasts, 1 action item. Order them: insight, roast, action, insight, roast.

RULES:
- "message" is a punchy headline (under 15 words). No markdown, no asterisks.
- "detail" is 1-2 sentences with EXACT numbers from the portfolio data. Never invent figures.
- Roasts should be funny but grounded in real data (e.g. overweight positions, low-yield cash).
- Insights should highlight something interesting about their allocation or gains.
- The action should suggest a concrete move they can make.
- Do NOT use markdown formatting anywhere. Plain text only.

Return ONLY a valid JSON array, no other text. Each object must have:
{"type": "insight"|"roast"|"action", "message": "...", "detail": "..."}

PORTFOLIO DATA:
`;

// Cache so we don't regenerate on every render
let cachedCards: BriefingCardData[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fallback cards if AI generation fails
 */
function getFallbackCards(): BriefingCardData[] {
  const totalValue = getTotalValue();
  const gain = getTotalGain();

  return [
    {
      id: '1',
      type: 'insight',
      message: `Your portfolio is worth ${formatCurrency(totalValue)}. Not bad.`,
      detail: `You're up ${formatCurrency(gain.amount)} (${formatPercent(gain.percent)}) all time. Keep it going.`,
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'roast',
      message: "Your checking account is earning 0.01%. That's basically nothing.",
      detail: `You have ${formatCurrency(12400)} sitting in Chase earning pennies. That money could be working harder.`,
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'action',
      message: 'Move idle cash to a high-yield savings account.',
      detail: 'Your checking account at 0.01% is losing to inflation. A 4.6% APY account would earn you real money.',
      createdAt: new Date().toISOString(),
      read: false,
    },
  ];
}

/**
 * Generate today's briefing cards via AI
 */
export async function generateDailyBriefing(): Promise<BriefingCardData[]> {
  // Return cached if fresh
  if (cachedCards && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedCards;
  }

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'placeholder') {
    return getFallbackCards();
  }

  try {
    const portfolioContext = buildPortfolioContext();
    const profile = await loadProfile().catch(() => null);
    const profileContext = profile
      ? `\nINVESTOR PROFILE:\nType: ${profile.title} | Risk: ${profile.riskLevel}/10 (${profile.riskLabel})\nGoal: ${profile.mainGoal}\nPreferences: ${profile.preferences}\nSummary: ${profile.summary}\n`
      : '';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: BRIEFING_PROMPT + portfolioContext + profileContext,
          },
        ],
        max_tokens: 800,
        temperature: 0.6,
        provider: {
          order: ['Google AI Studio'],
        },
      }),
    });

    if (!response.ok) {
      console.error('[Briefing] API error:', response.status);
      return getFallbackCards();
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content ?? '';

    // Strip markdown code fences if present
    reply = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(reply);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getFallbackCards();
    }

    const cards: BriefingCardData[] = parsed.map(
      (card: { type: string; message: string; detail: string }, i: number) => ({
        id: String(i + 1),
        type: (['insight', 'roast', 'action'].includes(card.type) ? card.type : 'insight') as CardType,
        message: (card.message ?? '').replace(/[*#@_~`]/g, ''),
        detail: (card.detail ?? '').replace(/[*#@_~`]/g, ''),
        createdAt: new Date().toISOString(),
        read: false,
      })
    );

    cachedCards = cards;
    cacheTimestamp = Date.now();

    return cards;
  } catch (error) {
    console.error('[Briefing] Generation failed:', error);
    return getFallbackCards();
  }
}

/**
 * Mark a card as read
 */
export function markCardRead(cardId: string): void {
  console.log('Card marked as read:', cardId);
}
