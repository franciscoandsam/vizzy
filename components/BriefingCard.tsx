import { View, Text, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CardType } from '../services/briefing';

type BriefingCardProps = {
  type: CardType;
  message: string;
  detail: string;
  compact?: boolean;
};

const cardConfig: Record<
  CardType,
  {
    label: string;
    gradientColors: [string, string];
    iconName: keyof typeof Ionicons.glyphMap;
    pillBg: string;
    pillText: string;
  }
> = {
  insight: {
    label: 'Personalized Insight',
    gradientColors: ['#E8F5E9', '#C8E6C9'],
    iconName: 'trending-up',
    pillBg: 'rgba(76, 175, 80, 0.15)',
    pillText: '#2E7D32',
  },
  roast: {
    label: 'Roast',
    gradientColors: ['#FFEBEE', '#FFCDD2'],
    iconName: 'flame',
    pillBg: 'rgba(244, 67, 54, 0.15)',
    pillText: '#C62828',
  },
  action: {
    label: 'Action',
    gradientColors: ['#FFF3E0', '#FFE0B2'],
    iconName: 'flash',
    pillBg: 'rgba(255, 152, 0, 0.15)',
    pillText: '#E65100',
  },
};

/**
 * BriefingCard - A swipeable card for the daily briefing deck.
 *
 * Three visual variants:
 * - Insight: green gradient with sparkline icon
 * - Roast: red/pink gradient with fire icon
 * - Action: orange/peach gradient with lightning bolt icon
 */
export default function BriefingCard({
  type,
  message,
  detail,
  compact = false,
}: BriefingCardProps) {
  const { height: screenHeight } = useWindowDimensions();
  const config = cardConfig[type];
  const cardHeight = compact ? screenHeight * 0.22 : screenHeight * 0.6;

  return (
    <LinearGradient
      colors={config.gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: compact ? 20 : 24,
        borderCurve: 'continuous',
        padding: compact ? 18 : 28,
        height: cardHeight,
        justifyContent: 'space-between',
        boxShadow:
          '0px 8px 24px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Top: type pill + icon */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            backgroundColor: config.pillBg,
            borderRadius: 20,
            borderCurve: 'continuous',
            paddingHorizontal: compact ? 10 : 14,
            paddingVertical: compact ? 4 : 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Ionicons name={config.iconName} size={compact ? 12 : 14} color={config.pillText} />
          <Text
            style={{
              fontSize: compact ? 11 : 13,
              fontWeight: '700',
              color: config.pillText,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            {config.label}
          </Text>
        </View>

        <View
          style={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: compact ? 16 : 20,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={config.iconName} size={compact ? 16 : 20} color={config.pillText} />
        </View>
      </View>

      {/* Middle: message + detail */}
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: compact ? 8 : 20 }}>
        <Text
          style={{
            fontSize: compact ? 17 : 24,
            fontWeight: '800',
            color: '#1A1A1A',
            lineHeight: compact ? 23 : 32,
            marginBottom: compact ? 8 : 16,
          }}
          numberOfLines={compact ? 3 : undefined}
        >
          {message}
        </Text>
        <Text
          style={{
            fontSize: compact ? 13 : 15,
            fontWeight: '400',
            color: '#555555',
            lineHeight: compact ? 18 : 22,
          }}
          numberOfLines={compact ? 3 : undefined}
        >
          {detail}
        </Text>
      </View>

    </LinearGradient>
  );
}
