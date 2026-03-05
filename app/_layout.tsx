import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initRevenueCat,
  checkProStatus,
  ProContext,
} from '../services/revenuecat';
import { initPortfolio, refreshPrices } from '../services/portfolio';

export default function RootLayout() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        await Promise.all([
          initRevenueCat(),
          initPortfolio(),
        ]);
        // Fetch live prices immediately on app startup
        refreshPrices(true).catch(() => {});
        const proStatus = await checkProStatus().catch(() => false);
        setIsPro(proStatus);
      } catch (error) {
        console.warn('[RootLayout] Bootstrap error:', error);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  return (
    <ProContext.Provider value={{ isPro, setIsPro, loading }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="onboarding/welcome"
            options={{
              animation: 'fade',
              contentStyle: { backgroundColor: '#FFF8F0' },
            }}
          />
          <Stack.Screen
            name="onboarding/name"
            options={{
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#FFF8F0' },
            }}
          />
          <Stack.Screen
            name="onboarding/interview"
            options={{
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#FFF8F0' },
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="onboarding/profile"
            options={{
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#FFF8F0' },
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="terms"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="privacy"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              contentStyle: { backgroundColor: '#FFF8F0' },
            }}
          />
          <Stack.Screen
            name="auth/sign-in"
            options={{
              presentation: 'formSheet',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="connect"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </ProContext.Provider>
  );
}
