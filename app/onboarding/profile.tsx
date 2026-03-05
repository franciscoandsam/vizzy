import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { generateProfile, type InvestorProfile } from '../../services/investorProfile';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---- Allocation Bar ----
function AllocationBar({
  item,
  index,
}: {
  item: { label: string; value: number; color: string };
  index: number;
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(item.value, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [item.value]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(600 + index * 100).duration(400)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: item.color,
          marginRight: 10,
        }}
      />
      <Text
        style={{
          width: 80,
          fontSize: 14,
          fontWeight: '500',
          color: '#555555',
        }}
      >
        {item.label}
      </Text>
      <View
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#F0E8E0',
          overflow: 'hidden',
          marginRight: 10,
        }}
      >
        <Animated.View
          style={[
            barStyle,
            {
              height: '100%',
              borderRadius: 4,
              backgroundColor: item.color,
            },
          ]}
        />
      </View>
      <Text
        style={{
          width: 36,
          fontSize: 14,
          fontWeight: '700',
          color: '#1A1A1A',
          textAlign: 'right',
        }}
      >
        {item.value}%
      </Text>
    </Animated.View>
  );
}

// ---- Key Finding Row ----
function KeyFindingRow({ text, index }: { text: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(900 + index * 120).duration(400)}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: '#FFF3E8',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        <Ionicons name="bulb-outline" size={14} color="#FF8C42" />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          color: '#444444',
          lineHeight: 22,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

// ---- Main Profile Screen ----
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ answers?: string }>();
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function buildProfile() {
      let answers: string[] = [];
      try {
        if (params.answers) answers = JSON.parse(params.answers);
      } catch {}

      const result = await generateProfile(answers);
      if (!cancelled) {
        setProfile(result);
        setLoading(false);
      }
    }

    buildProfile();
    return () => { cancelled = true; };
  }, [params.answers]);

  if (loading || !profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFF8F0',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Image
          source={require('../../assets/vizzy-fox.png')}
          style={{ width: 80, height: 80, borderRadius: 40 } as any}
          contentFit="cover"
        />
        <ActivityIndicator size="large" color="#FF8C42" />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#999' }}>
          Vizzy is analyzing your answers...
        </Text>
      </View>
    );
  }

  const findings = profile.keyFindings?.length ? profile.keyFindings.slice(0, 3) : [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFF8F0' }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 60,
        alignItems: 'center',
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Fox mascot */}
      <Animated.View
        entering={FadeIn.delay(200).duration(500)}
        style={{ alignItems: 'center', marginBottom: 8 }}
      >
        <Image
          source={require('../../assets/vizzy-fox.png')}
          style={{ width: 80, height: 80, borderRadius: 40 } as any}
          contentFit="cover"
        />
      </Animated.View>

      {/* Speech bubble */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderCurve: 'continuous',
          padding: 16,
          marginBottom: 24,
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          width: '100%',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: -10,
            alignSelf: 'center',
            left: '50%',
            marginLeft: -10,
            width: 0,
            height: 0,
            borderLeftWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 10,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#FFFFFF',
          }}
        />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#1A1A1A',
            textAlign: 'center',
            lineHeight: 23,
          }}
        >
          Here's your money personality.
        </Text>
      </Animated.View>

      {/* Personality Title */}
      <Animated.Text
        entering={FadeInDown.delay(500).duration(500)}
        style={{
          fontSize: 30,
          fontWeight: '800',
          color: '#FF8C42',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {profile.title}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(550).duration(500)}
        style={{
          fontSize: 15,
          color: '#777777',
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 28,
          paddingHorizontal: 12,
        }}
      >
        {profile.subtitle}
      </Animated.Text>

      {/* Target Allocation */}
      <Animated.Text
        entering={FadeInDown.delay(600).duration(400)}
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#1A1A1A',
          alignSelf: 'flex-start',
          marginBottom: 16,
        }}
      >
        Target Allocation
      </Animated.Text>

      <View style={{ width: '100%', marginBottom: 28 }}>
        {profile.allocation.map((item, i) => (
          <AllocationBar key={item.label} item={item} index={i} />
        ))}
      </View>

      {/* Key Findings */}
      {findings.length > 0 && (
        <>
          <Animated.Text
            entering={FadeInDown.delay(850).duration(400)}
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#1A1A1A',
              alignSelf: 'flex-start',
              marginBottom: 16,
            }}
          >
            Key Findings
          </Animated.Text>

          <View style={{ width: '100%', marginBottom: 32 }}>
            {findings.map((finding, i) => (
              <KeyFindingRow key={i} text={finding} index={i} />
            ))}
          </View>
        </>
      )}

      {/* CTA Button */}
      <Animated.View
        entering={FadeInUp.delay(1200).duration(500)}
        style={{ width: '100%' }}
      >
        <AnimatedPressable
          onPress={() => router.replace('/(tabs)/briefing')}
          style={{
            backgroundColor: '#FF8C42',
            borderRadius: 20,
            paddingVertical: 20,
            width: '100%',
            alignItems: 'center',
            borderCurve: 'continuous',
            boxShadow: '0px 6px 20px rgba(255, 140, 66, 0.35)',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '700' }}>
            Start My Briefing
          </Text>
        </AnimatedPressable>
      </Animated.View>
    </ScrollView>
  );
}
