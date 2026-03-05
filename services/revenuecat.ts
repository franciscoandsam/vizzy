/**
 * RevenueCat Service
 *
 * Handles in-app purchases and subscription management via RevenueCat SDK.
 * Provides initialization, purchase flow, restore, and pro status checking.
 *
 * Entitlements:
 * - "pro" — unlocks Vizzy Pro features (unlimited Ask Vizzy, personality modes, etc.)
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

const PRO_ENTITLEMENT_ID = 'pro';

/** Consumable product identifiers (must match App Store Connect / Play Console) */
export const CONSUMABLE_PRODUCTS = {
  chat: 'vizzy_chat_day_pass',
  briefing: 'vizzy_briefing_day_pass',
  roast: 'vizzy_portfolio_roast',
} as const;

/**
 * Initialize RevenueCat SDK
 * Call once at app startup (e.g., in _layout.tsx)
 */
export async function initRevenueCat(): Promise<void> {
  if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY === 'placeholder') {
    console.warn('[RevenueCat] No API key configured. Running in mock mode.');
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });

    console.log('[RevenueCat] SDK initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Initialization failed:', error);
  }
}

/**
 * Fetch available offerings (products/plans) from RevenueCat
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('[RevenueCat] Failed to fetch offerings:', error);
    return null;
  }
}

/**
 * Purchase a specific package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro =
      customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;

    return { success: isPro, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'Purchase cancelled' };
    }
    console.error('[RevenueCat] Purchase failed:', error);
    return { success: false, error: error.message ?? 'Purchase failed' };
  }
}

/**
 * Restore previous purchases (e.g., after reinstall or new device)
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPro: boolean;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro =
      customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;

    return { success: true, isPro };
  } catch (error: any) {
    console.error('[RevenueCat] Restore failed:', error);
    return { success: false, isPro: false, error: error.message ?? 'Restore failed' };
  }
}

/**
 * Check if the current user has an active "pro" entitlement
 */
export async function checkProStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('[RevenueCat] Failed to check pro status:', error);
    return false;
  }
}

/**
 * Get full customer info from RevenueCat
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('[RevenueCat] Failed to get customer info:', error);
    return null;
  }
}

/**
 * Purchase a consumable product (day pass / one-time unlock).
 * Unlike subscriptions, consumables don't grant the "pro" entitlement.
 */
export async function purchaseConsumable(
  pkg: PurchasesPackage
): Promise<{ success: boolean; error?: string }> {
  try {
    await Purchases.purchasePackage(pkg);
    return { success: true };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'Purchase cancelled' };
    }
    console.error('[RevenueCat] Consumable purchase failed:', error);
    return { success: false, error: error.message ?? 'Purchase failed' };
  }
}

/**
 * Find a product/package inside offerings by its product identifier string.
 */
export function findProductByIdentifier(
  offerings: PurchasesOfferings | null,
  productId: string
): PurchasesPackage | null {
  if (!offerings) return null;

  for (const offering of Object.values(offerings.all)) {
    for (const pkg of offering.availablePackages) {
      if (pkg.product.identifier === productId) return pkg;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// React Hook
// ---------------------------------------------------------------------------

export type RevenueCatState = {
  isPro: boolean;
  offerings: PurchasesOfferings | null;
  loading: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  purchaseConsumableProduct: (pkg: PurchasesPackage) => Promise<boolean>;
  findProduct: (productId: string) => PurchasesPackage | null;
};

/**
 * useRevenueCat — React hook providing subscription state and actions.
 *
 * Usage:
 *   const { isPro, offerings, purchase, restore, loading } = useRevenueCat();
 */
export function useRevenueCat(): RevenueCatState {
  const [isPro, setIsPro] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [proStatus, fetchedOfferings] = await Promise.all([
          checkProStatus().catch(() => false),
          getOfferings().catch(() => null),
        ]);

        if (mounted) {
          setIsPro(proStatus);
          setOfferings(fetchedOfferings);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    const result = await purchasePackage(pkg);
    if (result.success) {
      setIsPro(true);
    }
    return result.success;
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    const result = await restorePurchases();
    if (result.isPro) {
      setIsPro(true);
    }
    return result.isPro;
  }, []);

  const purchaseConsumableProduct = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      const result = await purchaseConsumable(pkg);
      return result.success;
    },
    []
  );

  const findProduct = useCallback(
    (productId: string): PurchasesPackage | null => {
      return findProductByIdentifier(offerings, productId);
    },
    [offerings]
  );

  return { isPro, offerings, loading, purchase, restore, purchaseConsumableProduct, findProduct };
}

// ---------------------------------------------------------------------------
// Context & Provider (for app-wide pro status)
// ---------------------------------------------------------------------------

export type ProContextValue = {
  isPro: boolean;
  setIsPro: (value: boolean) => void;
  loading: boolean;
};

export const ProContext = createContext<ProContextValue>({
  isPro: false,
  setIsPro: () => {},
  loading: true,
});

export function useProStatus(): ProContextValue {
  return useContext(ProContext);
}
