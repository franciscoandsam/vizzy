import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export type DayPassType = 'chat' | 'briefing' | 'roast';

type DayPassRecord = {
  purchasedAt: number;
  expiresAt: number;
};

const STORAGE_KEY = '@vizzy_day_passes';
const PASS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

async function loadPasses(): Promise<Record<string, DayPassRecord>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function savePasses(passes: Record<string, DayPassRecord>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(passes));
}

export async function hasActiveDayPass(type: DayPassType): Promise<boolean> {
  const passes = await loadPasses();
  const pass = passes[type];
  if (!pass) return false;
  return Date.now() < pass.expiresAt;
}

export async function activateDayPass(type: DayPassType): Promise<void> {
  const passes = await loadPasses();
  const now = Date.now();
  passes[type] = {
    purchasedAt: now,
    expiresAt: now + PASS_DURATION_MS,
  };
  await savePasses(passes);
}

export async function getDayPassTimeRemaining(type: DayPassType): Promise<number> {
  const passes = await loadPasses();
  const pass = passes[type];
  if (!pass) return 0;
  const remaining = pass.expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function useDayPass(type: DayPassType) {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const refresh = useCallback(async () => {
    const [active, remaining] = await Promise.all([
      hasActiveDayPass(type),
      getDayPassTimeRemaining(type),
    ]);
    setIsActive(active);
    setTimeRemaining(remaining);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { isActive, loading, timeRemaining, refresh };
}
