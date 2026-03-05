import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Holding, formatCurrency } from '../services/portfolio';

type AssetRowProps = {
  holding: Holding;
  index: number;
  onPress: (holding: Holding) => void;
};

/**
 * AssetRow - A reusable row component for displaying a portfolio asset.
 *
 * Shows a colored circle icon, asset name/subtitle, dollar value,
 * and percentage change. Tapping opens the asset detail view.
 * Uses FadeInRight animation from react-native-reanimated for entry.
 */
export default function AssetRow({ holding, index, onPress }: AssetRowProps) {
  const isGain = holding.changePercent > 0;
  const isLoss = holding.changePercent < 0;
  const isNeutral = holding.changePercent === 0;

  const changeColor = isGain ? '#34C759' : isLoss ? '#FF3B30' : '#999999';

  const changeLabel = isNeutral
    ? 'Available'
    : `${isGain ? '+' : ''}${holding.changePercent}%`;

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(400)}>
      <Pressable
        onPress={() => onPress(holding)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: pressed ? '#F0F0F0' : '#F8F8F8',
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          borderCurve: 'continuous' as const,
        })}
      >
        {/* Asset icon */}
        {holding.logoUrl ? (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#F0F0F0',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: holding.logoUrl }}
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
              backgroundColor: holding.iconColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>{holding.emoji}</Text>
          </View>
        )}

        {/* Name and subtitle */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {holding.name}
          </Text>
          <Text style={{ fontSize: 13, color: '#999999' }}>
            {holding.ticker} {'\u00B7'} {holding.category}
          </Text>
        </View>

        {/* Value and change */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: 2,
            }}
          >
            {formatCurrency(holding.totalValue)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {!isNeutral && (
              <Ionicons
                name={isGain ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={changeColor}
              />
            )}
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: changeColor,
              }}
            >
              {changeLabel}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
