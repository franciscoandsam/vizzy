import { Image } from 'expo-image';

type VizzyAvatarProps = {
  size?: number;
};

/**
 * VizzyAvatar - Fox mascot component using the actual Vizzy fox image
 */
export default function VizzyAvatar({ size = 80 }: VizzyAvatarProps) {
  return (
    <Image
      source={require('../assets/vizzy-fox.png')}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      } as any}
      contentFit="cover"
      transition={300}
    />
  );
}
