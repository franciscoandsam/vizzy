import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { loadProfile } from '../services/investorProfile';
import { loadName } from '../services/userName';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    async function check() {
      const [profile, name] = await Promise.all([loadProfile(), loadName()]);
      setHasOnboarded(!!(profile || name));
      setReady(true);
    }
    check();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF8C42" />
      </View>
    );
  }

  if (hasOnboarded) {
    return <Redirect href="/(tabs)/briefing" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
