import { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Linking, Alert, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import {
  getCategories,
  formatCurrency,
  Holding,
  LOCAL_LOGOS,
  removeHoldingFromPortfolio,
  updateHoldingInPortfolio,
} from '../../../services/portfolio';
import {
  aggregateCategoryHistory,
  getHoldingChart,
  type TimePeriod,
} from '../../../services/chartUtils';
import { CATEGORY_IMAGES } from '../../../services/categoryIcons';

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { category: categoryId } = useLocalSearchParams<{ category: string }>();
  const [selectedAsset, setSelectedAsset] = useState<Holding | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('All');
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = getCategories();
  const category = categories.find((c) => c.id === categoryId);

  const handleAssetPress = useCallback((holding: Holding) => {
    setSelectedAsset(holding);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedAsset(null);
  }, []);

  const handleDelete = useCallback(async (holdingId: string) => {
    await removeHoldingFromPortfolio(holdingId);
    setSelectedAsset(null);
    // Check if category is now empty
    const updated = getCategories().find((c) => c.id === categoryId);
    if (!updated || updated.holdings.length === 0) {
      router.back();
    } else {
      setRefreshKey((k) => k + 1);
    }
  }, [categoryId]);

  const handleUpdate = useCallback(async (holdingId: string, updates: Partial<Holding>) => {
    await updateHoldingInPortfolio(holdingId, updates);
    setSelectedAsset(null);
    setRefreshKey((k) => k + 1);
  }, []);

  if (!category) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: '#999999' }}>Category not found</Text>
      </View>
    );
  }

  const heroChart = useMemo(
    () => aggregateCategoryHistory(category.holdings, period, 80),
    [category.holdings, period],
  );

  const isGain = category.changePercent > 0;
  const categoryImage = CATEGORY_IMAGES[category.id];
  const changeLabel = category.changePercent === 0
    ? 'Stable'
    : `${isGain ? '+' : ''}${category.changePercent}%`;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card — the selected card pinned to top */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={category.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: insets.top + 12,
              paddingHorizontal: 24,
              paddingBottom: 28,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
              borderCurve: 'continuous' as const,
            }}
          >
            {/* Back arrow */}
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </Pressable>

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
              <Pressable
                onPress={() => router.push('/connect' as any)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="link-outline" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  Connect
                </Text>
              </Pressable>
            </View>

            {/* Balance */}
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
                marginBottom: 16,
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

            {/* Sparkline */}
            <View style={{ height: 48, width: '100%', marginBottom: 16 }}>
              <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                <Defs>
                  <SvgGradient id="sparkFillDetail" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="white" stopOpacity={0.25} />
                    <Stop offset="100%" stopColor="white" stopOpacity={0} />
                  </SvgGradient>
                </Defs>
                <Path
                  d={heroChart.linePath}
                  fill="none"
                  stroke="white"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  opacity={0.8}
                />
                <Path
                  d={heroChart.fillPath}
                  fill="url(#sparkFillDetail)"
                />
              </Svg>
            </View>

            {/* Time period selector */}
            <View
              style={{
                flexDirection: 'row',
                gap: 6,
              }}
            >
              {(['1M', '3M', '6M', '1Y', 'All'] as TimePeriod[]).map((p) => {
                const active = period === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: active
                        ? 'rgba(255, 255, 255, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: active ? '700' : '500',
                        color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Portfolio Overview */}
        <View style={{ paddingHorizontal: 20, paddingTop: 28 }}>
          <Animated.Text
            entering={FadeInUp.delay(200).duration(400)}
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: '#1A1A1A',
              marginBottom: 20,
            }}
          >
            Portfolio overview
          </Animated.Text>

          {category.holdings.map((holding, i) => {
            const hGain = holding.changePercent > 0;
            const hLoss = holding.changePercent < 0;
            const hColor = hGain ? '#34C759' : hLoss ? '#FF3B30' : '#999999';

            return (
              <Animated.View
                key={holding.id}
                entering={FadeInUp.delay(250 + i * 80).duration(400)}
              >
                <Pressable
                  onPress={() => handleAssetPress(holding)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    borderBottomWidth: i < category.holdings.length - 1 ? 1 : 0,
                    borderBottomColor: '#F0F0F0',
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  {/* Icon */}
                  {(LOCAL_LOGOS[holding.id] || holding.logoUrl) ? (
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: '#F0F0F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={LOCAL_LOGOS[holding.id] || { uri: holding.logoUrl }}
                        style={{ width: 30, height: 30 }}
                        contentFit="contain"
                      />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: holding.iconColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <Text style={{ fontSize: 18, color: '#FFFFFF' }}>{holding.emoji}</Text>
                    </View>
                  )}

                  {/* Name + subtitle */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
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

                  {/* Market price + change */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: '#1A1A1A',
                        marginBottom: 2,
                      }}
                    >
                      {formatCurrency(holding.price)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      {holding.changePercent !== 0 && (
                        <Ionicons
                          name={hGain ? 'caret-up' : 'caret-down'}
                          size={12}
                          color={hColor}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: hColor,
                        }}
                      >
                        {holding.changePercent === 0
                          ? 'Stable'
                          : `${Math.abs(holding.changePercent)}%`}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {/* Allocation Distribution */}
          {category.holdings.length > 1 && (
            <Animated.View entering={FadeInUp.delay(250 + category.holdings.length * 80 + 100).duration(400)}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: '#1A1A1A',
                  marginTop: 28,
                  marginBottom: 16,
                }}
              >
                Allocation
              </Text>

              {/* Stacked bar */}
              <View
                style={{
                  flexDirection: 'row',
                  height: 12,
                  borderRadius: 6,
                  overflow: 'hidden',
                  marginBottom: 16,
                }}
              >
                {category.holdings.map((h) => {
                  const pct = category.totalValue > 0 ? (h.totalValue / category.totalValue) * 100 : 0;
                  return (
                    <View
                      key={h.id}
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: h.color || h.iconColor,
                      }}
                    />
                  );
                })}
              </View>

              {/* Legend rows */}
              {category.holdings.map((h) => {
                const pct = category.totalValue > 0 ? (h.totalValue / category.totalValue) * 100 : 0;
                return (
                  <View
                    key={h.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: h.color || h.iconColor,
                        marginRight: 10,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#555555',
                      }}
                      numberOfLines={1}
                    >
                      {h.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#1A1A1A',
                        marginRight: 8,
                      }}
                    >
                      {formatCurrency(h.totalValue)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#999999',
                        width: 44,
                        textAlign: 'right',
                      }}
                    >
                      {Math.round(pct)}%
                    </Text>
                  </View>
                );
              })}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Asset Detail Modal */}
      <Modal
        visible={selectedAsset !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={handleCloseModal}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: insets.bottom + 32,
              borderCurve: 'continuous' as const,
            }}
          >
            {selectedAsset && (
              <AssetDetailContent
                holding={selectedAsset}
                onClose={handleCloseModal}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function getYahooSymbol(ticker: string): string | null {
  if (['Cash', 'Real Estate'].includes(ticker)) return null;
  if (['BTC', 'ETH', 'SOL'].includes(ticker)) return `${ticker}-USD`;
  if (ticker === 'XAU') return 'GC=F';
  if (ticker === 'XAG') return 'SI=F';
  return ticker;
}

function AssetDetailContent({
  holding,
  onClose,
  onDelete,
  onUpdate,
}: {
  holding: Holding;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Holding>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editShares, setEditShares] = useState(String(holding.shares));
  const [editCostBasis, setEditCostBasis] = useState(String(holding.costBasis));

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Holding',
      `Remove ${holding.name} from your portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(holding.id),
        },
      ]
    );
  };

  const handleSaveEdit = () => {
    const shares = parseFloat(editShares) || holding.shares;
    const costBasis = parseFloat(editCostBasis) || holding.costBasis;
    const totalValue = shares * holding.price;
    onUpdate(holding.id, { shares, costBasis, totalValue });
  };

  const gainAmount = holding.totalValue - holding.costBasis;
  const gainPercent = holding.costBasis > 0 ? (gainAmount / holding.costBasis) * 100 : 0;
  const isGain = gainAmount > 0;
  const isLoss = gainAmount < 0;
  const gainColor = isGain ? '#34C759' : isLoss ? '#FF3B30' : '#999999';
  const costPerShare = holding.shares > 0 ? holding.costBasis / holding.shares : 0;

  const dailyIsGain = holding.changePercent > 0;
  const dailyIsLoss = holding.changePercent < 0;
  const dailyColor = dailyIsGain ? '#34C759' : dailyIsLoss ? '#FF3B30' : '#999999';

  const yahooSymbol = getYahooSymbol(holding.ticker);

  const holdingChart = useMemo(
    () => getHoldingChart(holding, 'All', 40),
    [holding.ticker, holding.price, holding.roi24m],
  );

  return (
    <View>
      {/* Drag handle */}
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#E0E0E0',
          alignSelf: 'center',
          marginBottom: 20,
        }}
      />

      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        {(LOCAL_LOGOS[holding.id] || holding.logoUrl) ? (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#F0F0F0',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
              overflow: 'hidden',
            }}
          >
            <Image
              source={LOCAL_LOGOS[holding.id] || { uri: holding.logoUrl }}
              style={{ width: 34, height: 34 }}
              contentFit="contain"
            />
          </View>
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: holding.iconColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 20, color: '#FFFFFF' }}>{holding.emoji}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#1A1A1A',
              marginBottom: 2,
            }}
          >
            {holding.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#999999' }}>
            {holding.ticker}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#F0F0F0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={18} color="#666666" />
        </Pressable>
      </View>

      {/* Market price — hero */}
      <Text
        style={{
          fontSize: 38,
          fontWeight: '800',
          color: '#1A1A1A',
          letterSpacing: -0.5,
          marginBottom: 8,
        }}
      >
        {formatCurrency(holding.price)}
      </Text>

      {/* Daily change badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: dailyIsGain ? 'rgba(52, 199, 89, 0.1)' : dailyIsLoss ? 'rgba(255, 59, 48, 0.1)' : '#F5F5F5',
          borderRadius: 14,
          paddingHorizontal: 10,
          paddingVertical: 5,
          gap: 4,
          marginBottom: 24,
        }}
      >
        {holding.changePercent !== 0 && (
          <Ionicons
            name={dailyIsGain ? 'caret-up' : 'caret-down'}
            size={12}
            color={dailyColor}
          />
        )}
        <Text style={{ fontSize: 13, fontWeight: '700', color: dailyColor }}>
          {holding.changePercent === 0 ? 'Stable' : `${dailyIsGain ? '+' : ''}${holding.changePercent}% today`}
        </Text>
      </View>

      {/* ── Your Position section ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
          gap: 8,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: '#EBEBEB' }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0B0B0', letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Your Position
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#EBEBEB' }} />
      </View>

      {/* Position value */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: '800',
          color: '#1A1A1A',
          letterSpacing: -0.3,
          marginBottom: 6,
        }}
      >
        {formatCurrency(holding.totalValue)}
      </Text>

      {/* Total return badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          marginBottom: 16,
        }}
      >
        <Ionicons
          name={isGain ? 'caret-up' : isLoss ? 'caret-down' : 'remove'}
          size={14}
          color={gainColor}
        />
        <Text style={{ fontSize: 15, fontWeight: '700', color: gainColor }}>
          {isGain ? '+' : ''}{formatCurrency(Math.abs(gainAmount))} ({isGain ? '+' : ''}{gainPercent.toFixed(1)}%)
        </Text>
        <Text style={{ fontSize: 13, color: '#999999' }}>
          total return
        </Text>
      </View>

      {/* Return sparkline — generated price history */}
      <View style={{ height: 40, width: '100%', marginBottom: 16 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
          <Defs>
            <SvgGradient id="returnFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={gainColor} stopOpacity={0.15} />
              <Stop offset="100%" stopColor={gainColor} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          <Path
            d={holdingChart.linePath}
            fill="none"
            stroke={gainColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.8}
          />
          <Path
            d={holdingChart.fillPath}
            fill="url(#returnFill)"
          />
        </Svg>
      </View>

      {/* Shares | Avg cost */}
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 12,
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: '#999999', marginBottom: 4 }}>
            Shares
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
            {holding.shares % 1 === 0 ? holding.shares : holding.shares.toFixed(4)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: '#999999', marginBottom: 4 }}>
            Average Cost
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
            {formatCurrency(costPerShare)}
          </Text>
        </View>
      </View>

      {/* Where it lives */}
      <Pressable
        onPress={() => Linking.openURL(holding.platformUrl)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        }}
      >
        <View>
          <Text style={{ fontSize: 13, color: '#999999', marginBottom: 4 }}>
            Held at
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
            {holding.platform}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: '#F5F5F5',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1A1A' }}>
            Open
          </Text>
          <Ionicons name="open-outline" size={14} color="#999999" />
        </View>
      </Pressable>

      {/* Yahoo Finance link */}
      {yahooSymbol && (
        <Pressable
          onPress={() => Linking.openURL(`https://finance.yahoo.com/quote/${yahooSymbol}`)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 14,
            marginTop: 4,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="analytics-outline" size={16} color="#6B6B6B" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B6B6B' }}>
            Analyze on Yahoo Finance
          </Text>
          <Ionicons name="open-outline" size={13} color="#999999" />
        </Pressable>
      )}

      {/* Edit form */}
      {editing && (
        <View style={{ marginTop: 16, gap: 12 }}>
          <View style={{ height: 1, backgroundColor: '#EBEBEB' }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#999999', textTransform: 'uppercase', letterSpacing: 1 }}>
            Edit Position
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#999999', marginBottom: 4 }}>Shares</Text>
              <TextInput
                value={editShares}
                onChangeText={setEditShares}
                keyboardType="decimal-pad"
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#999999', marginBottom: 4 }}>Cost Basis ($)</Text>
              <TextInput
                value={editCostBasis}
                onChangeText={setEditCostBasis}
                keyboardType="decimal-pad"
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              />
            </View>
          </View>
          <Pressable
            onPress={handleSaveEdit}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#333333' : '#1A1A1A',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Save Changes</Text>
          </Pressable>
        </View>
      )}

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Pressable
          onPress={() => setEditing(!editing)}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: pressed ? '#E8E8E8' : '#F0F0F0',
          })}
        >
          <Ionicons name={editing ? 'close' : 'create-outline'} size={16} color="#1A1A1A" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A' }}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleDeletePress}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: pressed ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)',
          })}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FF3B30' }}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
