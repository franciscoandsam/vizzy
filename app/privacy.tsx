import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Privacy Policy</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 40,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.date}>Last updated: February 2026</Text>

        <Text style={styles.body}>
          This Privacy Policy explains how Zote Ltd ("we", "us", "our"), a company registered in England and Wales, collects, uses, and protects your personal data when you use the Vizzy mobile application ("App").
        </Text>

        <Text style={styles.heading}>1. Data Controller</Text>
        <Text style={styles.body}>
          Zote Ltd is the data controller for the purposes of the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.{'\n\n'}
          Contact: support@zotehr.com
        </Text>

        <Text style={styles.heading}>2. Data We Collect</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Data you provide:</Text> Name, onboarding answers (age, risk tolerance, financial goals, investment preferences), voice recordings (processed for transcription only, not stored).{'\n\n'}
          <Text style={styles.bold}>Data collected automatically:</Text> Device type, app usage analytics, crash reports.{'\n\n'}
          <Text style={styles.bold}>Purchase data:</Text> Subscription status and purchase history (managed by Apple/Google via RevenueCat).
        </Text>

        <Text style={styles.heading}>3. How We Use Your Data</Text>
        <Text style={styles.body}>
          We use your data to:{'\n'}
          {'\u2022'} Generate personalised investment insights and AI responses{'\n'}
          {'\u2022'} Manage your subscription and in-app purchases{'\n'}
          {'\u2022'} Improve the App and fix bugs{'\n'}
          {'\u2022'} Comply with legal obligations
        </Text>

        <Text style={styles.heading}>4. Legal Basis for Processing (UK GDPR)</Text>
        <Text style={styles.body}>
          We process your data based on:{'\n'}
          {'\u2022'} <Text style={styles.bold}>Contract:</Text> To provide the App services you requested{'\n'}
          {'\u2022'} <Text style={styles.bold}>Legitimate interest:</Text> To improve and secure the App{'\n'}
          {'\u2022'} <Text style={styles.bold}>Consent:</Text> For voice recording and optional data you choose to provide
        </Text>

        <Text style={styles.heading}>5. Data Storage</Text>
        <Text style={styles.body}>
          Your profile and preferences are stored locally on your device using encrypted storage. Voice recordings are sent to a third-party transcription service for processing and are not stored by us. We do not maintain a server-side database of your personal data.
        </Text>

        <Text style={styles.heading}>6. Third-Party Services</Text>
        <Text style={styles.body}>
          The App uses the following third-party services:{'\n'}
          {'\u2022'} <Text style={styles.bold}>RevenueCat</Text> — Subscription management{'\n'}
          {'\u2022'} <Text style={styles.bold}>OpenRouter / AI providers</Text> — AI-generated content{'\n'}
          {'\u2022'} <Text style={styles.bold}>OVH Cloud</Text> — Voice transcription{'\n\n'}
          These services have their own privacy policies. We encourage you to review them.
        </Text>

        <Text style={styles.heading}>7. Data Sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal data. We only share data with third-party services as described above, and as required by law.
        </Text>

        <Text style={styles.heading}>8. Data Retention</Text>
        <Text style={styles.body}>
          Since data is stored locally on your device, it is retained until you delete the App or clear the App's data. Voice recordings are processed in real-time and are not retained after transcription.
        </Text>

        <Text style={styles.heading}>9. Your Rights (UK GDPR)</Text>
        <Text style={styles.body}>
          You have the right to:{'\n'}
          {'\u2022'} Access your personal data{'\n'}
          {'\u2022'} Rectify inaccurate data{'\n'}
          {'\u2022'} Erase your data ("right to be forgotten"){'\n'}
          {'\u2022'} Restrict processing{'\n'}
          {'\u2022'} Data portability{'\n'}
          {'\u2022'} Object to processing{'\n'}
          {'\u2022'} Withdraw consent at any time{'\n\n'}
          To exercise any of these rights, contact us at support@zotehr.com.
        </Text>

        <Text style={styles.heading}>10. Children's Privacy</Text>
        <Text style={styles.body}>
          The App is not intended for users under 18. We do not knowingly collect data from children. If you believe a child has provided us with personal data, please contact us and we will delete it.
        </Text>

        <Text style={styles.heading}>11. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of material changes through the App. Continued use after changes constitutes acceptance.
        </Text>

        <Text style={styles.heading}>12. Contact & Complaints</Text>
        <Text style={styles.body}>
          For any questions or complaints about this policy or your data:
        </Text>
        <Text style={styles.contact}>
          Zote Ltd{'\n'}
          United Kingdom{'\n'}
          support@zotehr.com
        </Text>
        <Text style={[styles.body, { marginTop: 12 }]}>
          You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = {
  date: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 20,
  } as const,
  heading: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 4,
  } as const,
  bold: {
    fontWeight: '600' as const,
    color: '#333333',
  },
  contact: {
    fontSize: 14,
    color: '#FF8C42',
    lineHeight: 22,
    fontWeight: '600' as const,
    marginTop: 8,
  },
};
