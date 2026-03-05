import { View, Text, TextInput, Pressable, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { saveName } from '../../services/userName';

export default function NameScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleContinue = async () => {
    if (!name.trim()) return;
    await saveName(name.trim());
    router.push('/onboarding/interview');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFF8F0' }}
      behavior="padding"
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          justifyContent: 'space-between',
        }}
      >
        {/* Center content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(500)}
            style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#999999',
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            What's your name?
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Pressable onPress={() => inputRef.current?.focus()}>
              <TextInput
                ref={inputRef}
                value={name}
                onChangeText={setName}
                placeholder="Tap to type"
                placeholderTextColor="#CCCCCC"
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                style={{
                  fontSize: 48,
                  fontWeight: '800',
                  color: '#1A1A1A',
                  textAlign: 'center',
                  minWidth: 200,
                  paddingVertical: 8,
                  borderBottomWidth: 2,
                  borderBottomColor: name.trim() ? '#FF8C42' : '#E0D8D0',
                }}
              />
            </Pressable>
          </Animated.View>
        </View>

        {/* Continue button */}
        {name.trim().length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#E07530' : '#FF8C42',
                borderRadius: 20,
                paddingVertical: 20,
                width: '100%',
                alignItems: 'center',
                borderCurve: 'continuous',
                boxShadow: '0px 6px 20px rgba(255, 140, 66, 0.35)',
              })}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '700' }}>
                Continue
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
