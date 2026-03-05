import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PaywallCardProps = {
  title: string;
  price: string;
  features: string[];
  isHighlighted?: boolean;
  onSelect: () => void;
  badge?: string;
};

/**
 * PaywallCard - Plan selection card for the paywall screen.
 *
 * Two variants:
 * - Default: dark card with subtle border
 * - Highlighted: orange-bordered card with "POPULAR" badge and glow shadow
 */
export default function PaywallCard({
  title,
  price,
  features,
  isHighlighted = false,
  onSelect,
  badge,
}: PaywallCardProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderCurve: 'continuous',
        padding: 20,
        borderWidth: isHighlighted ? 2 : 1,
        borderColor: isHighlighted ? '#FF8C42' : '#E8E0D8',
        position: 'relative',
        overflow: 'visible',
        ...(isHighlighted
          ? {
              boxShadow:
                '0px 0px 20px rgba(255, 140, 66, 0.15), 0px 4px 16px rgba(0, 0, 0, 0.08)',
            }
          : {
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
            }),
      }}
    >
      {/* Badge */}
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: -12,
            alignSelf: 'center',
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#FF8C42',
              borderRadius: 10,
              borderCurve: 'continuous',
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {badge}
            </Text>
          </View>
        </View>
      )}

      {/* Title */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '800',
          color: isHighlighted ? '#FF8C42' : '#AAAAAA',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginTop: badge ? 4 : 0,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      {/* Price */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: '#1A1A1A',
          marginBottom: 16,
        }}
      >
        {price}
      </Text>

      {/* Features */}
      <View style={{ gap: 10 }}>
        {features.map((feature, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={isHighlighted ? '#FF8C42' : '#CCCCCC'}
            />
            <Text
              style={{
                fontSize: 13,
                color: isHighlighted ? '#555555' : '#999999',
                flex: 1,
                lineHeight: 18,
              }}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
