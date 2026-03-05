import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendToVizzy } from '../../services/vizzyChat';
import { loadProfile, type InvestorProfile } from '../../services/investorProfile';
import { startRecording, stopRecordingAndTranscribe, cancelRecording } from '../../services/stt';
import { useProStatus, useRevenueCat, CONSUMABLE_PRODUCTS } from '../../services/revenuecat';
import { useDayPass, activateDayPass } from '../../services/dayPass';
import HeaderLogo from '../../components/HeaderLogo';

const CHAT_STORAGE_KEY = '@vizzy_chat_history';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = {
  id: string;
  role: 'user' | 'vizzy';
  content: string;
  timestamp: number;
};

const FREE_MESSAGE_LIMIT = 3;

const SUGGESTED_CHIPS = [
  '🔥 Roast my portfolio',
  '📊 Am I diversified?',
  '💰 What to do with $5K?',
  '⚠️ My riskiest holding?',
];


// ---------------------------------------------------------------------------
// Typing indicator (three bouncing dots)
// ---------------------------------------------------------------------------

function TypingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );
    return () => cancelAnimation(translateY);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: '#FF8C42',
          marginHorizontal: 2,
        },
        style,
      ]}
    />
  );
}

function TypingIndicator() {
  return (
    <View style={{ alignItems: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F5F5F5',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderCurve: 'continuous',
        }}
      >
        <TypingDot delay={0} />
        <TypingDot delay={150} />
        <TypingDot delay={300} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mic pulse ring animation
// ---------------------------------------------------------------------------

function PulseRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 2.5,
          borderColor: '#FF8C42',
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Chat message bubble — Cleo style
// ---------------------------------------------------------------------------

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={{ alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 4 }}>
        <View
          style={{
            backgroundColor: '#FF8C42',
            borderRadius: 20,
            borderBottomRightRadius: 6,
            paddingHorizontal: 18,
            paddingVertical: 12,
            maxWidth: '78%',
            borderCurve: 'continuous',
          }}
        >
          <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '500', lineHeight: 22 }}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'flex-start', marginBottom: 16, paddingHorizontal: 4 }}>
      <View
        style={{
          backgroundColor: '#F5F5F5',
          borderRadius: 20,
          borderBottomLeftRadius: 6,
          paddingHorizontal: 18,
          paddingVertical: 12,
          maxWidth: '82%',
          borderCurve: 'continuous',
        }}
      >
        <Text style={{ fontSize: 16, color: '#FF8C42', fontWeight: '500', lineHeight: 22 }}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Quick reply chip (centered, outlined)
// ---------------------------------------------------------------------------

function QuickReplyChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: pressed ? '#FF8C42' : '#E0E0E0',
        borderCurve: 'continuous',
        paddingHorizontal: 18,
        paddingVertical: 10,
        backgroundColor: pressed ? '#FFF5ED' : '#FFFFFF',
      })}
    >
      <Text style={{ fontSize: 14, color: '#1A1A1A', fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Risk Profile Bar
// ---------------------------------------------------------------------------

const RISK_LEVELS = ['Conservative', 'Moderate', 'Growth', 'Aggressive'] as const;
const RISK_COLORS = ['#10B981', '#EAB308', '#F97316', '#EF4444'];
const RISK_EMOJIS = ['🛡️', '⚖️', '🚀', '🔥'];

function RiskProfileGraph({ profile }: { profile: InvestorProfile | null }) {
  const riskIndex = profile
    ? RISK_LEVELS.findIndex(
        (l) => l.toLowerCase() === (profile.riskLabel ?? '').toLowerCase()
      )
    : -1;
  const activeIndex = riskIndex >= 0 ? riskIndex : 2; // default to Growth
  const label = profile?.riskLabel ?? 'Growth';

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderCurve: 'continuous',
        padding: 14,
        borderWidth: 1,
        borderColor: '#F0F0F0',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A1A1A' }}>
          Your Risk Profile
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 16 }}>{RISK_EMOJIS[activeIndex]}</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: RISK_COLORS[activeIndex] }}>{label}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
        {RISK_LEVELS.map((level, i) => (
          <View key={level} style={{ flex: 1 }}>
            <View
              style={{
                width: '100%',
                height: 14 + i * 10,
                borderRadius: 4,
                borderCurve: 'continuous',
                backgroundColor: i === activeIndex ? RISK_COLORS[i] : `${RISK_COLORS[i]}25`,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {RISK_LEVELS.map((level, i) => (
          <Text
            key={level}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              fontWeight: i === activeIndex ? '700' : '400',
              color: i === activeIndex ? '#1A1A1A' : '#BBBBBB',
            }}
          >
            {level}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const { isPro } = useProStatus();
  const { purchaseConsumableProduct, findProduct, offerings } = useRevenueCat();
  const { isActive: hasChatPass, refresh: refreshChatPass } = useDayPass('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted chat on mount
  useEffect(() => {
    AsyncStorage.getItem(CHAT_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved: Message[] = JSON.parse(raw);
          if (saved.length > 0) setMessages(saved);
        } catch {}
      }
    });
  }, []);

  // Save chat whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)).catch(() => {});
    }
  }, [messages]);

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const limitReached = !isPro && !hasChatPass && userMessageCount >= FREE_MESSAGE_LIMIT;

  const handleChatDayPass = async () => {
    const pkg = findProduct(CONSUMABLE_PRODUCTS.chat);
    if (pkg) {
      const success = await purchaseConsumableProduct(pkg);
      if (success) {
        await activateDayPass('chat');
        refreshChatPass();
      }
    } else {
      Alert.alert('Chat Day Pass', 'Unlock unlimited chat for 24 hours — $0.99', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Purchase',
          onPress: async () => {
            await activateDayPass('chat');
            refreshChatPass();
          },
        },
      ]);
    }
  };

  useEffect(() => {
    loadProfile().then(setInvestorProfile).catch(() => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (limitReached) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const history = messages.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await sendToVizzy(text.trim(), history);

    const vizzyMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'vizzy',
      content: response,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, vizzyMsg]);
    setIsTyping(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        const text = await stopRecordingAndTranscribe();
        if (text) {
          setInputText(text);
        }
      } catch (err) {
        console.warn('[Ask] STT error:', err);
      }
    } else {
      try {
        await startRecording();
        setIsRecording(true);
      } catch (err) {
        console.warn('[Ask] Mic error:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, []);

  const hasMessages = messages.length > 0;
  const showSendButton = inputText.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 16 }}>
        <View style={{ marginBottom: 12 }}>
          <HeaderLogo />
        </View>

        {/* Chat messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            flexGrow: 1,
          }}
          ListHeaderComponent={
            !hasMessages ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
                {/* Risk profile */}
                <RiskProfileGraph profile={investorProfile} />

                {/* Welcome */}
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#1A1A1A',
                    textAlign: 'center',
                    marginTop: 16,
                    marginBottom: 4,
                  }}
                >
                  Hey there 👋
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: '#999999',
                    textAlign: 'center',
                    lineHeight: 22,
                    marginBottom: 24,
                    paddingHorizontal: 20,
                  }}
                >
                  Ask me anything about your money
                </Text>

                {/* Quick reply chips — 2x2 centered grid */}
                <View style={{ gap: 10, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <QuickReplyChip label={SUGGESTED_CHIPS[0]} onPress={() => sendMessage(SUGGESTED_CHIPS[0])} />
                    <QuickReplyChip label={SUGGESTED_CHIPS[1]} onPress={() => sendMessage(SUGGESTED_CHIPS[1])} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <QuickReplyChip label={SUGGESTED_CHIPS[2]} onPress={() => sendMessage(SUGGESTED_CHIPS[2])} />
                    <QuickReplyChip label={SUGGESTED_CHIPS[3]} onPress={() => sendMessage(SUGGESTED_CHIPS[3])} />
                  </View>
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
        />

        {/* Bottom input bar or upgrade banner */}
        {limitReached ? (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: insets.bottom + 90,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F0F0F0',
            }}
          >
            <View
              style={{
                backgroundColor: '#FFF5ED',
                borderRadius: 20,
                borderCurve: 'continuous',
                padding: 16,
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: '#FFD9BA',
              }}
            >
              <Text style={{ fontSize: 14, color: '#1A1A1A', fontWeight: '600', textAlign: 'center' }}>
                You've used {FREE_MESSAGE_LIMIT}/{FREE_MESSAGE_LIMIT} free messages today
              </Text>
              <Pressable
                onPress={() => router.push({ pathname: '/paywall', params: { trigger: 'chat' } })}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#E07530' : '#FF8C42',
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  width: '100%',
                  alignItems: 'center',
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                  Go Pro — Unlimited Messages
                </Text>
              </Pressable>
              <Pressable
                onPress={handleChatDayPass}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#F0F0F0' : '#FFFFFF',
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  borderWidth: 1.5,
                  borderColor: '#FF8C42',
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  width: '100%',
                  alignItems: 'center',
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FF8C42' }}>
                  Just today — $0.99
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: insets.bottom + 90,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F0F0F0',
            }}
          >
            {hasChatPass && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                <Ionicons name="time" size={12} color="#10B981" />
                <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>
                  Chat pass active
                </Text>
              </View>
            )}
            {!isPro && !hasChatPass && userMessageCount > 0 && (
              <Text
                style={{
                  fontSize: 12,
                  color: '#999999',
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                {userMessageCount}/{FREE_MESSAGE_LIMIT} free messages used
              </Text>
            )}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F5F5F5',
                borderRadius: 26,
                paddingLeft: 6,
                paddingRight: 6,
                borderCurve: 'continuous',
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#1A1A1A',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  maxHeight: 100,
                }}
                placeholder="Say something..."
                placeholderTextColor="#BBBBBB"
                value={inputText}
                onChangeText={setInputText}
                multiline
                returnKeyType="default"
                onSubmitEditing={() => {
                  if (inputText.trim()) sendMessage(inputText);
                }}
              />

              {/* Mic button */}
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {isRecording && <PulseRing />}
                <Pressable
                  onPress={toggleRecording}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isRecording ? '#FF6B1A' : pressed ? '#FFF0E5' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isRecording ? '0px 2px 12px rgba(255, 107, 26, 0.4)' : 'none',
                  })}
                >
                  <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={isRecording ? 18 : 22}
                    color={isRecording ? '#FFFFFF' : '#FF8C42'}
                  />
                </Pressable>
              </View>

              {showSendButton && (
                <Pressable
                  onPress={() => sendMessage(inputText)}
                  style={({ pressed }) => ({
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: pressed ? '#E07530' : '#FF8C42',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
