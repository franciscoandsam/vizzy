import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
} from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { addHoldingToPortfolio, getTotalValue, formatCurrency, type Holding } from '../services/portfolio';

const LOGOS: Record<string, ImageSource> = {
  bofa: require('../assets/logos/bofa.png'),
  wellsfargo: require('../assets/logos/wellsfargo.png'),
  chase: require('../assets/logos/chase.png'),
  capitalone: require('../assets/logos/capitalone.png'),
  fidelity: require('../assets/logos/fidelity.png'),
  schwab: require('../assets/logos/schwab.png'),
  coinbase: require('../assets/logos/coinbase.png'),
  vanguard: require('../assets/logos/vanguard.png'),
  robinhood: require('../assets/logos/robinhood.png'),
  marcus: require('../assets/logos/marcus.png'),
  wealthfront: require('../assets/logos/wealthfront.png'),
  betterment: require('../assets/logos/betterment.png'),
  etrade: require('../assets/logos/etrade.png'),
  merrill: require('../assets/logos/merrill.png'),
  sofi: require('../assets/logos/sofi.png'),
  ally: require('../assets/logos/ally.png'),
  usbank: require('../assets/logos/usbank.png'),
  kraken: require('../assets/logos/kraken.png'),
  gemini: require('../assets/logos/gemini.png'),
};

type Step =
  | 'choose'
  | 'plaid-intro'
  | 'plaid-select'
  | 'plaid-auth-info'
  | 'plaid-login'
  | 'plaid-accounts'
  | 'plaid-authorizing'
  | 'plaid-success'
  | 'manual-categories'
  | 'manual-name'
  | 'manual-value'
  | 'manual-location'
  | 'manual-apy'
  | 'manual-cost'
  | 'manual-success';

type Institution = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  url: string;
};

const PLAID_INSTITUTIONS: Institution[] = [
  { id: 'bofa', name: 'Bank of America', emoji: '🏦', color: '#012169', url: 'www.bankofamerica.com' },
  { id: 'wellsfargo', name: 'Wells Fargo', emoji: '🏦', color: '#D71E28', url: 'www.wellsfargo.com' },
  { id: 'chase', name: 'Chase', emoji: '🏦', color: '#003087', url: 'www.chase.com' },
  { id: 'capitalone', name: 'Capital One', emoji: '🏦', color: '#004977', url: 'www.capitalone.com' },
  { id: 'fidelity', name: 'Fidelity', emoji: '📊', color: '#4A8C2A', url: 'www.fidelity.com' },
  { id: 'schwab', name: 'Schwab', emoji: '💹', color: '#00A0DC', url: 'www.schwab.com' },
  { id: 'coinbase', name: 'Coinbase', emoji: '₿', color: '#0052FF', url: 'www.coinbase.com' },
  { id: 'vanguard', name: 'Vanguard', emoji: '🏛️', color: '#96151D', url: 'www.vanguard.com' },
  { id: 'robinhood', name: 'Robinhood', emoji: '🪶', color: '#00C805', url: 'www.robinhood.com' },
  { id: 'marcus', name: 'Marcus by Goldman Sachs', emoji: '🏦', color: '#1A1A1A', url: 'www.marcus.com' },
  { id: 'wealthfront', name: 'Wealthfront', emoji: '📈', color: '#472EC4', url: 'www.wealthfront.com' },
  { id: 'betterment', name: 'Betterment', emoji: '📊', color: '#1E88E5', url: 'www.betterment.com' },
  { id: 'etrade', name: 'E*TRADE', emoji: '💹', color: '#6633CC', url: 'www.etrade.com' },
  { id: 'merrill', name: 'Merrill Lynch', emoji: '🏛️', color: '#002D72', url: 'www.ml.com' },
  { id: 'sofi', name: 'SoFi', emoji: '💰', color: '#00BCD4', url: 'www.sofi.com' },
  { id: 'ally', name: 'Ally Bank', emoji: '🏦', color: '#5C2D91', url: 'www.ally.com' },
  { id: 'usbank', name: 'US Bank', emoji: '🏦', color: '#D71920', url: 'www.usbank.com' },
  { id: 'kraken', name: 'Kraken', emoji: '₿', color: '#5741D9', url: 'www.kraken.com' },
  { id: 'gemini', name: 'Gemini', emoji: '₿', color: '#00DCFA', url: 'www.gemini.com' },
];

type ManualCategory = {
  id: string;
  label: string;
  image: ImageSource;
  color: string;
  fields: { key: string; placeholder: string; numeric?: boolean }[];
};

