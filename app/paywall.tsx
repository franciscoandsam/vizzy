import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import PaywallCard from '../components/PaywallCard';
import { useRevenueCat, restorePurchases, CONSUMABLE_PRODUCTS } from '../services/revenuecat';
import { activateDayPass } from '../services/dayPass';

// ---------------------------------------------------------------------------
// Personalization config per trigger
// ---------------------------------------------------------------------------

type PaywallTrigger = 'chat' | 'briefing' | 'roast' | 'default';

const TRIGGER_CONFIG: Record<
  PaywallTrigger,
  {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    highlightDayPass: string | null;
    features: string[];
  }
> = {
  chat: {
    title: 'Unlock Ask Vizzy',
    subtitle: "You've hit today's free message limit. Go Pro for unlimited AI chat.",
    icon: 'chatbubble',
    highlightDayPass: 'chat',
    features: [
      'Unlimited AI chat messages',
      'All personality modes',
      'Full daily briefing',
      'Portfolio roasts on demand',
    ],
  },
  briefing: {
    title: 'Unlock Full Briefing',
    subtitle: "Free users see 2 cards per day. Go Pro for the complete daily briefing.",
    icon: 'newspaper',
    highlightDayPass: 'briefing',
    features: [
      'Full daily briefing (all cards)',
      'Personalized market insights',
      'Unlimited AI chat',
      'Portfolio roasts on demand',
    ],
  },
  roast: {
    title: 'Unlock Portfolio Roast',
    subtitle: 'Get a brutally honest deep-dive into your portfolio.',
    icon: 'flame',
    highlightDayPass: 'roast',
    features: [
      'Deep portfolio analysis',
      'Actionable recommendations',
      'Unlimited AI chat',
      'Full daily briefing',
    ],
  },
  default: {
    title: 'Choose Your Plan',
    subtitle: 'Daily insights, roasts, and AI-powered portfolio intelligence.',
    icon: 'star',
    highlightDayPass: null,
    features: [
      'Unlimited insights & roasts',
      'Ask Vizzy — AI chat',
      'Full vault with live prices',
      'All personality modes',
    ],
  },
};

// ---------------------------------------------------------------------------
// Close helper — try dismiss, fallback to back
// ---------------------------------------------------------------------------

