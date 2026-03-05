import { View } from 'react-native';
import { Image } from 'expo-image';

/**
 * HeaderLogo — Single source of truth for the Vizzy app logo.
 * Uses the custom fox-inspired wordmark.
 */
export default function HeaderLogo() {
  return (
    <View
      style={{
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={require('../assets/vizzy-wordmark.png')}
        style={{ width: 160, height: 40 }}
        contentFit="contain"
      />
    </View>
  );
}
