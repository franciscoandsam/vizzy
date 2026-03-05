import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import {
  formatCurrency,
  getCategories,
  getTotalValue,
  getTotalGain,
  refreshPrices,
  AssetCategory,
} from '../../../services/portfolio';
import AssetCategoryCard from '../../../components/AssetCategoryCard';
import HeaderLogo from '../../../components/HeaderLogo';

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [, setTick] = useState(0); // force re-render after price update

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await refreshPrices();
      setLastRefreshed(result.lastRefreshed);
      setTick((t) => t + 1);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    doRefresh();
  }, [doRefresh]);

  // Re-render when screen regains focus (after delete/add)
  useFocusEffect(
    useCallback(() => {
      setTick((t) => t + 1);
    }, [])
  );

  const categories = getCategories();
  const totalNetWorth = getTotalValue();
  const totalGain = getTotalGain();

  // Reverse so the first category (Stocks) ends up on TOP of the stack
  const reversed = [...categories].reverse();

  const handleCategoryPress = (category: AssetCategory) => {
    router.push(`/(tabs)/vault/${category.id}` as any);
  };

  const handleConnectPress = () => {
    router.push('/connect' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top + 16 }}>
      <View style={{ marginBottom: 12 }}>
        <HeaderLogo />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor="#999" />
        }
      >

        {/* Header Row */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#1A1A1A',
              letterSpacing: -0.5,
            }}
          >
            The Vault
          </Text>

          <Pressable
            onPress={handleConnectPress}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1.5,
              borderColor: '#FF8C42',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="link-outline" size={16} color="#FF8C42" />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#FF8C42',
              }}
            >
              Connect
            </Text>
          </Pressable>
        </Animated.View>

        {/* Net Worth Hero */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#999999',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            Total Net Worth
          </Text>

          <Text
            style={{
              fontSize: 42,
              fontWeight: '800',
              color: '#1A1A1A',
              marginBottom: 10,
              letterSpacing: -1,
            }}
          >
            {formatCurrency(totalNetWorth)}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: totalGain.percent >= 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                gap: 4,
              }}
            >
              <Ionicons
                name={totalGain.percent >= 0 ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={totalGain.percent >= 0 ? '#34C759' : '#FF3B30'}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: totalGain.percent >= 0 ? '#34C759' : '#FF3B30',
                }}
              >
                {totalGain.percent >= 0 ? '+' : ''}{totalGain.percent.toFixed(1)}%
              </Text>
            </View>
            {refreshing && <ActivityIndicator size="small" color="#999" />}
          </View>

          {lastRefreshed && (
            <Text
              style={{
                fontSize: 11,
                color: '#BBBBBB',
                marginBottom: 28,
              }}
            >
              Updated {formatTimeAgo(lastRefreshed)}
            </Text>
          )}
          {!lastRefreshed && <View style={{ marginBottom: 28 }} />}
        </Animated.View>

        {/* Apple Wallet Card Stack — flow layout with negative margins */}
        <Animated.View entering={FadeInDown.delay(250).duration(600)}>
          {reversed.map((cat, i) => {
            const isFront = i === reversed.length - 1;
            return (
              <AssetCategoryCard
                key={cat.id}
                category={cat}
                index={i}
                totalCards={reversed.length}
                isFront={isFront}
                onPress={handleCategoryPress}
              />
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
