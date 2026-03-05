import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vizzy_user_name';

export async function saveName(name: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, name.trim());
}

export async function loadName(): Promise<string | null> {
  try {
    const name = await AsyncStorage.getItem(STORAGE_KEY);
    return name || null;
  } catch {
    return null;
  }
}