const MANUAL_CATEGORIES: ManualCategory[] = [
  {
    id: 'stocks',
    label: 'Stocks & ETFs',
    image: require('../assets/icons/stocks.png'),
    color: '#10b981',
    fields: [
      { key: 'name', placeholder: 'Stock name (e.g. Apple, QQQ)' },
      { key: 'ticker', placeholder: 'Ticker symbol (e.g. AAPL)' },
      { key: 'shares', placeholder: 'Number of shares', numeric: true },
      { key: 'price', placeholder: 'Current price per share ($)', numeric: true },
      { key: 'costBasis', placeholder: 'Total cost basis ($)', numeric: true },
    ],
  },
  {
    id: 'crypto',
    label: 'Crypto',
    image: require('../assets/icons/crypto.png'),
    color: '#f97316',
    fields: [
      { key: 'name', placeholder: 'Coin name (e.g. Bitcoin, Ethereum)' },
      { key: 'ticker', placeholder: 'Symbol (e.g. BTC, ETH)' },
      { key: 'units', placeholder: 'Amount held (e.g. 1.5)', numeric: true },
      { key: 'price', placeholder: 'Current price per coin ($)', numeric: true },
      { key: 'costBasis', placeholder: 'Total cost basis ($)', numeric: true },
    ],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    image: require('../assets/icons/realestate.png'),
    color: '#0ea5e9',
    fields: [
      { key: 'name', placeholder: 'Property name (e.g. Rental Apartment)' },
      { key: 'address', placeholder: 'Address (optional)' },
      { key: 'value', placeholder: 'Estimated value ($)', numeric: true },
      { key: 'costBasis', placeholder: 'Purchase price ($)', numeric: true },
    ],
  },
  {
    id: 'cash',
    label: 'Cash & Savings',
    image: require('../assets/icons/cash.png'),
    color: '#eab308',
    fields: [
      { key: 'name', placeholder: 'Account name (e.g. High Yield Savings)' },
      { key: 'bank', placeholder: 'Bank name (e.g. Marcus)' },
      { key: 'balance', placeholder: 'Current balance ($)', numeric: true },
      { key: 'apy', placeholder: 'APY % (e.g. 4.6)', numeric: true },
    ],
  },
  {
    id: 'commodities',
    label: 'Commodities',
    image: require('../assets/icons/commodities.png'),
    color: '#64748b',
    fields: [
      { key: 'name', placeholder: 'What is it? (e.g. Gold, Silver)' },
      { key: 'units', placeholder: 'How many units? (e.g. 3.2 oz)', numeric: true },
      { key: 'price', placeholder: 'Current price per unit ($)', numeric: true },
      { key: 'costBasis', placeholder: 'Total cost basis ($)', numeric: true },
    ],
  },
  {
    id: 'other',
    label: 'Other Assets',
    image: require('../assets/icons/other.png'),
    color: '#8b5cf6',
    fields: [
      { key: 'name', placeholder: 'What is it? (e.g. Rolex, Art, Vehicle)' },
      { key: 'value', placeholder: 'Estimated value ($)', numeric: true },
      { key: 'costBasis', placeholder: 'Purchase price ($)', numeric: true },
    ],
  },
];

const QUANTITY_LABELS: Record<string, { question: string; unit: string; isDollar?: boolean }> = {
  stocks: { question: 'How many shares?', unit: 'shares' },
  crypto: { question: 'How many coins/tokens?', unit: 'coins' },
  realestate: { question: "What's the estimated value?", unit: '', isDollar: true },
  cash: { question: "What's the current balance?", unit: '', isDollar: true },
  commodities: { question: 'How many units?', unit: 'oz / units' },
  other: { question: "What's the estimated value?", unit: '', isDollar: true },
};

const COST_LABELS: Record<string, { question: string; summary: string; skip: string }> = {
  stocks: { question: 'What did you pay in total?', summary: 'Total cost', skip: "I don't remember" },
  crypto: { question: 'What did you pay in total?', summary: 'Total cost', skip: "I don't remember" },
  realestate: { question: 'What did you pay for it?', summary: 'Purchase price', skip: "I don't remember" },
  cash: { question: 'How much did you originally deposit?', summary: 'Total deposited', skip: 'Skip for now' },
  commodities: { question: 'What did you pay in total?', summary: 'Total cost', skip: "I don't remember" },
  other: { question: 'What did you pay for it?', summary: 'Original cost', skip: "I don't remember" },
};

const LOCATION_CHIPS: Record<string, string[]> = {
  stocks: ['Robinhood', 'Fidelity', 'Schwab', 'E*TRADE', 'Vanguard', 'TD Ameritrade'],
  crypto: ['Coinbase', 'Kraken', 'Binance', 'Gemini', 'Ledger', 'MetaMask'],
  realestate: ['Personal', 'LLC', 'Trust', 'Partnership'],
  cash: ['Chase', 'Bank of America', 'Wells Fargo', 'Capital One', 'Marcus', 'Ally'],
  commodities: ['Safe deposit box', 'Home safe', 'Fidelity', 'Vanguard', 'JM Bullion'],
  other: ['Home', 'Safe deposit box', 'Storage unit', 'Other'],
};

const SUGGESTION_CHIPS: Record<string, string[]> = {
  stocks: ['Apple', 'Tesla', 'QQQ', 'VOO', 'S&P 500'],
  crypto: ['Bitcoin', 'Ethereum', 'Solana', 'XRP'],
  realestate: ['Rental Property', 'Primary Home', 'Vacation Home'],
  cash: ['High Yield Savings', 'Checking', 'Money Market'],
  commodities: ['Gold', 'Silver', 'Platinum'],
  other: ['Rolex', 'Art', 'Vehicle', 'Collectibles'],
};

// Ticker mappings for logo lookups
const STOCK_TICKERS: Record<string, string> = {
  'Apple': 'AAPL', 'Tesla': 'TSLA', 'QQQ': 'QQQ', 'VOO': 'VOO',
  'S&P 500': 'SPY', 'Amazon': 'AMZN', 'Google': 'GOOGL', 'Microsoft': 'MSFT',
  'Meta': 'META', 'Netflix': 'NFLX', 'Nvidia': 'NVDA', 'AMD': 'AMD',
};

const CRYPTO_IDS: Record<string, string> = {
  'Bitcoin': 'bitcoin', 'Ethereum': 'ethereum', 'Solana': 'solana', 'XRP': 'ripple',
  'Dogecoin': 'dogecoin', 'Cardano': 'cardano', 'Polkadot': 'polkadot',
  'Litecoin': 'litecoin', 'Chainlink': 'chainlink', 'Avalanche': 'avalanche-2',
};

