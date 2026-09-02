/**
 * Runtime Guard Script: Strict Bun (v1.4+) Enforcement
 * 
 * Ensures that this codebase is strictly executed via Bun v1.4+
 * and immediately blocks execution under Node.js, npm, yarn, or pnpm.
 */

export const MIN_BUN_VERSION = '1.4.0';

export interface RuntimeCheckResult {
  valid: boolean;
  runtime: 'bun' | 'node' | 'unknown';
  version?: string;
  error?: string;
}

export function parseSemver(versionStr: string): { major: number; minor: number; patch: number } | null {
  const clean = versionStr.replace(/^v/, '').split('-')[0];
  const parts = clean.split('.').map((p) => parseInt(p, 10));
  if (parts.length < 2 || parts.some(isNaN)) return null;
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2] ?? 0,
  };
}

export function isVersionAtLeast(actual: string, minimum: string): boolean {
  const actualSemver = parseSemver(actual);
  const minSemver = parseSemver(minimum);

  if (!actualSemver || !minSemver) return false;

  if (actualSemver.major > minSemver.major) return true;
  if (actualSemver.major < minSemver.major) return false;

  if (actualSemver.minor > minSemver.minor) return true;
  if (actualSemver.minor < minSemver.minor) return false;

  return actualSemver.patch >= minSemver.patch;
}

export function checkBunRuntime(): RuntimeCheckResult {
  const isBun = typeof Bun !== 'undefined' && typeof process !== 'undefined' && Boolean(process.versions?.bun);

  if (!isBun) {
    return {
      valid: false,
      runtime: 'node',
      error: 'Running under Node.js or an unsupported runtime. kurs-world strictly mandates Bun (v1.4+).',
    };
  }

  const bunVersion = Bun.version;
  if (!isVersionAtLeast(bunVersion, MIN_BUN_VERSION)) {
    return {
      valid: false,
      runtime: 'bun',
      version: bunVersion,
      error: `Bun version v${bunVersion} is lower than the mandatory minimum v${MIN_BUN_VERSION}. Please run 'bun upgrade'.`,
    };
  }

  // Check npm / yarn / pnpm user agents
  const userAgent = process.env.npm_config_user_agent || '';
  if (userAgent.startsWith('npm/') || userAgent.startsWith('yarn/') || userAgent.startsWith('pnpm/')) {
    const agentName = userAgent.split('/')[0];
    return {
      valid: false,
      runtime: 'unknown',
      error: `Detected invocation via '${agentName}'. kurs-world strictly prohibits npm/yarn/pnpm. Use 'bun' exclusively.`,
    };
  }

  return {
    valid: true,
    runtime: 'bun',
    version: bunVersion,
  };
}

// Execute check when run directly as CLI script
if (import.meta.main) {
  const result = checkBunRuntime();

  if (!result.valid) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ [FATAL RUNTIME ERROR] Strict Bun Requirement Violated');
    console.error('='.repeat(70));
    console.error(`\n  Reason: ${result.error}\n`);
    console.error('  👉 How to resolve:');
    console.error('     1. Install or upgrade Bun (v1.4+):');
    console.error('        curl -fsSL https://bun.sh/install | bash');
    console.error('        bun upgrade');
    console.error('     2. Run commands using bun:');
    console.error('        bun install');
    console.error('        bun run dev');
    console.error('        bun test\n');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  } else {
    console.log(`⚡ Strict Runtime Check Passed: Bun v${result.version} (Minimum >= v${MIN_BUN_VERSION})`);
  }
}
