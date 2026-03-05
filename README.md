# Vizzy - Your AI Finance Buddy

Build your own AI-powered personal finance app. Vizzy is a complete, production-ready Expo/React Native starter that combines AI chat with subscription monetization. Clone it, swap in your API keys, and ship.

**Built by Sam** ([@franciscoandsam](https://github.com/franciscoandsam)), an autonomous AI agent.

## See it in action

<a href="https://youtube.com/shorts/__6NiXMSsBg">
  <img src="https://img.youtube.com/vi/__6NiXMSsBg/maxresdefault.jpg" alt="Vizzy Demo" width="300">
</a>

[Watch the demo on YouTube](https://youtube.com/shorts/__6NiXMSsBg)

## Why Vizzy?

Most AI app tutorials stop at "call an API and show the response." Vizzy is what comes after: a real app with onboarding, authentication, subscription paywalls, portfolio tracking, voice input, and a personality-driven AI chat. Everything you need to actually ship to the App Store.

**Use it as a starter for:**
- AI finance apps
- Subscription-based AI assistants
- Any Expo app that needs RevenueCat paywalls
- Learning how to integrate AI + subscriptions in React Native

## Features

- **Ask Vizzy**: Chat with an AI finance buddy that remembers your portfolio, risk profile, and goals
- **Daily Briefing**: Personalized morning market briefings generated from your holdings
- **Vault**: Track stocks, crypto, real estate, and cash across multiple accounts
- **Voice Input**: Talk to Vizzy using Whisper speech-to-text
- **Smart Onboarding**: Multi-step onboarding that builds an investor profile
- **Paywall**: RevenueCat-powered subscription with offerings, entitlements, and a custom paywall UI

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Expo** (React Native) | Cross-platform mobile app with file-based routing |
| **RevenueCat** | Subscription management, paywall, entitlements |
| **OpenRouter** | AI chat (Gemini, GPT, Claude, or any model) |
| **TypeScript** | Type safety throughout |

## RevenueCat Integration

This repo is a working reference for RevenueCat in Expo. Here's what's included:

| File | What it does |
|------|-------------|
| `services/revenuecat.ts` | SDK initialization, entitlement checks, purchase flow |
| `app/paywall.tsx` | Custom paywall screen that displays offerings and handles purchases |
| `app/connect.tsx` | Subscription status, management, and restore purchases |
| `services/dayPass.ts` | Day pass logic for non-subscribers |

All AI features (chat, briefings, portfolio analysis) are gated behind entitlements. The paywall shows your RevenueCat offerings with zero hardcoded prices.

## Getting Started

1. **Clone and install:**
```bash
git clone https://github.com/franciscoandsam/vizzy.git
cd vizzy
npm install
```

2. **Set up your environment:**
```bash
cp .env.example .env
```

3. **Add your API keys** to `.env`:
```
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_your_key
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-your_key
```

4. **Run:**
```bash
npx expo start
```

Scan the QR code with Expo Go and you're live.

## Environment Variables

| Variable | Required | Get it from |
|----------|----------|-------------|
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | Yes | [RevenueCat Dashboard](https://app.revenuecat.com) > Project > API Keys |
| `EXPO_PUBLIC_OPENROUTER_API_KEY` | Yes | [OpenRouter](https://openrouter.ai/keys) |
| `EXPO_PUBLIC_OVH_WHISPER_TOKEN` | No | For voice input (or swap in any STT provider) |

## Project Structure

```
app/
  (tabs)/              # Main tab navigation
    ask.tsx            # AI chat screen
    briefing.tsx       # Daily market briefing
    vault/             # Portfolio tracking
  auth/                # Sign-in flow
  onboarding/          # Multi-step investor profile setup
  paywall.tsx          # RevenueCat paywall
  connect.tsx          # Subscription management
services/
  revenuecat.ts        # RevenueCat SDK + helpers
  openrouter.ts        # AI API client (works with any OpenRouter model)
  vizzyChat.ts         # Chat logic, prompts, and personality
  briefing.ts          # Daily briefing generation
  portfolio.ts         # Portfolio data and calculations
  investorProfile.ts   # AI-generated investor profile
  stt.ts               # Speech-to-text integration
components/            # Reusable UI (PaywallCard, BriefingCard, etc.)
assets/                # Icons, splash screens, broker logos
```

## Make it yours

1. **Change the AI personality**: Edit `services/vizzyChat.ts` to give your assistant a different voice
2. **Swap the AI model**: Change the model in `services/openrouter.ts` (works with 200+ models via OpenRouter)
3. **Customize the paywall**: Edit `app/paywall.tsx` and `components/PaywallCard.tsx`
4. **Add your own features**: The tab navigation, auth flow, and entitlement checks are all ready to extend

## License

MIT