const getAssetLogoUrl = (categoryId: string, name: string): string | null => {
  if (categoryId === 'stocks') {
    const ticker = STOCK_TICKERS[name] || name.toUpperCase();
    return `https://financialmodelingprep.com/image-stock/${ticker}.png`;
  }
  if (categoryId === 'crypto') {
    const id = CRYPTO_IDS[name];
    if (id) return `https://coin-images.coingecko.com/coins/images/${
      id === 'bitcoin' ? '1/large/bitcoin.png' :
      id === 'ethereum' ? '279/large/ethereum.png' :
      id === 'solana' ? '4128/large/solana.png' :
      id === 'ripple' ? '44/large/xrp-symbol-white-128.png' :
      id === 'dogecoin' ? '5/large/dogecoin.png' :
      id === 'cardano' ? '975/large/cardano.png' :
      id === 'polkadot' ? '12171/large/polkadot.png' :
      id === 'litecoin' ? '2/large/litecoin.png' :
      id === 'chainlink' ? '877/large/chainlink-new-logo.png' :
      id === 'avalanche-2' ? '12559/large/Avalanche_Circle_RedWhite_Trans.png' :
      ''
    }`;
    return null;
  }
  return null;
};

const formatPadAmount = (raw: string): string => {
  if (!raw || raw === '0') return '$0';
  const dotIndex = raw.indexOf('.');
  let intPart: string;
  let decPart: string | null = null;
  if (dotIndex >= 0) {
    intPart = raw.slice(0, dotIndex) || '0';
    decPart = raw.slice(dotIndex + 1);
  } else {
    intPart = raw;
  }
  // Add commas
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decPart !== null) {
    return `$${formatted}.${decPart}`;
  }
  return `$${formatted}`;
};

const formatQuantity = (raw: string): string => {
  if (!raw || raw === '0') return '0';
  const dotIndex = raw.indexOf('.');
  let intPart: string;
  let decPart: string | null = null;
  if (dotIndex >= 0) {
    intPart = raw.slice(0, dotIndex) || '0';
    decPart = raw.slice(dotIndex + 1);
  } else {
    intPart = raw;
  }
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decPart !== null) {
    return `${formatted}.${decPart}`;
  }
  return formatted;
};

