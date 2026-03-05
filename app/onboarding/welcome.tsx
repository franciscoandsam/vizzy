import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFF8F0',
        paddingHorizontal: 24,
        paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 24,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Top section: Fox mascot + text */}
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Animated.View entering={FadeIn.delay(200).duration(600)}>
          <Image
            source={require('../../assets/vizzy-fox-desk.png')}
            style={{
              width: 200,
              height: 200,
              borderRadius: 24,
              borderCurve: 'continuous',
            } as any}
            contentFit="cover"
            priority="high"
            cachePolicy="memory-disk"
            transition={200}
          />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(500).duration(500)}
          style={{
            fontSize: 36,
            fontWeight: '800',
            color: '#1A1A1A',
            marginTop: 32,
            textAlign: 'center',
          }}
        >
          Hey, I'm Vizzy
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(700).duration(500)}
          style={{
            fontSize: 18,
            color: '#777777',
            marginTop: 12,
            textAlign: 'center',
            lineHeight: 26,
            paddingHorizontal: 16,
          }}
        >
          Your financial buddy.{'\n'}With attitude.
        </Animated.Text>
      </View>

      {/* Bottom section: CTA */}
      <Animated.View
        entering={FadeInUp.delay(1000).duration(500)}
        style={{ width: '100%', gap: 16, alignItems: 'center' }}
      >
        <AnimatedPressable
          onPress={() => router.push('/onboarding/name')}
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
            Let's Go
          </Text>
        </AnimatedPressable>

        <Text
          style={{
            color: '#B0A090',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          90 seconds to set up your profile
        </Text>
      </Animated.View>
    </View>
  );
}
