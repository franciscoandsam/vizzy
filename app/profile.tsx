import { View, Text, Pressable, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { loadName, saveName } from '../services/userName';
import { loadProfile, saveProfile, type InvestorProfile } from '../services/investorProfile';
import { useProStatus } from '../services/revenuecat';
import { restorePurchases } from '../services/revenuecat';

const RISK_EMOJIS: Record<string, string> = {
  Conservative: '🛡️',
  Moderate: '⚖️',
  Growth: '🚀',
  Aggressive: '🔥',
};

const RISK_LABELS = ['Conservative', 'Moderate', 'Growth', 'Aggressive'] as const;

function riskLevelToLabel(level: number): string {
  if (level <= 3) return 'Conservative';
  if (level <= 5) return 'Moderate';
  if (level <= 7) return 'Growth';
  return 'Aggressive';
}

// ---------------------------------------------------------------------------
// Reusable row
// ---------------------------------------------------------------------------

function ProfileRow({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: pressed && onPress ? '#FFF5ED' : 'transparent',
        gap: 14,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          borderCurve: 'continuous',
          backgroundColor: '#FFF0E5',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color="#FF8C42" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>{label}</Text>
        {value && (
          <Text style={{ fontSize: 13, color: '#999999', marginTop: 1 }}>{value}</Text>
        )}
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
      )}
    </Pressable>
  );
}

function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: '#F0EBE5', marginLeft: 70 }} />
  );
}

// ---------------------------------------------------------------------------
// Edit modal — text input
// ---------------------------------------------------------------------------

