import { Tabs } from 'expo-router';
import { View } from 'react-native';
import FloatingDock from '../../components/FloatingDock';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="briefing" />
        <Tabs.Screen name="ask" />
        <Tabs.Screen name="vault" />
      </Tabs>
      <FloatingDock />
    </View>
  );
}
