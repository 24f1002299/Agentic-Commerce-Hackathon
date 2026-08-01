import { prisma } from './prisma';
import { getProducts, getDomainMocks } from './store-state';

const globalForMonitoring = globalThis as unknown as {
  monitoringEngineStarted: boolean | undefined;
};

/**
 * Runs a single monitoring iteration checking all ACTIVE rules.
 * Delegates execution to /api/execute-purchase to keep a single source
 * of truth for payment logic, budget caps, and audit logging.
 */
export async function runMonitoringCheck() {
  try {
    // Query only rules with status = 'ACTIVE'
    const activeRules = await prisma.$queryRawUnsafe<
      { id: string; userId: string; naturalLanguageQuery: string; targetItem: string; maxBudget: number; status: string }[]
    >(
      `SELECT id, "userId", "naturalLanguageQuery", "targetItem", "maxBudget", status FROM "Rule" WHERE status = 'ACTIVE';`,
    );

    if (!activeRules || activeRules.length === 0) {
      return;
    }

    console.log(`[Monitoring Engine] Checking ${activeRules.length} active rule(s)...`);

    const products = getProducts();
    const domainMocks = getDomainMocks();

    for (const rule of activeRules) {
      const target = rule.targetItem.toLowerCase().trim();

      // Determine if it's a domain monitoring rule
      const isDomain =
        target.endsWith('.dev') ||
        target.endsWith('.com') ||
        target.endsWith('.io') ||
        target.endsWith('.ai') ||
        target.endsWith('.net') ||
        target.includes('.');

      let shouldExecute = false;

      if (isDomain) {
        const isAvailable = domainMocks[target];
        if (isAvailable === true) {
          shouldExecute = true;
        }
      } else {
        const matchedProduct = products.find(
          (p) =>
            p.name.toLowerCase().includes(target) ||
            target.includes(p.name.toLowerCase()) ||
            p.id.toLowerCase().includes(target),
        );

        if (matchedProduct) {
          const isPriceUnderBudget = matchedProduct.price <= rule.maxBudget;
          const isInStock = matchedProduct.inStock;

          if (isInStock && isPriceUnderBudget) {
            shouldExecute = true;
          }
        }
      }

      if (shouldExecute) {
        console.log(
          `[Monitoring Engine] Condition met for rule ${rule.id} ("${rule.targetItem}"). Delegating to /api/execute-purchase.`,
        );

        // ── FIX: Use the actual server port, not hardcoded 3000 ──────
        // On HF Spaces PORT=7860; locally PORT=3000 (Next.js default).
        const port = process.env.PORT || '3000';
        const baseUrl = `http://localhost:${port}`;

        try {
          const res = await fetch(`${baseUrl}/api/execute-purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Only send ruleId — the route looks up everything else from DB
            body: JSON.stringify({ ruleId: rule.id }),
          });
          const data = await res.json();
          console.log(
            `[Monitoring Engine] execute-purchase result for rule ${rule.id}:`,
            data.rule_status,
            data.success ? '✅' : `❌ ${data.error}`,
          );
        } catch (fetchErr) {
          console.error(
            `[Monitoring Engine] Failed to call /api/execute-purchase for rule ${rule.id}:`,
            fetchErr,
          );
        }
      }
    }
  } catch (error) {
    console.error('[Monitoring Engine] Error in monitoring run iteration:', error);
  }
}

/**
 * Starts the server-side Reactive Monitoring Engine background execution loop.
 * Safeguarded to run only once, preventing duplicates during development hot-reloads.
 */
export function startMonitoringEngine() {
  if (globalForMonitoring.monitoringEngineStarted) {
    console.log('[Monitoring Engine] Engine already running.');
    return;
  }

  globalForMonitoring.monitoringEngineStarted = true;
  console.log('[Monitoring Engine] Starting background loop (interval: 15s)...');

  const interval = setInterval(async () => {
    await runMonitoringCheck();
  }, 15000);

  // Unref the interval to allow Next.js server to exit cleanly if needed
  if (interval.unref) {
    interval.unref();
  }
}