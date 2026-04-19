/**
 * Feature Flags System
 * 
 * Controls feature availability based on environment, user, and rollout percentage.
 * 
 * Features:
 * - Environment-based flags
 * - User-based flags
 * - Percentage-based rollout
 * - Territory-based rollout
 * 
 * @module FeatureFlags
 * @version 1.0.0
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  allowedUsers?: string[];
  allowedTerritories?: string[];
  environments?: ('development' | 'staging' | 'production')[];
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Gastronomia
  GASTRONOMY_CHECKOUT: {
    key: 'gastronomy_checkout',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  
  GASTRONOMY_SUBSCRIPTIONS: {
    key: 'gastronomy_subscriptions',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  
  // Mobilidade
  MOBILITY_RIDE_REQUESTS: {
    key: 'mobility_ride_requests',
    enabled: true,
    rolloutPercentage: 50, // 50% rollout
    environments: ['development', 'staging', 'production'],
  },
  
  MOBILITY_AUTO_DISPATCH: {
    key: 'mobility_auto_dispatch',
    enabled: false, // Disabled for now
    rolloutPercentage: 0,
    environments: ['development', 'staging'],
  },
  
  // Comunidade
  COMMUNITY_POSTS: {
    key: 'community_posts',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  
  COMMUNITY_POLLS: {
    key: 'community_polls',
    enabled: true,
    rolloutPercentage: 75, // 75% rollout
    environments: ['development', 'staging', 'production'],
  },
  
  // Eventos
  EVENTS_TICKETING: {
    key: 'events_ticketing',
    enabled: false, // Coming soon
    rolloutPercentage: 0,
    environments: ['development'],
  },
  
  // Admin
  ADMIN_ANALYTICS: {
    key: 'admin_analytics',
    enabled: true,
    rolloutPercentage: 100,
    allowedUsers: ['admin', 'super_admin'],
    environments: ['development', 'staging', 'production'],
  },
};

/**
 * Check if feature is enabled for current user/environment
 */
export function isFeatureEnabled(
  featureKey: string,
  userId?: string,
  territory?: string
): boolean {
  const flag = FEATURE_FLAGS[featureKey];
  
  if (!flag) {
    console.warn(`Feature flag not found: ${featureKey}`);
    return false;
  }
  
  // Check if feature is globally disabled
  if (!flag.enabled) {
    return false;
  }
  
  // Check environment
  const currentEnv = import.meta.env.MODE as 'development' | 'staging' | 'production';
  if (flag.environments && !flag.environments.includes(currentEnv)) {
    return false;
  }
  
  // Check allowed users
  if (flag.allowedUsers && userId) {
    if (!flag.allowedUsers.includes(userId)) {
      return false;
    }
  }
  
  // Check allowed territories
  if (flag.allowedTerritories && territory) {
    if (!flag.allowedTerritories.includes(territory)) {
      return false;
    }
  }
  
  // Check rollout percentage
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    if (!userId) {
      return false;
    }
    
    // Deterministic hash-based rollout
    const hash = hashString(userId + featureKey);
    const percentage = hash % 100;
    
    return percentage < flag.rolloutPercentage;
  }
  
  return true;
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get all enabled features for user
 */
export function getEnabledFeatures(userId?: string, territory?: string): string[] {
  return Object.keys(FEATURE_FLAGS).filter(key =>
    isFeatureEnabled(key, userId, territory)
  );
}

/**
 * Get feature flag details
 */
export function getFeatureFlag(featureKey: string): FeatureFlag | undefined {
  return FEATURE_FLAGS[featureKey];
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): Record<string, FeatureFlag> {
  return FEATURE_FLAGS;
}
