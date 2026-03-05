import { View, Text, Pressable, TextInput, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { startRecording, stopRecordingAndTranscribe, cancelRecording } from '../../services/stt';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const MAX_RECORD_SECONDS = 30;

const QUESTIONS = [
  "How old are you and when do you want to retire?",
  "Risk tolerance? 1 is grandma's savings, 10 is YOLO into memecoins.",
  "How much do you earn and save each month? Rough numbers are fine.",
  "What's your main goal \u2014 grow wealth fast or steady income?",
  "Do you love stocks, crypto, real estate, or gold? Any you hate?",
];

type InterviewState = 'idle' | 'listening' | 'transcribing' | 'showing-answer';

// ---- Progress Bar ----
function ProgressBar({ total, current }: { total: number; current: number }) {
  const progress = (current / total) * 100;

  return (
    <View
      style={{
        flex: 1,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E8DDD4',
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          width: `${progress}%`,
          height: '100%',
          borderRadius: 6,
          backgroundColor: '#FF8C42',
        }}
      />
    </View>
  );
}

// ---- Waveform Bars inside Mic Button ----
function WaveBar({ delay }: { delay: number }) {
  const height = useSharedValue(8);

  useEffect(() => {
    height.value = withRepeat(
      withSequence(
        withTiming(28, { duration: 300 + delay, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 300 + delay, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(height);
    };
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: 4,
          borderRadius: 2,
          backgroundColor: '#FFFFFF',
        },
      ]}
    />
  );
}

function AudioWaveform() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        height: 32,
      }}
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <WaveBar key={i} delay={i * 80} />
      ))}
    </View>
  );
}

// ---- Pulse Ring for Recording ----
function RecordingPulse() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
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
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: '#FF8C42',
        },
        style,
      ]}
    />
  );
}

// ---- Mic Button (Large circle — idle: mic icon, recording: orange pulse + waveform) ----
function MicButton({
  isListening,
  onPress,
}: {
  isListening: boolean;
  onPress: () => void;
}) {
  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {isListening && <RecordingPulse />}
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          buttonAnimatedStyle,
          {
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: isListening ? '#FF6B1A' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isListening ? '0px 8px 32px rgba(255, 107, 26, 0.5)' : 'none',
          },
        ]}
      >
        {isListening ? (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <AudioWaveform />
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: '#FFFFFF',
              }}
            />
          </View>
        ) : (
          <Image source={require('../../assets/microphone.png')} style={{ width: 200, height: 200 }} contentFit="contain" />
        )}
      </AnimatedPressable>
    </View>
  );
}

