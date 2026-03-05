import { View, Pressable } from 'react-native';
import { usePathname, router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabItem = {
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  isCenter?: boolean;
};

const tabs: TabItem[] = [
  {
    route: '/(tabs)/briefing',
    icon: 'newspaper-outline',
    iconActive: 'newspaper',
  },
  {
    route: '/(tabs)/ask',
    icon: 'paw-outline',
    iconActive: 'paw',
    isCenter: true,
  },
  {
    route: '/(tabs)/vault',
    icon: 'lock-closed-outline',
    iconActive: 'lock-closed',
  },
];

function DockTab({ tab, isActive }: { tab: TabItem; isActive: boolean }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    router.replace(tab.route as any);
  };

  if (tab.isCenter) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          animatedStyle,
          {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#FF8C42',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -12,
            boxShadow: '0px 4px 12px rgba(255, 140, 66, 0.4)',
          },
        ]}
      >
        <Ionicons
          name={isActive ? tab.iconActive : tab.icon}
          size={28}
          color="#FFFFFF"
        />
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        animatedStyle,
        {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Ionicons
        name={isActive ? tab.iconActive : tab.icon}
        size={24}
        color={isActive ? '#FF8C42' : '#B0B0B0'}
      />
    </AnimatedPressable>
  );
}

export default function FloatingDock() {
  const pathname = usePathname();

  const isActive = (route: string) => {
    const routePath = route.replace('/(tabs)', '');
    return pathname === routePath || pathname.startsWith(routePath + '/');
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 32,
        left: 24,
        right: 24,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          backgroundColor: '#FFFFFF',
          borderRadius: 40,
          paddingHorizontal: 32,
          paddingVertical: 12,
          width: '100%',
          maxWidth: 280,
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        {tabs.map((tab) => (
          <DockTab key={tab.route} tab={tab} isActive={isActive(tab.route)} />
        ))}
      </View>
    </View>
  );
}
