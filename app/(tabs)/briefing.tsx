import { View, Text, Pressable, useWindowDimensions, Linking, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import BriefingCard from '../../components/BriefingCard';
import HeaderLogo from '../../components/HeaderLogo';
import { BriefingCardData, generateDailyBriefing } from '../../services/briefing';
import { loadProfile, type InvestorProfile } from '../../services/investorProfile';
import { useProStatus, useRevenueCat, CONSUMABLE_PRODUCTS } from '../../services/revenuecat';
import { loadName } from '../../services/userName';
import { useDayPass, activateDayPass } from '../../services/dayPass';

const FREE_CARD_LIMIT = 2;

// --- Promotions data ---
type PartnerPromo = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  url: string;
};

const HERO_BANNER = {
  headline: 'Earn 5.2% APY',
  subtext: 'High-yield savings with SoFi. FDIC insured, no fees.',
  gradientColors: ['#FF8C42', '#E05A10', '#C23A08'] as [string, string, string],
  ctaLabel: 'Open Account',
  url: 'https://www.sofi.com',
};

const PARTNER_PROMOS: PartnerPromo[] = [
  {
    id: 'coinbase',
    title: 'Earn Crypto',
    subtitle: 'Learn & earn up to $50',
    icon: 'logo-bitcoin',
    iconBg: '#EEE5FF',
    iconColor: '#7B61FF',
    url: 'https://www.coinbase.com/earn',
  },
  {
    id: 'wealthfront',
    title: 'Auto-Invest',
    subtitle: 'Start with just $1',
    icon: 'trending-up',
    iconBg: '#E0F7ED',
    iconColor: '#10B981',
    url: 'https://www.wealthfront.com',
  },
  {
    id: 'robinhood',
    title: 'Free Stock',
    subtitle: 'Get a stock on sign-up',
    icon: 'gift',
    iconBg: '#FFF3E0',
    iconColor: '#FF8C42',
    url: 'https://www.robinhood.com',
  },
  {
    id: 'amex',
    title: 'Cash Back',
    subtitle: '6% on groceries',
    icon: 'card',
    iconBg: '#E3F2FD',
    iconColor: '#1976D2',
    url: 'https://www.americanexpress.com',
  },
];