// ---- Main Interview Screen ----
export default function InterviewScreen() {
  const insets = useSafeAreaInsets();
  const [micGranted, setMicGranted] = useState(false);
  const [showPermScreen, setShowPermScreen] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [state, setState] = useState<InterviewState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [typingMode, setTypingMode] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORD_SECONDS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef(false);

  // Check if mic permission already granted
  useEffect(() => {
    Audio.getPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        setMicGranted(true);
        setShowPermScreen(false);
      }
    });
  }, []);

  const requestMicPermission = useCallback(async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status === 'granted') {
      setMicGranted(true);
      setShowPermScreen(false);
    }
  }, []);

  const skipMicPermission = useCallback(() => {
    setShowPermScreen(false);
    setTypingMode(true);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      cancelRecording();
    };
  }, []);

  // Start/stop countdown when listening state changes
  useEffect(() => {
    if (state === 'listening') {
      setSecondsLeft(MAX_RECORD_SECONDS);
      autoStopRef.current = false;
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            autoStopRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state]);

  // Auto-stop recording when timer hits 0
  useEffect(() => {
    if (autoStopRef.current && secondsLeft === 0 && state === 'listening') {
      autoStopRef.current = false;
      handleMicPress();
    }
  }, [secondsLeft, state]);

  const navigateToProfile = useCallback(
    (allAnswers: string[]) => {
      router.push({
        pathname: '/onboarding/profile',
        params: { answers: JSON.stringify(allAnswers) },
      });
    },
    []
  );

  const advanceToNext = useCallback(
    (answerText: string) => {
      const newAnswers = [...answers, answerText];
      setAnswers(newAnswers);

      if (currentQuestion + 1 >= QUESTIONS.length) {
        navigateToProfile(newAnswers);
      } else {
        setCurrentQuestion((q) => q + 1);
        setState('idle');
        setTranscribedText('');
        setTypedText('');
      }
    },
    [currentQuestion, answers, navigateToProfile]
  );

  const handleMicPress = useCallback(async () => {
    if (state === 'listening') {
      setState('transcribing');

      try {
        const text = await stopRecordingAndTranscribe();
        if (text) {
          setTranscribedText(text);
          setState('showing-answer');

          timeoutRef.current = setTimeout(() => {
            advanceToNext(text);
          }, 1800);
        } else {
          setState('idle');
        }
      } catch (err) {
        console.warn('[Interview] STT error:', err);
        setState('idle');
      }
    } else if (state === 'idle') {
      try {
        await startRecording();
        setState('listening');
      } catch (err) {
        console.warn('[Interview] Mic error:', err);
      }
    }
  }, [state, advanceToNext]);

  const handleSubmitTyped = useCallback(() => {
    const text = typedText.trim();
    if (!text) return;
    setTranscribedText(text);
    setState('showing-answer');

    timeoutRef.current = setTimeout(() => {
      advanceToNext(text);
    }, 1200);
  }, [typedText, advanceToNext]);

  const handleSkip = useCallback(() => {
    advanceToNext('(skipped)');
  }, [advanceToNext]);

  const handleClose = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    cancelRecording();
    router.back();
  }, []);

  const toggleTypingMode = useCallback(() => {
    if (state === 'listening') {
      cancelRecording();
      setState('idle');
    }
    setTypingMode((prev) => !prev);
    setTypedText('');
  }, [state]);

  // ── Mic Permission Screen ──
  if (showPermScreen) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 32,
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 40,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Animated.View entering={FadeInDown.duration(500)}>
              <Image
                source={require('../../assets/microphone.png')}
                style={{ width: 120, height: 120, marginBottom: 32 }}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.delay(150).duration(400)}
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#1A1A1A',
                textAlign: 'center',
                lineHeight: 36,
                marginBottom: 16,
              }}
            >
              Hey! For the full{'\n'}experience, turn on{'\n'}your mic
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(250).duration(400)}
              style={{
                fontSize: 16,
                color: '#888888',
                textAlign: 'center',
                lineHeight: 24,
                paddingHorizontal: 16,
              }}
            >
              Vizzy uses voice to get to know you faster.{'\n'}It only takes 90 seconds.
            </Animated.Text>
          </View>

          <Animated.View
            entering={FadeInUp.delay(400).duration(400)}
            style={{ width: '100%', gap: 14 }}
          >
            <Pressable
              onPress={requestMicPermission}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#E67A30' : '#FF8C42',
                borderRadius: 18,
                paddingVertical: 18,
                alignItems: 'center',
                borderCurve: 'continuous' as any,
                boxShadow: '0px 4px 20px rgba(255, 140, 66, 0.35)',
              })}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                Activate Microphone
              </Text>
            </Pressable>

            <Pressable
              onPress={skipMicPermission}
              style={{ alignItems: 'center', paddingVertical: 12 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#C8BDB0' }}>
                I'll type instead
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: '#FFF8F0' }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Top bar: Close + Progress Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18, color: '#666666', fontWeight: '600' }}>
              {'\u2715'}
            </Text>
          </Pressable>

          <ProgressBar total={QUESTIONS.length} current={currentQuestion} />

          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={{ fontSize: 15, color: '#B0A090', fontWeight: '600' }}>
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Question text */}
        <Animated.Text
          key={`q-${currentQuestion}`}
          entering={FadeInDown.duration(400)}
          style={{
            fontSize: 24,
            fontWeight: '800',
            color: '#1A1A1A',
            textAlign: 'center',
            lineHeight: 34,
            paddingHorizontal: 8,
            marginBottom: 24,
          }}
        >
          {QUESTIONS[currentQuestion]}
        </Animated.Text>

        {/* Fox mascot - large, centered */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {state === 'showing-answer' && transcribedText ? (
            <Animated.View
              entering={FadeInDown.duration(400)}
              exiting={FadeOut.duration(300)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderCurve: 'continuous',
                padding: 20,
                marginHorizontal: 8,
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.06)',
                width: '100%',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: '#555555',
                  lineHeight: 24,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                "{transcribedText}"
              </Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(500)}>
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
          )}

          {/* Status text + timer */}
          {state === 'listening' && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{ alignItems: 'center', marginTop: 16, gap: 6 }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: '#4CD964',
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                Listening...
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: secondsLeft <= 5 ? '#FF3B30' : '#FF8C42',
                  textAlign: 'center',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {secondsLeft}s
              </Text>
            </Animated.View>
          )}

          {state === 'transcribing' && (
            <Animated.Text
              entering={FadeIn.duration(200)}
              style={{
                fontSize: 15,
                color: '#FF8C42',
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              Processing...
            </Animated.Text>
          )}
        </View>

        {/* Bottom area: Mic or Typing */}
        <View style={{ alignItems: 'center', gap: 12, paddingBottom: 8 }}>
          {typingMode ? (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={{ width: '100%', gap: 12 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  borderCurve: 'continuous',
                  borderWidth: 2,
                  borderColor: '#FF8C42',
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                  boxShadow: '0px 2px 12px rgba(255, 140, 66, 0.15)',
                }}
              >
                <TextInput
                  autoFocus
                  placeholder="Type your answer..."
                  placeholderTextColor="#C0B0A0"
                  value={typedText}
                  onChangeText={setTypedText}
                  onSubmitEditing={handleSubmitTyped}
                  returnKeyType="send"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#1A1A1A',
                    paddingVertical: 14,
                  }}
                />
                <Pressable
                  onPress={handleSubmitTyped}
                  hitSlop={8}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: typedText.trim() ? '#FF8C42' : '#E8DDD4',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18, color: '#FFFFFF' }}>{'\u2191'}</Text>
                </Pressable>
              </View>

              <Pressable onPress={toggleTypingMode} hitSlop={8}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#FF8C42',
                    textAlign: 'center',
                    letterSpacing: 0.5,
                  }}
                >
                  USE VOICE INSTEAD
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <>
              {(state === 'idle' || state === 'listening') && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={{ alignItems: 'center', gap: 12 }}
                >
                  {state === 'idle' && (
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#B0A090',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}
                      >
                        Tap the mic to answer
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#C8BDB0',
                          fontWeight: '400',
                          textAlign: 'center',
                        }}
                      >
                        30 seconds per response
                      </Text>
                    </View>
                  )}

                  <MicButton
                    isListening={state === 'listening'}
                    onPress={handleMicPress}
                  />

                  {state === 'listening' && (
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: '#FF6B1A',
                        textAlign: 'center',
                        letterSpacing: 0.3,
                      }}
                    >
                      Tap to stop
                    </Text>
                  )}
                </Animated.View>
              )}

              {/* "I can't talk" always at bottom, separate from mic */}
              {(state === 'idle' || state === 'listening') && (
                <Pressable onPress={toggleTypingMode} hitSlop={12} style={{ marginTop: 4 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#C8BDB0',
                      textAlign: 'center',
                      letterSpacing: 0.3,
                    }}
                  >
                    I can't talk right now
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
