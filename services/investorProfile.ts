/**
 * Investor Profile Service
 *
 * Takes the 5 onboarding answers, sends them to an LLM to build a
 * structured investor profile, and persists it via AsyncStorage.
 * The profile is injected as context into Vizzy chat.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '';
const MODEL = 'google/gemini-2.5-flash-lite-preview-09-2025:nitro';
const STORAGE_KEY = '@vizzy_investor_profile';

const QUESTIONS = [
  'How old are you and when do you want to retire?',
  'Risk tolerance? 1 is grandma\'s savings, 10 is YOLO into memecoins.',
  'How much do you earn and save each month?',
  'What\'s your main goal — grow wealth fast or steady income?',
  'Do you love stocks, crypto, real estate, or gold? Any you hate?',
];

export type AllocationItem = {
  label: string;
  value: number; // 0-100
  color: string;
};

export type InvestorProfile = {
  title: string;           // e.g. "Growth Adventurer"
  subtitle: string;        // 1-2 sentence personality description
  riskLevel: number;       // 1-10
  riskLabel: string;       // e.g. "Growth", "Aggressive", "Conservative"
  allocation: AllocationItem[];
  age: number | null;
  retireAge: number | null;
  monthlyIncome: string;
  monthlySavings: string;
  mainGoal: string;
  preferences: string;     // what they love/hate
  summary: string;         // 3-4 sentence summary for Vizzy context
  keyFindings: string[];   // 3 key takeaways from the interview
  generatedAt: string;     // ISO date
};

const ALLOCATION_COLORS: Record<string, string> = {
  Stocks: '#5B8DEF',
  Crypto: '#FF8C42',
  Bonds: '#4CD964',
  'Real Estate': '#A78BFA',
  Cash: '#F5C542',
  Gold: '#D4A843',
  Commodities: '#D4A843',
  ETFs: '#38BDF8',
};

export async function generateProfile(answers: string[]): Promise<InvestorProfile> {
  const answersText = answers
    .map((a, i) => `Q: ${QUESTIONS[i]}\nA: ${a}`)
    .join('\n\n');

  const prompt = `You are a financial profile analyzer. Based on these interview answers, generate a structured investor profile.

INTERVIEW:
${answersText}

Respond ONLY with valid JSON (no markdown, no backticks, no explanation). Use this exact schema:
{
  "title": "2-3 word investor personality title like 'Growth Adventurer' or 'Steady Builder' or 'Risk Taker'",
  "subtitle": "1-2 sentence personality description",
  "riskLevel": <number 1-10>,
  "riskLabel": "Conservative|Moderate|Growth|Aggressive",
  "allocation": [
    {"label": "Stocks", "value": <0-100>},
    {"label": "Crypto", "value": <0-100>},
    {"label": "Bonds", "value": <0-100>},
    {"label": "Real Estate", "value": <0-100>},
    {"label": "Cash", "value": <0-100>}
  ],
  "age": <number or null>,
  "retireAge": <number or null>,
  "monthlyIncome": "formatted string",
  "monthlySavings": "formatted string",
  "mainGoal": "short description of their main financial goal",
  "preferences": "what asset classes they love and hate",
  "summary": "3-4 sentence investor summary that a financial advisor chatbot should know about this person",
  "keyFindings": ["finding 1 (short, punchy insight about them)", "finding 2", "finding 3"]
}

The allocation values MUST add up to 100. Tailor the allocation to match their risk tolerance, goals, and preferences. If they love crypto, give crypto more weight. If they're conservative, lean toward bonds and cash.
The keyFindings should be 3 short, specific takeaways from their answers — things like "Wants to retire by 55 — 27 years to compound", "High risk appetite (8/10) — can stomach volatility", "Saves $1,200/mo — solid base for dollar-cost averaging".`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.3,
        provider: { order: ['Google AI Studio'] },
      }),
    });

    if (!response.ok) {
      console.error('[InvestorProfile] API error:', response.status);
      return fallbackProfile(answers);
    }

    const data = await response.json();
    let text = data?.choices?.[0]?.message?.content ?? '';

    // Strip markdown fences if model adds them
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(text);

    // Attach colors to allocation items
    const profile: InvestorProfile = {
      ...parsed,
      allocation: (parsed.allocation ?? []).map((item: any) => ({
        label: item.label,
        value: item.value,
        color: ALLOCATION_COLORS[item.label] ?? '#999999',
      })),
      generatedAt: new Date().toISOString(),
    };

    await saveProfile(profile);
    return profile;
  } catch (err) {
    console.error('[InvestorProfile] Generation error:', err);
    return fallbackProfile(answers);
  }
}

function fallbackProfile(answers: string[]): InvestorProfile {
  return {
    title: 'Growth Explorer',
    subtitle: 'You balance ambition with pragmatism. Open to new opportunities while keeping a safety net.',
    riskLevel: 6,
    riskLabel: 'Growth',
    allocation: [
      { label: 'Stocks', value: 35, color: '#5B8DEF' },
      { label: 'Crypto', value: 25, color: '#FF8C42' },
      { label: 'Bonds', value: 10, color: '#4CD964' },
      { label: 'Real Estate', value: 20, color: '#A78BFA' },
      { label: 'Cash', value: 10, color: '#F5C542' },
    ],
    age: null,
    retireAge: null,
    monthlyIncome: 'Not specified',
    monthlySavings: 'Not specified',
    mainGoal: 'Grow wealth while maintaining stability',
    preferences: 'Open to all asset classes',
    summary: `This investor completed the onboarding interview. Their raw answers: ${answers.join(' | ')}`,
    keyFindings: [
      'Completed the onboarding interview',
      'Looking to grow wealth over time',
      'Open to exploring different asset classes',
    ],
    generatedAt: new Date().toISOString(),
  };
}

export async function saveProfile(profile: InvestorProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<InvestorProfile | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