// --- Formatted date ---
function getFormattedDate(): string {
  const now = new Date();
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// --- Promotions components ---

function HeroBannerCard() {
  return (
    <Pressable
      onPress={() => Linking.openURL(HERO_BANNER.url)}
      style={{ marginHorizontal: 20, marginBottom: 16 }}
    >
      <LinearGradient
        colors={HERO_BANNER.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderCurve: 'continuous',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '800',
                color: '#FFFFFF',
                marginBottom: 3,
              }}
            >
              {HERO_BANNER.headline}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 16,
                marginBottom: 10,
              }}
              numberOfLines={1}
            >
              {HERO_BANNER.subtext}
            </Text>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderCurve: 'continuous',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#E05A10' }}>
                {HERO_BANNER.ctaLabel}
              </Text>
            </View>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function PromoCard({ promo }: { promo: PartnerPromo }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(promo.url)}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: pressed ? '#F8F8F8' : '#FFFFFF',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderCurve: 'continuous',
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: promo.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderCurve: 'continuous',
        }}
      >
        <Ionicons name={promo.icon} size={16} color={promo.iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A1A1A' }} numberOfLines={1}>
          {promo.title}
        </Text>
        <Text style={{ fontSize: 10, color: '#999999' }} numberOfLines={1}>
          {promo.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// --- Investment Profile Card ---
const RISK_EMOJIS: Record<string, string> = {
  Conservative: '🛡️',
  Moderate: '⚖️',
  Growth: '🚀',
  Aggressive: '🔥',
};

function InvestmentProfileCard({ profile }: { profile: InvestorProfile | null }) {
  const title = profile?.title ?? 'Complete Onboarding';
  const subtitle = profile?.subtitle ?? 'Tap to set up your investor profile';
  const riskLabel = profile?.riskLabel ?? '';
  const emoji = RISK_EMOJIS[riskLabel] ?? '🦊';
  const riskLevel = profile?.riskLevel ?? null;

  return (
    <Pressable onPress={() => router.push(profile ? '/(tabs)/ask' : '/onboarding/welcome' as any)} style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderCurve: 'continuous',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#2E7D32', marginBottom: 2 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 11, color: '#558B2F', lineHeight: 15 }} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {riskLevel !== null && (
          <View
            style={{
              backgroundColor: 'rgba(255,140,66,0.15)',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderCurve: 'continuous',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF8C42' }}>{riskLevel}/10</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="rgba(46,125,50,0.3)" />
      </LinearGradient>
    </Pressable>
  );
}

// --- Swipeable Card Wrapper ---
function SwipeableCard({
  card,
  index,
  currentIndex,
  totalCards,
  onSwiped,
}: {
  card: BriefingCardData;
  index: number;
  currentIndex: number;
  totalCards: number;
  onSwiped: (direction: 'left' | 'right') => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  const SWIPE_THRESHOLD = screenWidth * 0.3;

  const handleSwiped = useCallback(
    (direction: 'left' | 'right') => {
      onSwiped(direction);
    },
    [onSwiped]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (index !== currentIndex) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
      rotateZ.value = interpolate(
        event.translationX,
        [-screenWidth, 0, screenWidth],
        [-15, 0, 15],
        Extrapolation.CLAMP
      );
    })
    .onEnd((event) => {
      if (index !== currentIndex) return;

      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        const flyOutX = direction === 'right' ? screenWidth * 1.5 : -screenWidth * 1.5;

        translateX.value = withTiming(flyOutX, { duration: 300 });
        rotateZ.value = withTiming(direction === 'right' ? 30 : -30, { duration: 300 });
        translateY.value = withTiming(-50, { duration: 300 }, () => {
          runOnJS(handleSwiped)(direction);
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        rotateZ.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const positionFromCurrent = index - currentIndex;

  const animatedStyle = useAnimatedStyle(() => {
    if (positionFromCurrent < 0) {
      return { opacity: 0, transform: [{ scale: 0 }] };
    }

    if (positionFromCurrent === 0) {
      return {
        opacity: 1,
        zIndex: totalCards - index,
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotateZ.value}deg` },
          { scale: 1 },
        ],
      };
    }

    const scale = interpolate(
      positionFromCurrent,
      [0, 1, 2, 3],
      [1, 0.95, 0.9, 0.85],
      Extrapolation.CLAMP
    );
    const yOffset = interpolate(
      positionFromCurrent,
      [0, 1, 2, 3],
      [0, 10, 20, 30],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      positionFromCurrent,
      [0, 1, 2, 3],
      [1, 0.7, 0.4, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      zIndex: totalCards - index,
      transform: [
        { translateX: 0 },
        { translateY: yOffset },
        { rotate: '0deg' },
        { scale },
      ],
    };
  });

  if (positionFromCurrent < 0 || positionFromCurrent > 2) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
          },
          animatedStyle,
        ]}
      >
        <BriefingCard
          type={card.type}
          message={card.message}
          detail={card.detail}
          compact
        />
      </Animated.View>
    </GestureDetector>
  );
}

// --- Empty State ---
function EmptyState() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#FFF3E8',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name="moon" size={40} color="#FF8C42" />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#1A1A1A',
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        My job here is done.
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '400',
          color: '#999999',
          textAlign: 'center',
        }}
      >
        Go outside.
      </Text>
    </View>
  );
}

// --- Main Screen ---
// --- Pro Upsell Card ---
function ProUpsellCard({ onDayPassPurchase }: { onDayPassPurchase?: () => void }) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        backgroundColor: '#FFF5ED',
        borderRadius: 16,
        borderCurve: 'continuous',
        padding: 20,
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#FFD9BA',
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#FF8C42',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="lock-open" size={22} color="#FFFFFF" />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' }}>
        Unlock all insights
      </Text>
      <Text style={{ fontSize: 13, color: '#999999', textAlign: 'center', lineHeight: 18 }}>
        Free users see {FREE_CARD_LIMIT} cards per day.{'\n'}Go Pro for the full briefing.
      </Text>
      <Pressable
        onPress={() => router.push({ pathname: '/paywall', params: { trigger: 'briefing' } })}
        style={{
          backgroundColor: '#FF8C42',
          borderRadius: 12,
          borderCurve: 'continuous',
          paddingHorizontal: 20,
          paddingVertical: 10,
          marginTop: 4,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
          Go Pro
        </Text>
      </Pressable>
      {onDayPassPurchase && (
        <Pressable
          onPress={onDayPassPurchase}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#F0F0F0' : '#FFFFFF',
            borderRadius: 12,
            borderCurve: 'continuous',
            borderWidth: 1.5,
            borderColor: '#FF8C42',
            paddingHorizontal: 20,
            paddingVertical: 10,
            width: '100%',
            alignItems: 'center',
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF8C42' }}>
            Unlock today — $0.99
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function BriefingScreen() {
  const insets = useSafeAreaInsets();
  const { isPro } = useProStatus();
  const { purchaseConsumableProduct, findProduct, offerings } = useRevenueCat();
  const { isActive: hasBriefingPass, refresh: refreshBriefingPass } = useDayPass('briefing');
  const { height: screenHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState<BriefingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    loadProfile().then(setProfile).catch(() => {});
    loadName().then(setUserName).catch(() => {});
    generateDailyBriefing()
      .then((result) => {
        setCards(result);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const hasAccess = isPro || hasBriefingPass;
  const visibleCards = hasAccess ? cards : cards.slice(0, FREE_CARD_LIMIT);
  const allDone = !loading && currentIndex >= visibleCards.length;
  const showUpsell = !hasAccess && !loading && currentIndex >= FREE_CARD_LIMIT && cards.length > FREE_CARD_LIMIT;

  const handleBriefingDayPass = async () => {
    const pkg = findProduct(CONSUMABLE_PRODUCTS.briefing);
    if (pkg) {
      const success = await purchaseConsumableProduct(pkg);
      if (success) {
        await activateDayPass('briefing');
        refreshBriefingPass();
      }
    } else {
      Alert.alert('Briefing Day Pass', "Unlock today's full briefing — $0.99", [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Purchase',
          onPress: async () => {
            await activateDayPass('briefing');
            refreshBriefingPass();
          },
        },
      ]);
    }
  };

  const handleSwiped = useCallback(
    (direction: 'left' | 'right') => {
      setCurrentIndex(currentIndex + 1);
    },
    [currentIndex]
  );

  const cardAreaHeight = screenHeight * 0.22;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 16,
          paddingBottom: 120,
        }}
      >
        <View style={{ marginBottom: 16 }}>
          <HeaderLogo />
        </View>

        {/* Header: greeting + avatar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: '#999999',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 4,
              }}
            >
              {getFormattedDate()}
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '700',
                color: '#1A1A1A',
              }}
            >
              {getGreeting()}{userName ? `, ${userName}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/profile')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFF0E5',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={20} color="#FF8C42" />
          </Pressable>
        </View>

        {/* Promotions: hero banner */}
        <HeroBannerCard />

        {/* Investment profile */}
        <InvestmentProfileCard profile={profile} />

        {/* Card counter */}
        {!loading && !allDone && visibleCards.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            {visibleCards.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === currentIndex ? '#FF8C42' : i < currentIndex ? '#E0E0E0' : '#D0D0D0',
                  borderCurve: 'continuous',
                }}
              />
            ))}
          </View>
        )}

        {/* Card stack, loading, upsell, or empty state */}
        {loading ? (
          <View
            style={{
              height: cardAreaHeight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#FF8C42" />
            <Text style={{ fontSize: 13, color: '#999999', marginTop: 10 }}>
              Generating your insights...
            </Text>
          </View>
        ) : showUpsell ? (
          <ProUpsellCard onDayPassPurchase={handleBriefingDayPass} />
        ) : allDone ? (
          <EmptyState />
        ) : (
          <View
            style={{
              height: cardAreaHeight,
              marginHorizontal: 20,
            }}
          >
            {visibleCards.map((card, index) => (
              <SwipeableCard
                key={card.id}
                card={card}
                index={index}
                currentIndex={currentIndex}
                totalCards={visibleCards.length}
                onSwiped={handleSwiped}
              />
            ))}
          </View>
        )}

        {/* Promotions: partner cards 2x2 */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PromoCard promo={PARTNER_PROMOS[0]} />
            <PromoCard promo={PARTNER_PROMOS[1]} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PromoCard promo={PARTNER_PROMOS[2]} />
            <PromoCard promo={PARTNER_PROMOS[3]} />
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
