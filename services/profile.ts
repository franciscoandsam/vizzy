/**
 * User Profile Management
 *
 * Handles the user's financial profile created during onboarding.
 * Stores preferences, risk tolerance, and financial goals.
 */

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type InvestmentStyle = 'income' | 'growth' | 'balanced' | 'speculative';
export type TimeHorizon = 'short' | 'medium' | 'long';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  riskTolerance: RiskTolerance;
  investmentStyle: InvestmentStyle;
  timeHorizon: TimeHorizon;
  monthlySavings: number;
  topPriorities: string[];
  interviewTranscript?: string;
  createdAt: string;
  updatedAt: string;
};

// Default profile for new users / demo
const defaultProfile: UserProfile = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@vizzy.money',
  riskTolerance: 'moderate',
  investmentStyle: 'growth',
  timeHorizon: 'long',
  monthlySavings: 800,
  topPriorities: ['retirement', 'emergency-fund', 'home-ownership'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let currentProfile: UserProfile = { ...defaultProfile };

/**
 * Get the current user profile
 */
export function getProfile(): UserProfile {
  return currentProfile;
}

/**
 * Update user profile from interview results
 */
export function updateProfile(updates: Partial<UserProfile>): UserProfile {
  currentProfile = {
    ...currentProfile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return currentProfile;
}

/**
 * Process interview transcript and extract profile attributes
 * TODO: Implement with OpenRouter AI analysis
 */
export async function processInterview(
  transcript: string
): Promise<Partial<UserProfile>> {
  // Stub - will use OpenRouter to analyze interview transcript
  console.log('Processing interview transcript:', transcript.substring(0, 100));

  return {
    riskTolerance: 'moderate',
    investmentStyle: 'growth',
    timeHorizon: 'long',
    monthlySavings: 800,
    topPriorities: ['retirement', 'emergency-fund'],
    interviewTranscript: transcript,
  };
}

/**
 * Reset profile to defaults
 */
export function resetProfile(): void {
  currentProfile = { ...defaultProfile };
}
