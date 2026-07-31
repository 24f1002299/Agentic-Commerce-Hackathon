import { prisma } from './prisma';
import { getProducts, getDomainMocks } from './store-state';
import { executePurchase } from './execution-engine';

const globalForMonitoring = globalThis as unknown as {
  monitoringEngineStarted: boolean | undefined;
};

/**
 * Runs a single monitoring iteration checking all ACTIVE rules.
 */
export async function runMonitoringCheck() {
  try {
    // Query only rules with status = 'ACTIVE'
    const activeRules = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, userId, naturalLanguageQuery, targetItem, maxBudget, status FROM "Rule" WHERE status = 'ACTIVE';`
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
      const isDomain = target.endsWith('.dev') || 
                       target.endsWith('.com') || 
                       target.endsWith('.io') || 
                       target.endsWith('.ai') || 
                       target.endsWith('.net') || 
                       target.includes('.');

      if (isDomain) {
        // Evaluate domain mock status
        const isAvailable = domainMocks[target];
        if (isAvailable === true) {
          await executePurchase(
            rule, 
            `Domain ${rule.targetItem} became AVAILABLE for registration`
          );
        }
      } else {
        // Evaluate product rules
        const matchedProduct = products.find(p => 
          p.name.toLowerCase().includes(target) || 
          target.includes(p.name.toLowerCase()) ||
          p.id.toLowerCase().includes(target)
        );

        if (matchedProduct) {
          const isPriceUnderBudget = matchedProduct.price <= rule.maxBudget;
          const isInStock = matchedProduct.inStock;

          if (isInStock && isPriceUnderBudget) {
            await executePurchase(
              rule, 
              `Product is IN STOCK at $${matchedProduct.price.toFixed(2)} (Budget: $${rule.maxBudget.toFixed(2)})`
            );
          }
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
