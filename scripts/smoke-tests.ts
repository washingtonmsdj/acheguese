/**
 * Smoke Tests
 * 
 * Validates critical flows are working.
 * 
 * Usage:
 *   npx tsx scripts/smoke-tests.ts [environment]
 * 
 * Environments:
 *   - local (default): http://localhost:5173
 *   - staging: https://staging.ordax.com.br
 *   - production: https://ordax.com.br
 * 
 * @version 1.0.0
 */

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class SmokeTestRunner {
  private baseUrl: string;
  private results: TestResult[] = [];
  
  constructor(environment: string = 'local') {
    const urls: Record<string, string> = {
      local: 'http://localhost:8080',
      staging: 'https://staging.ordax.com.br',
      production: 'https://ordax.com.br',
    };
    
    this.baseUrl = urls[environment] || urls.local;
  }
  
  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: true,
        duration,
      });
      
      console.log(`✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      
      console.error(`❌ ${name} (${duration}ms)`);
      console.error(`   Error: ${error}`);
    }
  }
  
  async testPageLoads(path: string, expectedText?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    if (expectedText && !html.includes(expectedText)) {
      throw new Error(`Expected text "${expectedText}" not found`);
    }
  }
  
  async testApiEndpoint(path: string, expectedStatus: number = 200): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`);
    
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }
  }
  
  async run(): Promise<void> {
    console.log('🚀 Starting Smoke Tests\n');
    console.log(`🌐 Environment: ${this.baseUrl}\n`);
    
    // Test 1: Homepage loads
    await this.runTest('Homepage loads', async () => {
      await this.testPageLoads('/');
    });
    
    // Test 2: Auth page loads
    await this.runTest('Auth page loads', async () => {
      await this.testPageLoads('/auth');
    });
    
    // Test 3: Gastronomia page loads
    await this.runTest('Gastronomia page loads', async () => {
      await this.testPageLoads('/gastronomia');
    });
    
    // Test 4: Mobilidade page loads
    await this.runTest('Mobilidade page loads', async () => {
      await this.testPageLoads('/mobilidade');
    });
    
    // Test 5: Classificados page loads
    await this.runTest('Classificados page loads', async () => {
      await this.testPageLoads('/classificados');
    });
    
    // Test 6: Eventos page loads
    await this.runTest('Eventos page loads', async () => {
      await this.testPageLoads('/eventos');
    });
    
    // Test 7: Comunidade page loads
    await this.runTest('Comunidade page loads', async () => {
      await this.testPageLoads('/comunidade');
    });
    
    // Test 8: Status page loads
    await this.runTest('Status page loads', async () => {
      await this.testPageLoads('/status');
    });
    
    // Test 9: Robots.txt exists
    await this.runTest('Robots.txt exists', async () => {
      await this.testApiEndpoint('/robots.txt');
    });
    
    // Test 10: Sitemap.xml exists
    await this.runTest('Sitemap.xml exists', async () => {
      await this.testApiEndpoint('/sitemap.xml');
    });
    
    // Test 11: Manifest.json exists
    await this.runTest('Manifest.json exists', async () => {
      await this.testApiEndpoint('/manifest.json');
    });
    
    // Test 12: Service Worker exists
    await this.runTest('Service Worker exists', async () => {
      await this.testApiEndpoint('/sw.js');
    });
    
    this.printSummary();
  }
  
  printSummary(): void {
    console.log('\n📊 Test Summary\n');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Total: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:\n');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.name}`);
          console.log(`     ${r.error}`);
        });
      
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
    }
  }
}

async function main() {
  const environment = process.argv[2] || 'local';
  const runner = new SmokeTestRunner(environment);
  await runner.run();
}

main().catch((error) => {
  console.error('\n❌ Smoke tests failed:', error);
  process.exit(1);
});
