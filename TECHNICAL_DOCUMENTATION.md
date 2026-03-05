# Vizzy — Technical Documentation

## Architecture Overview

Vizzy is built with **Expo SDK 54** and **React Native 0.81** using the new architecture. It uses **expo-router v6** with file-based routing and typed routes. The app is iOS-first, targeting iPhone with portrait orientation.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54, React Native 0.81 (New Architecture) |
| Navigation | expo-router v6 (file-based, typed routes) |
| Animations | react-native-reanimated v4 |
| Gestures | react-native-gesture-handler |
| Images | expo-image (high-performance, cached) |
| Charts | react-native-svg (custom sparkline renderer) |
| Gradients | expo-linear-gradient |
| Storage | @react-native-async-storage/async-storage |
| Monetization | react-native-purchases v8 (RevenueCat SDK) |
| AI Chat | OpenRouter API (Google Gemini) |
| Speech-to-Text | OVH Whisper large-v3-turbo |
| Market Data | Financial Modeling Prep API |

### Project Structure

```
vizzy-app/
├── app/                          # File-based routing (expo-router)
│   ├── _layout.tsx               # Root layout: RevenueCat init, ProContext provider
│   ├── index.tsx                 # Entry: routes to onboarding or tabs
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── _layout.tsx           # Tab config with FloatingDock
│   │   ├── briefing.tsx          # Daily AI briefing cards
│   │   ├── ask.tsx               # AI chat with Vizzy
│   │   └── vault/                # Portfolio vault
│   │       ├── _layout.tsx       # Vault stack navigator
│   │       ├── index.tsx         # Category card stack overview
│   │       └── [category].tsx    # Individual category detail + holdings
│   ├── onboarding/               # First-run experience
│   │   ├── welcome.tsx           # Welcome screen with fox mascot
│   │   ├── name.tsx              # Name input
│   │   ├── interview.tsx         # 5-question AI interview
│   │   └── profile.tsx           # Generated investor profile
│   ├── paywall.tsx               # Context-aware paywall (modal)
│   ├── connect.tsx               # Add holdings flow (manual entry)
│   ├── profile.tsx               # User profile & settings
│   ├── terms.tsx                 # Terms of Service
│   └── privacy.tsx               # Privacy Policy
├── components/                   # Reusable UI components
│   ├── AssetCategoryCard.tsx     # Gradient cards with sparklines
│   ├── BriefingCard.tsx          # AI-generated insight cards
│   ├── PaywallCard.tsx           # Subscription plan cards
│   ├── FloatingDock.tsx          # Bottom navigation dock
│   └── HeaderLogo.tsx            # Vizzy wordmark logo
├── services/                     # Business logic & API integrations
│   ├── revenuecat.ts             # RevenueCat SDK wrapper + React hook
│   ├── dayPass.ts                # 24-hour consumable tracking
│   ├── portfolio.ts              # Portfolio data management + FMP API
│   ├── openrouter.ts             # OpenRouter/Gemini API client
│   ├── vizzyChat.ts              # Chat session management
│   ├── briefing.ts               # Daily briefing generation
│   ├── investorProfile.ts        # AI investor profile generation
│   ├── stt.ts                    # OVH Whisper speech-to-text
│   ├── chartUtils.ts             # Sparkline SVG path generation
│   ├── categoryIcons.ts          # Shared category icon mappings
│   ├── profile.ts                # User profile persistence
│   ├── userName.ts               # Name storage
│   └── storage.ts                # AsyncStorage utilities
└── assets/                       # Static assets
    ├── splash-vizzy.png          # Splash screen (fox mascot)
    ├── icon-wordmark.png         # App icon (1024x1024)
    ├── vizzy-wordmark.png        # Header wordmark logo
    ├── vizzy-fox.png             # Fox mascot for paywall
    └── icons/                    # Custom illustrated category icons
        ├── stocks.png
        ├── crypto.png
        ├── realestate.png
        ├── cash.png
        ├── commodities.png
        └── other.png
```

---

## RevenueCat Integration — Deep Dive

### Initialization

RevenueCat is initialized at the root layout level (`app/_layout.tsx`), ensuring it's ready before any screen renders:

```typescript
// app/_layout.tsx
useEffect(() => {
  async function bootstrap() {
    await Promise.all([
      initRevenueCat(),  // Configure RevenueCat SDK
      initPortfolio(),   // Load portfolio data
    ]);
    const proStatus = await checkProStatus();
    setIsPro(proStatus);
  }
  bootstrap();
}, []);

// Wraps entire app with ProContext
<ProContext.Provider value={{ isPro, setIsPro, loading }}>
  {/* All screens */}
</ProContext.Provider>
```

The `initRevenueCat()` function in `services/revenuecat.ts` configures the SDK:

```typescript
export async function initRevenueCat(): Promise<void> {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
}
```

### Entitlement Architecture

| Entitlement | Lookup Key | Grants Access To |
|-------------|-----------|-----------------|
| Vizzy Pro | `pro` | Unlimited chat, full briefings, roasts, all modes |

The `pro` entitlement is checked throughout the app via the `ProContext`:

```typescript
const { isPro } = useProStatus();  // Any component can check pro status
```

### Products & Offerings

**RevenueCat Dashboard Configuration:**

| Product | Store Identifier | Type | Price | Entitlement |
|---------|-----------------|------|-------|-------------|
| Vizzy Pro Monthly | `vizzy_pro_monthly` | Subscription (P1M) | $4.99 | pro |
| Vizzy Pro Annual | `vizzy_pro_yearly` | Subscription (P1Y) | $34.99 | pro |
| Chat Day Pass | `vizzy_chat_day_pass` | One-time (consumable) | $0.99 | — |
| Briefing Unlock | `vizzy_briefing_day_pass` | One-time (consumable) | $0.99 | — |
| Portfolio Roast | `vizzy_portfolio_roast` | One-time (consumable) | $1.99 | — |