// Simulated accounts found after Plaid login
const FAKE_ACCOUNTS = [
  { id: '1', name: 'Total Checking', ending: '4219', balance: '$16,830.42', type: 'Depository', checked: true },
  { id: '2', name: 'Premier Savings', ending: '7832', balance: '$52,150.00', type: 'Depository', checked: true },
  { id: '3', name: 'Sapphire Reserve', ending: '1094', balance: '$2,340.18', type: 'Credit Card', checked: false },
];

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('choose');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ManualCategory | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [manualName, setManualName] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualApy, setManualApy] = useState('');
  const [manualCost, setManualCost] = useState('');
  const [accounts, setAccounts] = useState(FAKE_ACCOUNTS.map((a) => ({ ...a })));
  const [newNetWorth, setNewNetWorth] = useState<number | null>(null);

  // Plaid login fields (pre-populated for demo)
  const [username, setUsername] = useState('demo_user@vizzy.com');
  const [password, setPassword] = useState('VizzyDemo2025!');

  const filteredInstitutions = searchQuery.length > 0
    ? PLAID_INSTITUTIONS.filter((inst) =>
        inst.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : PLAID_INSTITUTIONS;

  const handleBack = () => {
    switch (step) {
      case 'choose': router.back(); break;
      case 'plaid-intro': setStep('choose'); break;
      case 'plaid-select': setStep('plaid-intro'); break;
      case 'plaid-auth-info': setStep('plaid-select'); break;
      case 'plaid-login': setStep('plaid-auth-info'); break;
      case 'plaid-accounts': setStep('plaid-login'); break;
      case 'manual-categories': setStep('choose'); break;
      case 'manual-name': setStep('manual-categories'); break;
      case 'manual-value': setStep('manual-name'); break;
      case 'manual-location': setStep('manual-value'); break;
      case 'manual-apy': setStep('manual-location'); break;
      case 'manual-cost': setStep(selectedCategory?.id === 'cash' ? 'manual-apy' : 'manual-location'); break;
      default: router.back();
    }
  };

  const handleSelectInstitution = (inst: Institution) => {
    setSelectedInstitution(inst);
    setStep('plaid-auth-info');
  };

  const handlePlaidLogin = () => {
    setStep('plaid-accounts');
    setAccounts(FAKE_ACCOUNTS.map((a) => ({ ...a })));
  };

  const toggleAccount = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, checked: !a.checked } : a))
    );
  };

  const handleAuthorize = () => {
    setStep('plaid-authorizing');
    setTimeout(() => setStep('plaid-success'), 2000);
  };

  const buildAndSaveHolding = async () => {
    if (!selectedCategory) return;
    const catId = selectedCategory.id;
    const isDollarCat = ['cash', 'realestate', 'other'].includes(catId);
    const shares = isDollarCat ? 1 : (parseFloat(manualAmount) || 1);
    const costBasis = parseFloat(manualCost) || 0;

    // Determine price and total value based on category
    let price: number;
    let totalValue: number;
    let ticker: string;
    let category: string;
    let emoji: string;
    let iconColor: string;
    let color: string;

    switch (catId) {
      case 'stocks': {
        const t = STOCK_TICKERS[manualName] || manualName.toUpperCase();
        ticker = t;
        category = 'Stock';
        price = costBasis > 0 && shares > 0 ? costBasis / shares : 0;
        totalValue = shares * price;
        emoji = '📈';
        iconColor = '#007AFF';
        color = '#E3F2FD';
        break;
      }
      case 'crypto': {
        ticker = manualName.substring(0, 5).toUpperCase();
        if (CRYPTO_IDS[manualName]) {
          const knownTickers: Record<string, string> = {
            Bitcoin: 'BTC', Ethereum: 'ETH', Solana: 'SOL', XRP: 'XRP',
            Dogecoin: 'DOGE', Cardano: 'ADA', Polkadot: 'DOT',
          };
          ticker = knownTickers[manualName] || ticker;
        }
        category = 'Crypto';
        price = costBasis > 0 && shares > 0 ? costBasis / shares : 0;
        totalValue = shares * price;
        emoji = '₿';
        iconColor = '#F7931A';
        color = '#FFF8E1';
        break;
      }
      case 'realestate':
        ticker = 'Real Estate';
        category = manualLocation || 'Property';
        // manualAmount is the estimated value (dollar amount)
        price = parseFloat(manualAmount) || 0;
        totalValue = price;
        emoji = '🏘️';
        iconColor = '#AF52DE';
        color = '#F3E5F5';
        break;
      case 'cash':
        ticker = 'Cash';
        category = manualApy ? `${manualApy}% APY` : '0.01%';
        // manualAmount is the current balance (dollar amount)
        price = parseFloat(manualAmount) || 0;
        totalValue = price;
        emoji = '🏦';
        iconColor = '#34C759';
        color = '#E8F5E9';
        break;
      case 'commodities':
        ticker = manualName === 'Gold' ? 'XAU' : manualName === 'Silver' ? 'XAG' : 'Commodity';
        category = 'Precious Metal';
        price = costBasis > 0 && shares > 0 ? costBasis / shares : 0;
        totalValue = shares * price;
        emoji = '🥇';
        iconColor = '#D4A017';
        color = '#FFF8E1';
        break;
      default:
        ticker = manualName;
        category = 'Other';
        // manualAmount is the estimated value (dollar amount)
        price = parseFloat(manualAmount) || 0;
        totalValue = price;
        emoji = '💎';
        iconColor = '#8b5cf6';
        color = '#F3E5F5';
    }

    const holding: Holding = {
      id: `manual-${Date.now()}`,
      name: manualName,
      ticker,
      category,
      emoji,
      iconColor,
      color,
      shares,
      price,
      totalValue,
      costBasis: costBasis || totalValue,
      changePercent: 0,
      vizzyComment: 'Just added! Vizzy will analyze this soon.',
      platform: manualLocation || 'Manual',
      platformUrl: '',
      roi24m: costBasis > 0 && totalValue > costBasis
        ? ((totalValue - costBasis) / costBasis) * 100
        : 0,
      logoUrl: getAssetLogoUrl(catId, manualName) || undefined,
    };

    await addHoldingToPortfolio(holding);
  };

  const handleManualSubmit = async () => {
    await buildAndSaveHolding();
    setNewNetWorth(getTotalValue());
    setStep('manual-success');
  };

  const handleDone = () => {
    router.back();
  };

  const updateFormValue = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handlePadPress = (
    key: string,
    current: string,
    setter: (v: string) => void,
  ) => {
    if (key === '⌫') {
      setter(current.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (current.includes('.')) return;
      setter(current.length === 0 ? '0.' : current + '.');
      return;
    }
    // Max 10 digits before decimal, 2 after
    const dotIdx = current.indexOf('.');
    if (dotIdx >= 0) {
      if (current.length - dotIdx > 2) return;
    } else {
      const digits = current.replace('.', '');
      if (digits.length >= 10) return;
    }
    // Don't allow leading zeros
    if (current === '0' && key !== '.') {
      setter(key);
      return;
    }
    setter(current + key);
  };

  // Show back/close based on step
  const showNav = step !== 'plaid-authorizing' && step !== 'plaid-success' && step !== 'manual-success';
  const showClose = step !== 'plaid-authorizing';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Navigation bar */}
      {showNav && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={handleBack}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={{ padding: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color="#4A90D9" />
          </Pressable>
          {showClose && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              style={{ padding: 8 }}
            >
              <Ionicons name="close" size={24} color="#4A90D9" />
            </Pressable>
          )}
        </View>
      )}

      {/* Non-nav header space for success/loading screens */}
      {!showNav && <View style={{ height: insets.top + 16 }} />}

      {/* ═══════════════════════════════════════ */}
      {/* STEP: Choose — Plaid or Manual */}
      {/* ═══════════════════════════════════════ */}
      {step === 'choose' && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center' }}>
            {/* App + Plaid overlapping icons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#FF8C42',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '800' }}>V</Text>
              </View>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#1A1A1A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: -12,
                  zIndex: 1,
                }}
              >
                <Ionicons name="grid" size={22} color="#FFFFFF" />
              </View>
            </View>

            <Text style={{ fontSize: 24, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 }}>
              Connect your accounts
            </Text>
            <Text style={{ fontSize: 15, color: '#888888', textAlign: 'center', marginBottom: 40, lineHeight: 22 }}>
              Choose how you want to add your assets to Vizzy
            </Text>
          </Animated.View>

          {/* Option 1: Plaid */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Pressable
              onPress={() => setStep('plaid-intro')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#F5F5F5' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: '#E8E8E8',
                borderRadius: 16,
                padding: 20,
                marginBottom: 14,
                borderCurve: 'continuous' as const,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#1A1A1A',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="link" size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#1A1A1A', marginBottom: 3 }}>
                    Connect via Plaid
                  </Text>
                  <Text style={{ fontSize: 13, color: '#888888', lineHeight: 18 }}>
                    Securely link your bank, brokerage, or exchange
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
              </View>
            </Pressable>
          </Animated.View>

          {/* Option 2: Manual */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Pressable
              onPress={() => setStep('manual-categories')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#F5F5F5' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: '#E8E8E8',
                borderRadius: 16,
                padding: 20,
                borderCurve: 'continuous' as const,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#FF8C42',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="create" size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#1A1A1A', marginBottom: 3 }}>
                    Add manually
                  </Text>
                  <Text style={{ fontSize: 13, color: '#888888', lineHeight: 18 }}>
                    Stocks, real estate, gold, crypto, and more
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* PLAID STEP 1: Intro */}
      {/* ═══════════════════════════════════════ */}
      {step === 'plaid-intro' && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
              {/* App + Plaid icons */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#FF8C42',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '800' }}>V</Text>
                </View>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#1A1A1A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: -12,
                    zIndex: 1,
                  }}
                >
                  <Ionicons name="grid" size={22} color="#FFFFFF" />
                </View>
              </View>

              <Text style={{ fontSize: 24, fontWeight: '500', color: '#1A1A1A', marginBottom: 32, lineHeight: 32 }}>
                Vizzy uses <Text style={{ fontWeight: '700' }}>Plaid</Text> to connect your bank
              </Text>

              {/* Bullet 1 */}
              <View style={{ flexDirection: 'row', gap: 14, marginBottom: 24 }}>
                <Ionicons name="link-outline" size={22} color="#1A1A1A" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 }}>
                    Connect effortlessly
                  </Text>
                  <Text style={{ fontSize: 14, color: '#888888', lineHeight: 20 }}>
                    Plaid lets you securely connect your financial accounts in seconds
                  </Text>
                </View>
              </View>

              {/* Bullet 2 */}
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <Ionicons name="eye-off-outline" size={22} color="#1A1A1A" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 }}>
                    Your data belongs to you
                  </Text>
                  <Text style={{ fontSize: 14, color: '#888888', lineHeight: 20 }}>
                    Plaid doesn't sell personal info, and will only use it with your permission
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Bottom */}
          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
            <Text style={{ fontSize: 12, color: '#BBBBBB', textAlign: 'center', marginBottom: 14, lineHeight: 17 }}>
              By selecting "Continue" you agree to the{'\n'}
              <Text
                style={{ textDecorationLine: 'underline', color: '#999999' }}
                onPress={() => Linking.openURL('https://plaid.com/legal/#consumers')}
              >Plaid End User Privacy Policy</Text>
            </Text>
            <Pressable
              onPress={() => setStep('plaid-select')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#333333' : '#1A1A1A',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* PLAID STEP 2: Select your bank */}
      {/* ═══════════════════════════════════════ */}
      {step === 'plaid-select' && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 }}>
              Select your bank
            </Text>

            {/* Search */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E0E0E0',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 24,
                gap: 10,
              }}
            >
              <Ionicons name="search" size={18} color="#999999" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search"
                placeholderTextColor="#BBBBBB"
                style={{ flex: 1, fontSize: 16, color: '#1A1A1A' }}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#CCCCCC" />
                </Pressable>
              )}
            </View>

            {/* Bank list */}
            {filteredInstitutions.map((inst, i) => (
              <Pressable
                key={inst.id}
                onPress={() => handleSelectInstitution(inst)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0F0F0',
                  opacity: pressed ? 0.6 : 1,
                  gap: 14,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#F5F5F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={LOGOS[inst.id]}
                    style={{ width: 28, height: 28 }}
                    contentFit="contain"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#1A1A1A' }}>
                    {inst.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#BBBBBB' }}>{inst.url}</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* PLAID STEP 3: Authenticate info */}
      {/* ═══════════════════════════════════════ */}
      {step === 'plaid-auth-info' && selectedInstitution && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
              {/* Plaid + Bank overlapping icons */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#1A1A1A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <Ionicons name="grid" size={20} color="#FFFFFF" />
                </View>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#F5F5F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: -10,
                    zIndex: 1,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={LOGOS[selectedInstitution.id]}
                    style={{ width: 32, height: 32 }}
                    contentFit="contain"
                  />
                </View>
              </View>

              <Text style={{ fontSize: 24, fontWeight: '600', color: '#1A1A1A', marginBottom: 28, lineHeight: 32 }}>
                Authenticate with {selectedInstitution.name}
              </Text>

              {/* Numbered steps */}
              {[
                `After you select Continue, you'll be taken to ${selectedInstitution.name}`,
                `Authenticate with ${selectedInstitution.name}`,
                "You'll be directed back to Vizzy",
              ].map((text, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 14, marginBottom: 20 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A', width: 20 }}>
                    {i + 1}.
                  </Text>
                  <Text style={{ fontSize: 15, color: '#888888', flex: 1, lineHeight: 22 }}>
                    {text}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </ScrollView>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={() => setStep('plaid-login')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#333333' : '#1A1A1A',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* PLAID STEP 4: Bank login (simulated) */}
      {/* ═══════════════════════════════════════ */}
      {step === 'plaid-login' && selectedInstitution && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeIn.duration(400)}>
              {/* Bank header */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: '#F5F5F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={LOGOS[selectedInstitution.id]}
                    style={{ width: 40, height: 40 }}
                    contentFit="contain"
                  />
                </View>
              </View>

              {/* Simulated bank login card */}
              <View
                style={{
                  backgroundColor: '#F8F8F8',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', marginBottom: 24 }}>
                  Sign in to your account
                </Text>

                <Text style={{ fontSize: 13, color: '#888888', marginBottom: 6 }}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder=""
                  autoCapitalize="none"
                  style={{
                    fontSize: 16,
                    color: '#1A1A1A',
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 16,
                    backgroundColor: '#FFFFFF',
                  }}
                />

                <Text style={{ fontSize: 13, color: '#888888', marginBottom: 6 }}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={{
                    fontSize: 16,
                    color: '#1A1A1A',
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 24,
                    backgroundColor: '#FFFFFF',
                  }}
                />

                <Pressable
                  onPress={handlePlaidLogin}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#3A7A3A' : '#4A8C4A',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Sign in</Text>
                </Pressable>

                <Text style={{ fontSize: 13, color: '#4A90D9', textAlign: 'center', marginTop: 16 }}>
                  Forgot username or password?
                </Text>
              </View>

              {/* RevenueCat demo note */}
              <View
                style={{
                  backgroundColor: '#FFF8F0',
                  borderWidth: 1,
                  borderColor: '#FFD9B3',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: '#996633', lineHeight: 19, textAlign: 'center' }}>
                  Dear RevenueCat team, we have already done tests with real Plaid integrations so we can go live.
                  Just click <Text style={{ fontWeight: '700' }}>Sign in</Text> for the demo.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* PLAID STEP 5: Select accounts */}
      {/* ═══════════════════════════════════════ */}
      {step === 'plaid-accounts' && selectedInstitution && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(400)}>
              {/* Bank logo at top */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#F5F5F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={LOGOS[selectedInstitution.id]}
                    style={{ width: 36, height: 36 }}
                    contentFit="contain"
                  />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A' }}>
                  {selectedInstitution.name}
                </Text>
              </View>

              <Text style={{ fontSize: 20, fontWeight: '500', color: '#1A1A1A', marginBottom: 6 }}>
                Vizzy would like to access your account information
              </Text>
              <View
                style={{
                  backgroundColor: '#F5F5F5',
                  borderLeftWidth: 3,
                  borderLeftColor: '#CCCCCC',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginTop: 12,
                  marginBottom: 28,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 13, color: '#888888', lineHeight: 19 }}>
                  {selectedInstitution.name} will share your data with our trusted partner{' '}
                  <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>Plaid</Text>. Vizzy will retrieve your data from Plaid.
                </Text>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 }}>
                Select account(s) to share
              </Text>

              {accounts.map((acct) => (
                <Pressable
                  key={acct.id}
                  onPress={() => toggleAccount(acct.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: acct.checked ? '#4A90D9' : '#E0E0E0',
                    borderRadius: 14,
                    padding: 18,
                    marginBottom: 12,
                    gap: 14,
                    backgroundColor: acct.checked ? 'rgba(74, 144, 217, 0.05)' : '#FFFFFF',
                    borderCurve: 'continuous' as const,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: acct.checked ? '#4A90D9' : '#CCCCCC',
                      backgroundColor: acct.checked ? '#4A90D9' : '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {acct.checked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 3 }}>
                      {acct.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#999999' }}>
                      {acct.type} ····{acct.ending}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                    {acct.balance}
                  </Text>
                </Pressable>
              ))}

              <Text style={{ fontSize: 12, color: '#BBBBBB', lineHeight: 17, marginTop: 20, marginBottom: 8 }}>
                By clicking Authorize below, I have agreed to the{' '}
                <Text style={{ color: '#4A90D9', textDecorationLine: 'underline' }}>Terms & Conditions</Text>
                {' '}and I am specifically directing {selectedInstitution.name} to send my account information to Vizzy via Plaid.
              </Text>
            </Animated.View>
          </ScrollView>

          <View style={{ flexDirection: 'row', paddingHorizontal: 24, gap: 12, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? '#E8E8E8' : '#F0F0F0',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#666666' }}>Decline</Text>
            </Pressable>
            <Pressable
              onPress={handleAuthorize}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? '#333333' : '#1A1A1A',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Authorize</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* PLAID STEP 6: Authorizing... */}
      {/* ═══════════════════════════════════════ */}
      {step === 'plaid-authorizing' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 16,
              paddingHorizontal: 32,
              paddingVertical: 18,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>Authorizing...</Text>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* PLAID STEP 7: Success */}
      {/* ═══════════════════════════════════════ */}
      {step === 'plaid-success' && (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
            <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(52, 199, 89, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Ionicons name="checkmark" size={40} color="#34C759" />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 }}>
                Success
              </Text>
              <Text style={{ fontSize: 15, color: '#888888', textAlign: 'center', lineHeight: 22 }}>
                Your account has been successfully linked to Vizzy
              </Text>
            </Animated.View>
          </View>
          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={handleDone}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#333333' : '#1A1A1A',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MANUAL STEP 1: Category Grid (2-column) */}
      {/* ═══════════════════════════════════════ */}
      {step === 'manual-categories' && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 }}>
              What do you want to add?
            </Text>
            <Text style={{ fontSize: 15, color: '#888888', marginBottom: 28 }}>
              Choose the type of asset
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {MANUAL_CATEGORIES.map((cat, i) => (
                <Animated.View
                  key={cat.id}
                  entering={FadeInDown.delay(i * 60).duration(350)}
                  style={{ width: '47%' }}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedCategory(cat);
                      setManualName('');
                      setManualAmount('');
                      setManualLocation('');
                      setManualApy('');
                      setManualCost('');
                      setStep('manual-name');
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: cat.color,
                      borderRadius: 20,
                      paddingVertical: 28,
                      paddingHorizontal: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      borderCurve: 'continuous' as const,
                    })}
                  >
                    <View style={{ width: 56, height: 56, borderRadius: 16, borderCurve: 'continuous' as const, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Image source={cat.image} style={{ width: 44, height: 44 }} contentFit="contain" />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MANUAL STEP 2: Name Input + Chips */}
      {/* ═══════════════════════════════════════ */}
      {step === 'manual-name' && selectedCategory && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            <Animated.View entering={FadeIn.duration(400)}>
              {/* Category pill */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  backgroundColor: selectedCategory.color + '18',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  gap: 6,
                  marginBottom: 32,
                }}
              >
                <Image source={selectedCategory.image} style={{ width: 20, height: 20 }} contentFit="contain" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: selectedCategory.color }}>
                  {selectedCategory.label}
                </Text>
              </View>

              <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 28 }}>
                What's it called?
              </Text>

              <TextInput
                value={manualName}
                onChangeText={setManualName}
                placeholder="Enter name"
                placeholderTextColor="#CCCCCC"
                autoFocus
                style={{
                  fontSize: 24,
                  fontWeight: '500',
                  color: '#1A1A1A',
                  borderBottomWidth: 2,
                  borderBottomColor: manualName.length > 0 ? '#1A1A1A' : '#E0E0E0',
                  paddingBottom: 12,
                  marginBottom: 28,
                }}
              />

              {/* Logo preview when a recognized asset is typed */}
              {getAssetLogoUrl(selectedCategory.id, manualName) && manualName.length > 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#F5F5F5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={{ uri: getAssetLogoUrl(selectedCategory.id, manualName)! }}
                      style={{ width: 40, height: 40 }}
                      contentFit="contain"
                    />
                  </View>
                </Animated.View>
              )}

              {/* Suggestion chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {(SUGGESTION_CHIPS[selectedCategory.id] || []).map((chip) => {
                  const chipLogo = getAssetLogoUrl(selectedCategory.id, chip);
                  return (
                    <Pressable
                      key={chip}
                      onPress={() => setManualName(chip)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: manualName === chip ? '#1A1A1A' : '#F3F3F3',
                        borderRadius: 20,
                        paddingHorizontal: chipLogo ? 10 : 16,
                        paddingVertical: 10,
                        gap: 8,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      {chipLogo && (
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: '#FFFFFF',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <Image
                            source={{ uri: chipLogo }}
                            style={{ width: 16, height: 16 }}
                            contentFit="contain"
                          />
                        </View>
                      )}
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: manualName === chip ? '#FFFFFF' : '#555555',
                        }}
                      >
                        {chip}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={() => setStep('manual-value')}
              disabled={manualName.length === 0}
              style={({ pressed }) => ({
                backgroundColor: manualName.length > 0
                  ? (pressed ? '#333333' : '#1A1A1A')
                  : '#E0E0E0',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MANUAL STEP 3: Quantity — Number Pad */}
      {/* ═══════════════════════════════════════ */}
      {step === 'manual-value' && selectedCategory && (() => {
        const qLabel = QUANTITY_LABELS[selectedCategory.id];
        const isDollar = qLabel?.isDollar ?? false;
        return (
        <View style={{ flex: 1 }}>
          <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#888888', marginBottom: 12 }}>
              {qLabel?.question || 'How many?'}
            </Text>
            <Text
              style={{
                fontSize: 48,
                fontWeight: '700',
                color: manualAmount.length > 0 ? '#1A1A1A' : '#CCCCCC',
                letterSpacing: -1,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {isDollar ? formatPadAmount(manualAmount) : formatQuantity(manualAmount)}
            </Text>
            {!isDollar && manualAmount.length > 0 && manualAmount !== '0' && (
              <Text style={{ fontSize: 14, color: '#AAAAAA', marginTop: 6 }}>
                {qLabel?.unit || 'items'}
              </Text>
            )}
          </Animated.View>

          {/* Number pad */}
          <View style={{ paddingHorizontal: 40, paddingBottom: 12 }}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['.', '0', '⌫'],
            ].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
                {row.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => handlePadPress(k, manualAmount, setManualAmount)}
                    style={({ pressed }) => ({
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: pressed ? '#F0F0F0' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    {k === '⌫' ? (
                      <Ionicons name="backspace-outline" size={26} color="#1A1A1A" />
                    ) : (
                      <Text style={{ fontSize: 28, fontWeight: '500', color: '#1A1A1A' }}>{k}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={() => setStep('manual-location')}
              disabled={manualAmount.length === 0 || manualAmount === '0'}
              style={({ pressed }) => ({
                backgroundColor: (manualAmount.length > 0 && manualAmount !== '0')
                  ? (pressed ? '#333333' : '#1A1A1A')
                  : '#E0E0E0',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue</Text>
            </Pressable>
          </View>
        </View>
        );
      })()}

      {/* ═══════════════════════════════════════ */}
      {/* MANUAL STEP 4: Location */}
      {/* ═══════════════════════════════════════ */}
      {step === 'manual-location' && selectedCategory && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            <Animated.View entering={FadeIn.duration(400)}>
              {/* Category pill */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  backgroundColor: selectedCategory.color + '18',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  gap: 6,
                  marginBottom: 32,
                }}
              >
                <Image source={selectedCategory.image} style={{ width: 20, height: 20 }} contentFit="contain" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: selectedCategory.color }}>
                  {manualName}
                </Text>
              </View>

              <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 28 }}>
                Where is it held?
              </Text>

              <TextInput
                value={manualLocation}
                onChangeText={setManualLocation}
                placeholder="Broker, bank, wallet..."
                placeholderTextColor="#CCCCCC"
                autoFocus
                style={{
                  fontSize: 24,
                  fontWeight: '500',
                  color: '#1A1A1A',
                  borderBottomWidth: 2,
                  borderBottomColor: manualLocation.length > 0 ? '#1A1A1A' : '#E0E0E0',
                  paddingBottom: 12,
                  marginBottom: 28,
                }}
              />

              {/* Location chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {(LOCATION_CHIPS[selectedCategory.id] || []).map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => setManualLocation(chip)}
                    style={({ pressed }) => ({
                      backgroundColor: manualLocation === chip ? '#1A1A1A' : '#F3F3F3',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: manualLocation === chip ? '#FFFFFF' : '#555555',
                      }}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={() => setStep(selectedCategory?.id === 'cash' ? 'manual-apy' : 'manual-cost')}
              disabled={manualLocation.length === 0}
              style={({ pressed }) => ({
                backgroundColor: manualLocation.length > 0
                  ? (pressed ? '#333333' : '#1A1A1A')
                  : '#E0E0E0',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MANUAL STEP 4b: APY — Cash only */}
      {/* ═══════════════════════════════════════ */}
      {step === 'manual-apy' && (
        <View style={{ flex: 1 }}>
          <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#888888', marginBottom: 12 }}>
              Annual interest rate (APY)
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: '700',
                  color: manualApy.length > 0 ? '#1A1A1A' : '#CCCCCC',
                  letterSpacing: -1,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {manualApy.length > 0 ? manualApy : '0'}
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '600',
                  color: manualApy.length > 0 ? '#1A1A1A' : '#CCCCCC',
                  marginBottom: 4,
                  marginLeft: 2,
                }}
              >
                %
              </Text>
            </View>
          </Animated.View>

          {/* Number pad */}
          <View style={{ paddingHorizontal: 40, paddingBottom: 12 }}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['.', '0', '⌫'],
            ].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
                {row.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => handlePadPress(k, manualApy, setManualApy)}
                    style={({ pressed }) => ({
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: pressed ? '#F0F0F0' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    {k === '⌫' ? (
                      <Ionicons name="backspace-outline" size={26} color="#1A1A1A" />
                    ) : (
                      <Text style={{ fontSize: 28, fontWeight: '500', color: '#1A1A1A' }}>{k}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={() => setStep('manual-cost')}
              disabled={manualApy.length === 0 || manualApy === '0'}
              style={({ pressed }) => ({
                backgroundColor: (manualApy.length > 0 && manualApy !== '0')
                  ? (pressed ? '#333333' : '#1A1A1A')
                  : '#E0E0E0',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setManualApy('');
                setStep('manual-cost');
              }}
              style={{ alignItems: 'center', marginTop: 14 }}
            >
              <Text style={{ fontSize: 15, color: '#888888' }}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MANUAL STEP 5: Cost Basis — Number Pad */}
      {/* ═══════════════════════════════════════ */}
      {step === 'manual-cost' && selectedCategory && (
        <View style={{ flex: 1 }}>
          <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#888888', marginBottom: 12 }}>
              {COST_LABELS[selectedCategory.id]?.question || 'What did you pay for it?'}
            </Text>
            <Text
              style={{
                fontSize: 48,
                fontWeight: '700',
                color: manualCost.length > 0 ? '#1A1A1A' : '#CCCCCC',
                letterSpacing: -1,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPadAmount(manualCost)}
            </Text>
          </Animated.View>

          {/* Number pad */}
          <View style={{ paddingHorizontal: 40, paddingBottom: 12 }}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['.', '0', '⌫'],
            ].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
                {row.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => handlePadPress(k, manualCost, setManualCost)}
                    style={({ pressed }) => ({
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: pressed ? '#F0F0F0' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    {k === '⌫' ? (
                      <Ionicons name="backspace-outline" size={26} color="#1A1A1A" />
                    ) : (
                      <Text style={{ fontSize: 28, fontWeight: '500', color: '#1A1A1A' }}>{k}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={handleManualSubmit}
              disabled={manualCost.length === 0 || manualCost === '0'}
              style={({ pressed }) => ({
                backgroundColor: (manualCost.length > 0 && manualCost !== '0')
                  ? (pressed ? '#333333' : '#1A1A1A')
                  : '#E0E0E0',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Continue</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setManualCost('');
                handleManualSubmit();
              }}
              style={{ alignItems: 'center', marginTop: 14 }}
            >
              <Text style={{ fontSize: 15, color: '#888888' }}>
                {COST_LABELS[selectedCategory?.id || '']?.skip || "I don't remember"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MANUAL STEP 5: Success + Summary */}
      {/* ═══════════════════════════════════════ */}
      {step === 'manual-success' && selectedCategory && (
        <View style={{ flex: 1 }}>
          <Animated.View
            entering={FadeIn.duration(400)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
          >
            {/* Celebrating fox mascot */}
            <Image
              source={require('../assets/foxcelebrating.jpg')}
              style={{ width: 200, height: 200, marginBottom: 12 }}
              contentFit="contain"
            />
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 24 }}>
              Asset added!
            </Text>

            {/* Summary card */}
            <View
              style={{
                width: '100%',
                backgroundColor: '#F8F8F8',
                borderRadius: 20,
                padding: 24,
                borderCurve: 'continuous' as const,
              }}
            >
              {/* Name row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                {getAssetLogoUrl(selectedCategory.id, manualName) ? (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#F0F0F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={{ uri: getAssetLogoUrl(selectedCategory.id, manualName)! }}
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: selectedCategory.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image source={selectedCategory.image} style={{ width: 28, height: 28 }} contentFit="contain" />
                  </View>
                )}
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>{manualName}</Text>
                  <Text style={{ fontSize: 13, color: '#888888' }}>{selectedCategory.label}</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#E8E8E8', marginBottom: 16 }} />

              {/* Quantity or Value */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 15, color: '#888888' }}>
                  {QUANTITY_LABELS[selectedCategory.id]?.isDollar ? 'Value' : 'Quantity'}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  {QUANTITY_LABELS[selectedCategory.id]?.isDollar
                    ? formatPadAmount(manualAmount)
                    : `${formatQuantity(manualAmount)} ${QUANTITY_LABELS[selectedCategory.id]?.unit || 'items'}`}
                </Text>
              </View>

              {/* Location */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 15, color: '#888888' }}>Held at</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  {manualLocation || '—'}
                </Text>
              </View>

              {/* APY — cash only */}
              {selectedCategory.id === 'cash' && manualApy.length > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 15, color: '#888888' }}>APY</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#34C759' }}>
                    {manualApy}%
                  </Text>
                </View>
              )}

              {/* Cost basis */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, color: '#888888' }}>
                  {COST_LABELS[selectedCategory.id]?.summary || 'Total cost'}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  {manualCost.length > 0 ? formatPadAmount(manualCost) : '—'}
                </Text>
              </View>
            </View>

            {/* Updated Net Worth */}
            {newNetWorth !== null && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={{
                  width: '100%',
                  marginTop: 16,
                  backgroundColor: '#F0FFF0',
                  borderRadius: 16,
                  padding: 18,
                  borderCurve: 'continuous' as any,
                  borderWidth: 1,
                  borderColor: '#D4EDDA',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                  New Net Worth
                </Text>
                <Text style={{ fontSize: 32, fontWeight: '800', color: '#1A1A1A', letterSpacing: -1 }}>
                  {formatCurrency(newNetWorth)}
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, gap: 10 }}>
            <Pressable
              onPress={handleDone}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#333333' : '#1A1A1A',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as const,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>Done</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setManualName('');
                setManualAmount('');
                setManualLocation('');
                setManualApy('');
                setManualCost('');
                setStep('manual-categories');
              }}
              style={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A90D9' }}>Add another asset</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
