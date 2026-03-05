import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AssetCategory, formatCurrency } from '../services/portfolio';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { aggregateCategoryHistory } from '../services/chartUtils';
import { CATEGORY_IMAGES } from '../services/categoryIcons';

type Props = {
  category: AssetCategory;
  index: number;
  totalCards: number;
  isFront: boolean;
  onPress: (category: AssetCategory) => void;
};

const CARD_HEIGHT = 176;
const CARD_OVERLAP = 116;
const FRONT_CARD_HEIGHT = 256;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);


export default function AssetCategoryCard({ category, index, totalCards, isFront, onPress }: Props) {
  const scale = useSharedValue(1);

  const sparklineData = useMemo(
    () => aggregateCategoryHistory(category.holdings, 'All', 40),
    [category.holdings],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const isGain = category.changePercent > 0;
  const changeLabel = category.changePercent === 0
    ? 'Stable'
    : `${isGain ? '+' : ''}${category.changePercent}%`;

  const categoryImage = CATEGORY_IMAGES[category.id];
  const isFirst = index === 0;

  if (isFront) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(category)}
        style={[
          animatedStyle,
          {
            marginTop: -CARD_OVERLAP,
            zIndex: totalCards,
          },
        ]}
      >
        <LinearGradient
          colors={category.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 24,
            height: FRONT_CARD_HEIGHT,
            justifyContent: 'space-between',
            borderCurve: 'continuous' as const,
          }}
        >
          <View>
            {/* Icon + name row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    borderCurve: 'continuous' as const,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {categoryImage && <Image source={categoryImage} style={{ width: 32, height: 32 }} contentFit="contain" />}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                  }}
                >
                  {category.name}
                </Text>
              </View>
              {/* Bar chart icon */}
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="bar-chart" size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </View>

            {/* Total Balance */}
            <Text
              style={{
                fontSize: 36,
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: -0.5,
                marginBottom: 8,
              }}
            >
              {formatCurrency(category.totalValue)}
            </Text>

            {/* Growth badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 5,
                gap: 4,
              }}
            >
              <Ionicons
                name={isGain ? 'arrow-up' : 'remove'}
                size={12}
                color="#FFFFFF"
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}
              >
                {changeLabel} Today
              </Text>
            </View>
          </View>

          {/* Sparkline */}
          <View style={{ height: 48, width: '100%' }}>
            <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
              <Defs>
                <SvgGradient id="sparkFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="white" stopOpacity={0.25} />
                  <Stop offset="100%" stopColor="white" stopOpacity={0} />
                </SvgGradient>
              </Defs>
              <Path
                d={sparklineData.linePath}
                fill="none"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.8}
              />
              <Path
                d={sparklineData.fillPath}
                fill="url(#sparkFill)"
              />
            </Svg>
          </View>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  // BACK CARD — only the top ~44px strip is visible (icon + name)
  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(category)}
      style={[
        animatedStyle,
        {
          marginTop: isFirst ? 0 : -CARD_OVERLAP,
          zIndex: index + 1,
        },
      ]}
    >
      <LinearGradient
        colors={category.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 14,
          height: CARD_HEIGHT,
          borderCurve: 'continuous' as const,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              width: 34,
              height: 34,
              borderRadius: 10,
              borderCurve: 'continuous' as const,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {categoryImage && <Image source={categoryImage} style={{ width: 26, height: 26 }} contentFit="contain" />}
          </View>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 0.5,
            }}
          >
            {category.name}
          </Text>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}