All products are grouped under a single offering ("Vizzy Default") with 5 packages:
- `$rc_monthly` — Monthly subscription
- `$rc_annual` — Annual subscription
- `chat_day_pass` — Chat consumable
- `briefing_day_pass` — Briefing consumable
- `portfolio_roast` — Roast consumable

### Purchase Flow

The paywall (`app/paywall.tsx`) is presented as a modal and supports context-aware triggers:

```
User hits free limit → router.push('/paywall?trigger=chat')
                     → router.push('/paywall?trigger=briefing')
                     → router.push('/paywall?trigger=roast')
                     → router.push('/paywall')  // general
```

Each trigger customizes:
- The paywall title and subtitle
- Which day pass is highlighted at the top
- The feature list shown on subscription cards

**Subscription Purchase:**
```typescript
const handlePurchase = async () => {
  const pkg = selectedPlan === 'yearly'
    ? offerings.current.annual
    : offerings.current.monthly;
  const success = await purchase(pkg);  // RevenueCat SDK handles payment sheet
  if (success) closePaywall();
};
```

**Consumable Purchase (Day Passes):**
```typescript
const handleDayPassPurchase = async (pass) => {
  const pkg = findProduct(pass.productId);  // Find in RevenueCat offerings
  if (pkg) {
    const success = await purchaseConsumableProduct(pkg);
    if (success) {
      await activateDayPass(pass.type);  // Track 24h expiry locally
      closePaywall();
    }
  }
};
```

### Day Pass System

Consumable purchases need local tracking since they don't create persistent entitlements. The `services/dayPass.ts` module handles this:

```typescript
// After successful RevenueCat purchase:
await activateDayPass('chat');  // Stores timestamp + 24h expiry in AsyncStorage

// Before enforcing limits:
const hasPass = await hasActiveDayPass('chat');  // Checks if within 24h window
```

The `useDayPass()` hook provides reactive state with auto-refresh every 60 seconds, so the UI updates when a pass expires.

### Restore Purchases

The paywall includes a "Restore" button that calls:

```typescript
const result = await Purchases.restorePurchases();
const isPro = result.entitlements.active['pro'] !== undefined;
```

### Gating Logic

Free tier limits are enforced in the feature screens:

- **Ask Vizzy (chat):** 3 free messages/day, tracked in local state. Pro users or active chat day pass holders bypass the limit.
- **Briefing:** 2 of 5 cards shown to free users. Pro users or briefing day pass holders see all 5.
- **Portfolio Roast:** Requires pro subscription or roast day pass.

When a limit is hit, the app navigates to the paywall with the appropriate trigger parameter, creating a seamless conversion moment.

### React Hook: `useRevenueCat()`

A comprehensive hook that encapsulates all RevenueCat operations:

```typescript
const {
  isPro,                      // boolean — has active "pro" entitlement
  offerings,                  // PurchasesOfferings — available products
  loading,                    // boolean — initial load state
  purchase,                   // (pkg) => Promise<boolean> — buy subscription
  restore,                    // () => Promise<boolean> — restore purchases
  purchaseConsumableProduct,  // (pkg) => Promise<boolean> — buy consumable
  findProduct,                // (productId) => PurchasesPackage | null
} = useRevenueCat();
```

---

## AI Integration

### Chat (Ask Vizzy)

Uses OpenRouter API with Google Gemini. The system prompt includes the user's portfolio data and investor profile, making every response personalized:

- Portfolio holdings and allocation percentages are injected into context
- Investor profile (risk tolerance, goals, savings) shapes the advice
- Vizzy's personality (snarky, direct, Gen Z-friendly) is maintained via system prompt
- Chat history is persisted to AsyncStorage across sessions

### Daily Briefing

Generates 5 cards daily via Gemini, each analyzing the user's actual portfolio. Cards are typed as:
- **Insight** — Market analysis relevant to held assets
- **Roast** — Honest critique of allocation or decisions
- **Action** — Specific, actionable recommendation

Briefings are cached for 30 minutes to reduce API calls.

### Speech-to-Text

Voice input uses OVH's Whisper large-v3-turbo endpoint. Audio is recorded as m4a, transcribed server-side, and inserted into the chat input. This enables hands-free portfolio questions.

---

## Data Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ AsyncStorage │◄──►│  Portfolio    │◄──►│ FMP API         │
│ (holdings,   │    │  Service     │    │ (live prices)   │
│  profile,    │    └──────────────┘    └─────────────────┘
│  chat,       │
│  day passes) │    ┌──────────────┐    ┌─────────────────┐
└──────────────┘    │  Briefing    │◄──►│ OpenRouter API   │
                    │  Service     │    │ (Gemini)         │
                    └──────────────┘    └─────────────────┘

                    ┌──────────────┐    ┌─────────────────┐
                    │  RevenueCat  │◄──►│ RevenueCat      │
                    │  Service     │    │ Backend          │
                    └──────────────┘    └─────────────────┘
```

All user data is stored locally on-device via AsyncStorage. No backend server is required — the app communicates directly with third-party APIs (RevenueCat, OpenRouter, FMP, OVH Whisper).

---

## Build & Deployment

- **Platform:** iOS (iPhone)
- **Build System:** EAS Build (Expo Application Services)
- **Distribution:** TestFlight
- **Bundle Identifier:** `com.vizzy.money`
- **Min iOS Version:** iOS 16+
- **Architecture:** New React Native Architecture enabled

---

*RevenueCat SDK powers all monetization — from subscription management and entitlement checking to consumable purchase tracking. The integration is production-ready with proper error handling, restore functionality, and context-aware paywall triggers.*
