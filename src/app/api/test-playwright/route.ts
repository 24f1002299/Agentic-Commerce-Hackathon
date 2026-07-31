import { NextResponse } from 'next/server';
import { runPlaywrightCheckout } from '@/lib/playwright-checkout';
import { getProducts } from '@/lib/store-state';

export async function GET() {
  try {
    const products = getProducts();
    const product = products.find((p) => p.inStock) || products[0];
    
    if (!product) {
      return NextResponse.json({ success: false, error: 'No products available for test.' });
    }

    const testUrl = `http://localhost:3000/mock-store/checkout?productId=${product.id}&price=${product.price}`;
    
    console.log(`[Test Playwright] Running test checkout for product: ${product.name} at ${testUrl}`);

    const result = await runPlaywrightCheckout({
      checkoutUrl: testUrl,
      cardNumber: '4111111111111111',
      expiry: '12/27',
      cvv: '737',
    });

    return NextResponse.json({
      success: result.success,
      product: product.name,
      testUrl,
      receiptUrl: result.receiptUrl,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