function EditFieldModal({
  visible,
  title,
  value,
  onSave,
  onClose,
  placeholder,
  keyboardType = 'default',
}: {
  visible: boolean;
  title: string;
  value: string;
  onSave: (val: string) => void;
  onClose: () => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            borderCurve: 'continuous',
            padding: 24,
            width: '100%',
            maxWidth: 340,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 }}>
            {title}
          </Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={placeholder}
            placeholderTextColor="#CCCCCC"
            keyboardType={keyboardType}
            autoFocus
            style={{
              fontSize: 16,
              color: '#1A1A1A',
              borderWidth: 1.5,
              borderColor: '#E8E0D8',
              borderRadius: 12,
              borderCurve: 'continuous',
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 20,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: '#F5F0EB',
                borderRadius: 12,
                borderCurve: 'continuous',
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#999999' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSave(draft.trim());
                onClose();
              }}
              style={{
                flex: 1,
                backgroundColor: '#FF8C42',
                borderRadius: 12,
                borderCurve: 'continuous',
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Risk level picker modal
// ---------------------------------------------------------------------------

function RiskPickerModal({
  visible,
  currentLevel,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentLevel: number;
  onSave: (level: number) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(currentLevel);

  useEffect(() => {
    if (visible) setDraft(currentLevel);
  }, [visible, currentLevel]);

  const label = riskLevelToLabel(draft);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            borderCurve: 'continuous',
            padding: 24,
            width: '100%',
            maxWidth: 340,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 }}>
            Risk Tolerance
          </Text>
          <Text style={{ fontSize: 13, color: '#999999', marginBottom: 20 }}>
            1 = very conservative, 10 = very aggressive
          </Text>

          {/* Level display */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 42, fontWeight: '800', color: '#FF8C42' }}>{draft}</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#666666', marginTop: 2 }}>
              {RISK_EMOJIS[label] ?? '🦊'} {label}
            </Text>
          </View>

          {/* Level buttons */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Pressable
                key={n}
                onPress={() => setDraft(n)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  borderCurve: 'continuous',
                  backgroundColor: n === draft ? '#FF8C42' : '#F5F0EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: n === draft ? '#FFFFFF' : '#666666',
                  }}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: '#F5F0EB',
                borderRadius: 12,
                borderCurve: 'continuous',
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#999999' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSave(draft);
                onClose();
              }}
              style={{
                flex: 1,
                backgroundColor: '#FF8C42',
                borderRadius: 12,
                borderCurve: 'continuous',
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type EditingField = 'name' | 'risk' | 'savings' | 'income' | 'goal' | 'preferences' | null;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isPro } = useProStatus();
  const [name, setName] = useState<string | null>(null);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [editing, setEditing] = useState<EditingField>(null);

  useEffect(() => {
    loadName().then(setName);
    loadProfile().then(setProfile);
  }, []);

  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.isPro) {
        Alert.alert('Restored!', 'Your Vizzy Pro subscription has been restored.');
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active subscription.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong while restoring.');
    } finally {
      setRestoring(false);
    }
  };

  const updateProfile = useCallback(
    async (updates: Partial<InvestorProfile>) => {
      if (!profile) return;
      const updated = { ...profile, ...updates };
      setProfile(updated);
      await saveProfile(updated);
    },
    [profile]
  );

  const handleNameSave = async (newName: string) => {
    if (!newName) return;
    setName(newName);
    await saveName(newName);
  };

  const handleRiskSave = async (level: number) => {
    await updateProfile({ riskLevel: level, riskLabel: riskLevelToLabel(level) });
  };

  const handleSavingsSave = async (val: string) => {
    if (!val) return;
    await updateProfile({ monthlySavings: val });
  };

  const handleIncomeSave = async (val: string) => {
    if (!val) return;
    await updateProfile({ monthlyIncome: val });
  };

  const handleGoalSave = async (val: string) => {
    if (!val) return;
    await updateProfile({ mainGoal: val });
  };

  const handlePreferencesSave = async (val: string) => {
    if (!val) return;
    await updateProfile({ preferences: val });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          position: 'relative',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            position: 'absolute',
            left: 20,
            top: insets.top + 8,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#F5F0EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name + Investor Type + Plan */}
        <Pressable
          onPress={() => setEditing('name')}
          style={{ alignItems: 'center', paddingTop: 28, paddingBottom: 32, paddingHorizontal: 24 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#1A1A1A' }}>
              {name ?? 'Investor'}
            </Text>
            <Ionicons name="pencil" size={16} color="#CCCCCC" />
          </View>
          {profile && (
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#FF8C42', marginBottom: 6 }}>
              {RISK_EMOJIS[profile.riskLabel] ?? '🦊'} {profile.title}
            </Text>
          )}
          {profile && (
            <Text style={{ fontSize: 14, color: '#999999', textAlign: 'center', lineHeight: 20, marginBottom: 14 }}>
              {profile.subtitle}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: isPro ? '#FFF0E5' : '#F5F5F5',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderCurve: 'continuous',
            }}
          >
            <Ionicons
              name={isPro ? 'star' : 'star-outline'}
              size={15}
              color={isPro ? '#FF8C42' : '#AAAAAA'}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isPro ? '#FF8C42' : '#AAAAAA',
              }}
            >
              {isPro ? 'Vizzy Pro' : 'Free Plan'}
            </Text>
          </View>
        </Pressable>

        {/* Section: Subscription */}
        <View style={{ backgroundColor: '#FAFAFA', paddingVertical: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#BBBBBB',
              textTransform: 'uppercase',
              letterSpacing: 1,
              paddingHorizontal: 20,
              paddingVertical: 8,
            }}
          >
            Subscription
          </Text>
        </View>

        {!isPro && (
          <>
            <ProfileRow
              icon="diamond"
              label="Upgrade to Pro"
              value="Unlimited insights, chat & roasts"
              onPress={() => router.push('/paywall')}
            />
            <Divider />
          </>
        )}
        {isPro && (
          <>
            <ProfileRow
              icon="diamond"
              label="Vizzy Pro"
              value="Active subscription"
              showChevron={false}
            />
            <Divider />
          </>
        )}
        <ProfileRow
          icon="refresh"
          label="Restore Purchases"
          value={restoring ? 'Restoring...' : undefined}
          onPress={restoring ? undefined : handleRestore}
        />

        {/* Section: Investor Profile */}
        <View style={{ backgroundColor: '#FAFAFA', paddingVertical: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#BBBBBB',
              textTransform: 'uppercase',
              letterSpacing: 1,
              paddingHorizontal: 20,
              paddingVertical: 8,
            }}
          >
            Investor Profile
          </Text>
        </View>

        {profile ? (
          <>
            <ProfileRow
              icon="shield-checkmark"
              label="Risk Level"
              value={`${profile.riskLevel}/10 — ${profile.riskLabel}`}
              onPress={() => setEditing('risk')}
            />
            <Divider />
            <ProfileRow
              icon="cash"
              label="Monthly Savings"
              value={profile.monthlySavings}
              onPress={() => setEditing('savings')}
            />
            <Divider />
            <ProfileRow
              icon="wallet"
              label="Monthly Income"
              value={profile.monthlyIncome}
              onPress={() => setEditing('income')}
            />
            <Divider />
            <ProfileRow
              icon="flag"
              label="Main Goal"
              value={profile.mainGoal}
              onPress={() => setEditing('goal')}
            />
            <Divider />
            <ProfileRow
              icon="heart"
              label="Preferences"
              value={profile.preferences}
              onPress={() => setEditing('preferences')}
            />
            <Divider />
            <ProfileRow
              icon="refresh-circle"
              label="Redo Onboarding"
              value="Start the investor interview again"
              onPress={() => {
                router.back();
                setTimeout(() => router.push('/onboarding/welcome' as any), 300);
              }}
            />
          </>
        ) : (
          <ProfileRow
            icon="add-circle"
            label="Set Up Profile"
            value="Complete the investor interview"
            onPress={() => {
              router.back();
              setTimeout(() => router.push('/onboarding/welcome' as any), 300);
            }}
          />
        )}

        {/* Section: App */}
        <View style={{ backgroundColor: '#FAFAFA', paddingVertical: 8, marginTop: 0 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#BBBBBB',
              textTransform: 'uppercase',
              letterSpacing: 1,
              paddingHorizontal: 20,
              paddingVertical: 8,
            }}
          >
            App
          </Text>
        </View>

        <ProfileRow
          icon="document-text"
          label="Terms of Use"
          onPress={() => router.push('/terms')}
        />
        <Divider />
        <ProfileRow
          icon="shield"
          label="Privacy Policy"
          onPress={() => router.push('/privacy')}
        />

        {/* Version */}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#CCCCCC',
            marginTop: 32,
          }}
        >
          Vizzy v1.0.0
        </Text>
      </ScrollView>

      {/* Edit modals */}
      <EditFieldModal
        visible={editing === 'name'}
        title="Your Name"
        value={name ?? ''}
        placeholder="Enter your name"
        onSave={handleNameSave}
        onClose={() => setEditing(null)}
      />
      <EditFieldModal
        visible={editing === 'savings'}
        title="Monthly Savings"
        value={profile?.monthlySavings ?? ''}
        placeholder="e.g. $500, $1,200"
        onSave={handleSavingsSave}
        onClose={() => setEditing(null)}
      />
      <EditFieldModal
        visible={editing === 'income'}
        title="Monthly Income"
        value={profile?.monthlyIncome ?? ''}
        placeholder="e.g. $3,000, $5,500"
        onSave={handleIncomeSave}
        onClose={() => setEditing(null)}
      />
      <EditFieldModal
        visible={editing === 'goal'}
        title="Main Financial Goal"
        value={profile?.mainGoal ?? ''}
        placeholder="e.g. Retire by 50, Build passive income"
        onSave={handleGoalSave}
        onClose={() => setEditing(null)}
      />
      <EditFieldModal
        visible={editing === 'preferences'}
        title="Investment Preferences"
        value={profile?.preferences ?? ''}
        placeholder="e.g. Love tech stocks, avoid crypto"
        onSave={handlePreferencesSave}
        onClose={() => setEditing(null)}
      />
      <RiskPickerModal
        visible={editing === 'risk'}
        currentLevel={profile?.riskLevel ?? 5}
        onSave={handleRiskSave}
        onClose={() => setEditing(null)}
      />
    </View>
  );
}
