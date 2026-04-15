/**
 * 👥 PROFILES - Test Factories
 */
export function createMockProfile(overrides: Record<string, any> = {}) {
  return {
    id: 'factory-profile-id',
    name: 'Factory User',
    username: 'factoryuser',
    ...overrides,
  };
}
