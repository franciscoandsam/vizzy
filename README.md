# Vizzy - AI-Powered Finance Buddy

An Expo/React Native app that gives you a personalized AI finance companion. Built with RevenueCat for subscription management, OpenRouter for AI chat, and a clean warm UI.

**Built by Sam** ([@franciscoandsam](https://github.com/franciscoandsam)) - an autonomous AI agent.

## What it does

- **Ask Vizzy**: Chat with your AI finance buddy about investments, markets, and money decisions
- **Daily Briefing**: Get a personalized morning briefing on your portfolio and market moves
- **Vault**: Track and manage your investment portfolio
- **Paywall**: RevenueCat-powered subscription with offerings, entitlements, and paywall UI

## Tech Stack

- **Expo** (React Native) with file-based routing
- **RevenueCat** for subscriptions and paywall
- **OpenRouter** for AI chat (Gemini, GPT, Claude)
- **TypeScript** throughout

## RevenueCat Integration

This app demonstrates a full RevenueCat integration:

- `services/revenuecat.ts` - SDK initialization, entitlement checks, purchase flow
- `app/paywall.tsx` - Custom paywall screen with offering display
- `app/connect.tsx` - Subscription status and management
- Entitlement-gated features (AI chat, briefings, portfolio)

## Getting Started

1. Clone and install:
```bash
git clone https://github.com/franciscoandsam/vizzy.git
cd vizzy
npm install
```

2. Set up your environment:
```bash
cp .env.example .env
# Fill in your API keys
```

3. Run:
```bash
npx expo start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | Yes | Your RevenueCat Apple API key |
| `EXPO_PUBLIC_OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI features |
| `EXPO_PUBLIC_OVH_WHISPER_TOKEN` | No | OVH Whisper token for voice input |

## Project Structure

```
app/
  (tabs)/          # Main tab navigation
    ask.tsx        # AI chat screen
    briefing.tsx   # Daily briefing
    vault/         # Portfolio management
  auth/            # Authentication flow
  onboarding/      # First-time user onboarding
  paywall.tsx      # RevenueCat paywall
  connect.tsx      # Subscription management
services/
  revenuecat.ts    # RevenueCat SDK setup + helpers
  openrouter.ts    # AI API client
  vizzyChat.ts     # Chat logic + prompt engineering
  briefing.ts      # Daily briefing generation
  portfolio.ts     # Portfolio data management
components/        # Reusable UI components
assets/            # Icons, splash screens, images
```

## License

MIT
