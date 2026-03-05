/**
 * Persistent Storage Service
 *
 * AsyncStorage-based persistence for portfolio holdings.
 * Loads mock data on first launch, then persists user changes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Holding, Portfolio } from './portfolio';

const STORAGE_KEY = '@vizzy_holdings';
const INITIALIZED_KEY = '@vizzy_initialized';

/**
 * Check if storage has been initialized with seed data
 */
export async function isInitialized(): Promise<boolean> {
  const val = await AsyncStorage.getItem(INITIALIZED_KEY);
  return val === 'true';
}

/**
 * Load all holdings from persistent storage.
 * Returns null if no data has been saved yet (first launch).
 */
export async function loadHoldings(): Promise<Holding[] | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as Holding[];
  } catch (error) {
    console.error('[Storage] Failed to load holdings:', error);
    return null;
  }
}

/**
 * Save all holdings to persistent storage.
 */
export async function saveHoldings(holdings: Holding[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    await AsyncStorage.setItem(INITIALIZED_KEY, 'true');
  } catch (error) {
    console.error('[Storage] Failed to save holdings:', error);
  }
}

/**
 * Add a new holding and persist.
 */
export async function addHolding(holding: Holding): Promise<Holding[]> {
  const current = (await loadHoldings()) || [];
  const updated = [...current, holding];
  await saveHoldings(updated);
  return updated;
}

/**
 * Remove a holding by ID and persist.
 */
export async function removeHolding(holdingId: string): Promise<Holding[]> {
  const current = (await loadHoldings()) || [];
  const updated = current.filter((h) => h.id !== holdingId);
  await saveHoldings(updated);
  return updated;
}

/**
 * Update a holding by ID and persist.
 */
export async function updateHolding(
  holdingId: string,
  updates: Partial<Holding>
): Promise<Holding[]> {
  const current = (await loadHoldings()) || [];
  const updated = current.map((h) =>
    h.id === holdingId ? { ...h, ...updates } : h
  );
  await saveHoldings(updated);
  return updated;
}

/**
 * Reset storage — clears all persisted data so next load uses seed data.
 */
export async function resetStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, INITIALIZED_KEY]);
  } catch (error) {
    console.error('[Storage] Failed to reset:', error);
  }
}