function closePaywall() {
  if (router.canGoBack()) {
    router.back();
  }
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ trigger?: string }>();
  const trigger = (params.trigger as PaywallTrigger) || 'default';
  const config = TRIGGER_CONFIG[trigger] ?? TRIGGER_CONFIG.default;

  const { isPro, offerings, purchase, loading, purchaseConsumableProduct, findProduct } = useRevenueCat();
  const [restoring, setRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Animated entrance values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(40);
  const mascotScale = useSharedValue(0.8);
  const cardsSlide = useSharedValue(60);
  const buttonSlide = useSharedValue(40);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    slideUp.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    mascotScale.value = withDelay(150, withSpring(1, { damping: 12, stiffness: 200 }));
    cardsSlide.value = withDelay(250, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));
    buttonSlide.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ scale: mascotScale.value }],
  }));

  const cardsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cardsSlide.value, [60, 0], [0, 1]),
    transform: [{ translateY: cardsSlide.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(buttonSlide.value, [40, 0], [0, 1]),
    transform: [{ translateY: buttonSlide.value }],
  }));

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.isPro) {
        Alert.alert('Restored!', 'Your Vizzy Pro subscription has been restored.', [
          { text: 'OK', onPress: closePaywall },
        ]);
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active Vizzy Pro subscription for this account.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong while restoring. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const DAY_PASSES = [
    { type: 'chat' as const, icon: 'chatbubble' as const, title: 'Chat Day Pass', desc: '24h unlimited Ask Vizzy', price: '$0.99', productId: CONSUMABLE_PRODUCTS.chat },
    { type: 'briefing' as const, icon: 'newspaper' as const, title: 'Briefing Unlock', desc: "Today's full daily briefing", price: '$0.99', productId: CONSUMABLE_PRODUCTS.briefing },
    { type: 'roast' as const, icon: 'flame' as const, title: 'Portfolio Roast', desc: 'One deep-dive roast session', price: '$1.99', productId: CONSUMABLE_PRODUCTS.roast },
  ];

  // Sort day passes: highlighted one first when triggered from a specific feature
  const sortedDayPasses = config.highlightDayPass
    ? [...DAY_PASSES].sort((a, b) => {
        if (a.type === config.highlightDayPass) return -1;
        if (b.type === config.highlightDayPass) return 1;
        return 0;
      })
    : DAY_PASSES;

  const handleDayPassPurchase = async (pass: (typeof DAY_PASSES)[number]) => {
    const pkg = findProduct(pass.productId);
    if (pkg) {
      const success = await purchaseConsumableProduct(pkg);
      if (success) {
        await activateDayPass(pass.type);
        Alert.alert('Purchased!', `Your ${pass.title} is now active.`, [
          { text: 'OK', onPress: closePaywall },
        ]);
      }
    } else {
      Alert.alert(pass.title, `${pass.desc} — ${pass.price}`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Purchase',
          onPress: async () => {
            await activateDayPass(pass.type);
            Alert.alert('Purchased!', `Your ${pass.title} is now active.`, [
              { text: 'OK', onPress: closePaywall },
            ]);
          },
        },
      ]);
    }
  };

  const handlePurchase = async () => {
    const currentOffering = offerings?.current;
    const pkg =
      selectedPlan === 'yearly'
        ? currentOffering?.annual ?? currentOffering?.availablePackages?.[1]
        : currentOffering?.monthly ?? currentOffering?.availablePackages?.[0];

    if (pkg) {
      const success = await purchase(pkg);
      if (success) {
        closePaywall();
      }
    } else {
      Alert.alert(
        'Sandbox Mode',
        'RevenueCat is running in sandbox mode. In production, this would start your subscription.',
        [{ text: 'OK', onPress: closePaywall }]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
      {/* Top bar: Close (left) and Restore (right) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: Math.max(insets.top, 16) + 4,
          paddingHorizontal: 20,
          paddingBottom: 8,
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={closePaywall}
          hitSlop={16}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#F0E8E0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={22} color="#1A1A1A" />
        </Pressable>

        <Pressable onPress={handleRestore} hitSlop={12} disabled={restoring}>
          <Text
            style={{
              color: '#FF8C42',
              fontSize: 14,
              fontWeight: '600',
              opacity: restoring ? 0.5 : 1,
            }}
          >
            {restoring ? 'Restoring...' : 'Restore'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Trigger-specific icon or fox mascot */}
        <Animated.View
          style={[
            mascotStyle,
            { marginTop: 8, marginBottom: 20, alignItems: 'center' },
          ]}
        >
          {trigger === 'default' ? (
            <View style={{ position: 'relative' }}>
              <Image
                source={require('../assets/vizzy-fox.png')}
                style={{ width: 120, height: 120, borderRadius: 60 } as any}
                contentFit="cover"
                transition={300}
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  backgroundColor: '#FF8C42',
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  width: 28,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: '#FFF8F0',
                }}
              >
                <Ionicons name="star" size={14} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: '#FFF0E5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={config.icon} size={40} color="#FF8C42" />
            </View>
          )}
        </Animated.View>

        {/* Title & subtitle — personalized */}
        <Animated.View style={[headerStyle, { alignItems: 'center', marginBottom: 28 }]}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#1A1A1A',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {config.title}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: '#888888',
              textAlign: 'center',
              lineHeight: 22,
              maxWidth: 300,
            }}
          >
            {config.subtitle}
          </Text>
        </Animated.View>

        {/* Quick day pass for triggered paywalls */}
        {config.highlightDayPass && (
          <Animated.View style={[cardsStyle, { width: '100%', marginBottom: 20 }]}>
            {sortedDayPasses
              .filter((p) => p.type === config.highlightDayPass)
              .map((pass) => (
                <Pressable
                  key={pass.type}
                  onPress={() => handleDayPassPurchase(pass)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed ? '#FFF0E5' : '#FFFFFF',
                    borderRadius: 16,
                    borderCurve: 'continuous',
                    padding: 16,
                    gap: 14,
                    borderWidth: 2,
                    borderColor: '#FF8C42',
                    boxShadow: '0px 2px 12px rgba(255, 140, 66, 0.15)',
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      borderCurve: 'continuous',
                      backgroundColor: '#FFF0E5',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={pass.icon} size={22} color="#FF8C42" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
                      {pass.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#999999', marginTop: 2 }}>
                      {pass.desc}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: '#FF8C42',
                      borderRadius: 12,
                      borderCurve: 'continuous',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                      {pass.price}
                    </Text>
                  </View>
                </Pressable>
              ))}

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 20,
                gap: 12,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: '#E0D8D0' }} />
              <Text style={{ color: '#BBBBBB', fontSize: 12, fontWeight: '600' }}>
                Or go unlimited
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E0D8D0' }} />
            </View>
          </Animated.View>
        )}

        {/* Plan cards side by side */}
        <Animated.View
          style={[
            cardsStyle,
            {
              flexDirection: 'row',
              gap: 12,
              width: '100%',
              marginBottom: 28,
            },
          ]}
        >
          <PaywallCard
            title="MONTHLY"
            price="$4.99/mo"
            features={config.features}
            isHighlighted={selectedPlan === 'monthly'}
            onSelect={() => setSelectedPlan('monthly')}
          />
          <PaywallCard
            title="YEARLY"
            price="$34.99/yr"
            features={config.features}
            isHighlighted={selectedPlan === 'yearly'}
            onSelect={() => setSelectedPlan('yearly')}
            badge="SAVE 42%"
          />
        </Animated.View>

        {/* CTA button */}
        <Animated.View style={[buttonStyle, { width: '100%', alignItems: 'center' }]}>
          <Pressable
            onPress={handlePurchase}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#E67A30' : '#FF8C42',
              borderRadius: 18,
              borderCurve: 'continuous',
              paddingVertical: 18,
              width: '100%',
              alignItems: 'center',
              boxShadow: '0px 4px 16px rgba(255, 140, 66, 0.3)',
            })}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: '700',
                letterSpacing: 0.3,
              }}
            >
              {selectedPlan === 'yearly' ? 'Start Free Trial — $34.99/yr' : 'Start Free Trial — $4.99/mo'}
            </Text>
          </Pressable>

          {/* Trial info */}
          <Text
            style={{
              color: '#999999',
              fontSize: 13,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            7-day free trial, cancel anytime.
          </Text>

          {/* Other day passes (only in default mode) */}
          {!config.highlightDayPass && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  marginTop: 28,
                  marginBottom: 16,
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: '#E0D8D0' }} />
                <Text style={{ color: '#999999', fontSize: 12, fontWeight: '600' }}>
                  Or buy a la carte
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E0D8D0' }} />
              </View>

              <View style={{ width: '100%', gap: 10 }}>
                {DAY_PASSES.map((pass) => (
                  <Pressable
                    key={pass.type}
                    onPress={() => handleDayPassPurchase(pass)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: pressed ? '#F5EDE5' : '#FFFFFF',
                      borderRadius: 14,
                      borderCurve: 'continuous',
                      padding: 14,
                      gap: 12,
                      borderWidth: 1,
                      borderColor: '#E8E0D8',
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        borderCurve: 'continuous',
                        backgroundColor: '#FFF0E5',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={pass.icon} size={18} color="#FF8C42" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>
                        {pass.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#999999', marginTop: 1 }}>
                        {pass.desc}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#FF8C42',
                        borderRadius: 10,
                        borderCurve: 'continuous',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                        {pass.price}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Footer links */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 24,
              gap: 16,
            }}
          >
            <Pressable onPress={() => router.push('/terms')} hitSlop={12} style={{ paddingVertical: 8 }}>
              <Text style={{ color: '#AAAAAA', fontSize: 12 }}>Terms of Use</Text>
            </Pressable>
            <Text style={{ color: '#CCCCCC', fontSize: 12 }}>|</Text>
            <Pressable onPress={() => router.push('/privacy')} hitSlop={12} style={{ paddingVertical: 8 }}>
              <Text style={{ color: '#AAAAAA', fontSize: 12 }}>Privacy Policy</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
