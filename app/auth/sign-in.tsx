import { View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <View
        style={{
          width: 40,
          height: 5,
          borderRadius: 3,
          backgroundColor: '#E0E0E0',
          alignSelf: 'center',
          marginBottom: 32,
        }}
      />

      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: '#1A1A1A',
          marginBottom: 8,
        }}
      >
        Welcome Back
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: '#777777',
          marginBottom: 36,
        }}
      >
        Sign in to access your Vizzy account
      </Text>

      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: '#666666',
          marginBottom: 8,
        }}
      >
        Email
      </Text>
      <TextInput
        style={{
          backgroundColor: '#F5F5F5',
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 16,
          fontSize: 16,
          color: '#1A1A1A',
          marginBottom: 24,
          borderCurve: 'continuous',
        }}
        placeholder="you@example.com"
        placeholderTextColor="#B0B0B0"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Pressable
        onPress={() => {
          // TODO: Clerk authentication
          router.replace('/(tabs)/briefing');
        }}
        style={{
          backgroundColor: '#FF8C42',
          borderRadius: 16,
          paddingVertical: 18,
          alignItems: 'center',
          marginBottom: 16,
          borderCurve: 'continuous',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>
          Continue with Email
        </Text>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 20,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: '#E8E8E8' }} />
        <Text
          style={{
            color: '#B0B0B0',
            fontSize: 13,
            marginHorizontal: 16,
          }}
        >
          or
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#E8E8E8' }} />
      </View>

      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F5F5',
          borderRadius: 16,
          paddingVertical: 16,
          gap: 10,
          borderCurve: 'continuous',
        }}
      >
        <Ionicons name="logo-apple" size={22} color="#1A1A1A" />
        <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '600' }}>
          Continue with Apple
        </Text>
      </Pressable>
    </View>
  );
}
