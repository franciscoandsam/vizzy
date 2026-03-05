import { Stack } from 'expo-router';

export default function VaultLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[category]"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
