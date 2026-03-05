import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Terms of Use</Text>
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
          These Terms of Use ("Terms") govern your use of the Vizzy mobile application ("App") operated by Zote Ltd, a company registered in England and Wales ("we", "us", "our").
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By downloading, installing, or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.
        </Text>

        <Text style={styles.heading}>2. Description of Service</Text>
        <Text style={styles.body}>
          Vizzy provides AI-generated investment insights, portfolio analysis, and educational content for informational purposes only. Vizzy does not provide financial advice and is not a registered financial adviser.
        </Text>

        <Text style={styles.heading}>3. Not Financial Advice</Text>
        <Text style={styles.body}>
          All content provided through the App, including portfolio roasts, daily briefings, and AI chat responses, is for informational and entertainment purposes only. It should not be construed as financial, investment, tax, or legal advice. Always consult a qualified financial professional before making investment decisions.
        </Text>

        <Text style={styles.heading}>4. User Accounts</Text>
        <Text style={styles.body}>
          You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
        </Text>

        <Text style={styles.heading}>5. Subscriptions and Purchases</Text>
        <Text style={styles.body}>
          The App offers subscription plans and one-time purchases. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. Payment is charged to your Apple ID or Google Play account. You can manage or cancel subscriptions in your device settings.
        </Text>

        <Text style={styles.heading}>6. Refunds</Text>
        <Text style={styles.body}>
          Refund requests are handled by Apple or Google according to their respective refund policies. Contact them directly for refund enquiries.
        </Text>

        <Text style={styles.heading}>7. Intellectual Property</Text>
        <Text style={styles.body}>
          All content, designs, and code within the App are owned by Zote Ltd or its licensors. You may not copy, modify, distribute, or reverse-engineer any part of the App.
        </Text>

        <Text style={styles.heading}>8. Limitation of Liability</Text>
        <Text style={styles.body}>
          To the fullest extent permitted by law, Zote Ltd shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App, including any financial losses resulting from reliance on App content.
        </Text>

        <Text style={styles.heading}>9. Termination</Text>
        <Text style={styles.body}>
          We may suspend or terminate your access to the App at any time for violation of these Terms or for any other reason at our discretion.
        </Text>

        <Text style={styles.heading}>10. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the new Terms.
        </Text>

        <Text style={styles.heading}>11. Governing Law</Text>
        <Text style={styles.body}>
          These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </Text>

        <Text style={styles.heading}>12. Contact</Text>
        <Text style={styles.body}>
          If you have any questions about these Terms, please contact us at:
        </Text>
        <Text style={styles.contact}>
          Zote Ltd{'\n'}
          United Kingdom{'\n'}
          support@zotehr.com
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
  contact: {
    fontSize: 14,
    color: '#FF8C42',
    lineHeight: 22,
    fontWeight: '600' as const,
    marginTop: 8,
  },
};
