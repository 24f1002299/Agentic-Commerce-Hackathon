import { chromium } from 'playwright';

export interface PlaywrightCheckoutParams {
  checkoutUrl: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface PlaywrightCheckoutResult {
  success: boolean;
  receiptUrl?: string;
  error?: string;
}

/**
 * Headless browser automation script to complete checkout when API integration fails.
 * Fills in the card details and returns the receipt URL.
 */
export async function runPlaywrightCheckout(
  params: PlaywrightCheckoutParams
): Promise<PlaywrightCheckoutResult> {
  let browser = null;
  try {
    console.log(`[Playwright Fallback] Starting browser checkout flow at: ${params.checkoutUrl}`);
    
    // Launch headless chromium browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    
    const page = await context.newPage();

    // Navigate to checkout URL and wait for inputs to load
    await page.goto(params.checkoutUrl, { waitUntil: 'networkidle', timeout: 15000 });

    console.log('[Playwright Fallback] Checkout page loaded. Filling inputs...');
    
    // Wait for card details inputs and fill them
    await page.waitForSelector('#card-number', { timeout: 5000 });
    await page.fill('#card-number', params.cardNumber);

    await page.waitForSelector('#expiry', { timeout: 5000 });
    await page.fill('#expiry', params.expiry);

    await page.waitForSelector('#cvv', { timeout: 5000 });
    await page.fill('#cvv', params.cvv);

    console.log('[Playwright Fallback] Credentials filled. Submitting payment form...');
    
    // Submit payment
    await page.click('#pay-button');

    console.log('[Playwright Fallback] Awaiting receipt link validation...');
    
    // Wait for receipt link to be rendered in DOM
    await page.waitForSelector('#receipt-link', { timeout: 15000 });

    // Extract receipt URL
    const receiptUrl = await page.$eval('#receipt-link', (el) => el.getAttribute('href'));
    
    console.log(`[Playwright Fallback] Purchase successful! Receipt URL: ${receiptUrl}`);

    await browser.close();
    
    return {
      success: true,
      receiptUrl: receiptUrl || undefined,
    };
  } catch (error: any) {
    console.error('[Playwright Fallback] Execution error:', error);
    
    // Close browser if it was successfully initialized
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error('[Playwright Fallback] Error closing browser:', closeErr);
      }
    }
    
    return {
      success: false,
      error: error.message || 'Unknown browser checkout error.',
    };
  }
}
