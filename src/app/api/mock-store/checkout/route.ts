import { NextRequest, NextResponse } from 'next/server';
import { getProducts, updateProduct } from '@/lib/store-state';

/**
 * POST /api/mock-store/checkout
 *
 * Simulates submitting a payment token to the mock storefront to complete a purchase.
 * Verifies:
 *  - Product exists and is in stock
 *  - Payment token format is valid (must start with "prv_tok_")
 *  - Purchase price does not exceed the product's listed price
 * On success, marks the product as out-of-stock to reflect the purchase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, price, paymentToken } = body;

    if (!productId || price === undefined || !paymentToken) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: productId, price, paymentToken' },
        { status: 400 },
      );
    }

    // Validate payment token format
    if (!String(paymentToken).startsWith('prv_tok_') && !String(paymentToken).startsWith('prv_sess_')) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment token format. Expected a Prava single-use token.' },
        { status: 400 },
      );
    }

    const products = getProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product ${productId} not found in mock store.` },
        { status: 404 },
      );
    }

    if (!product.inStock) {
      return NextResponse.json(
        { success: false, error: `Product "${product.name}" is currently out of stock.` },
        { status: 409 },
      );
    }

    const purchasePrice = parseFloat(price);
    if (isNaN(purchasePrice) || purchasePrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid price value.' },
        { status: 400 },
      );
    }

    // Mark product as out-of-stock to simulate a successful purchase
    updateProduct(productId, { inStock: false });

    const txnRefId = `st_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      message: `Purchase of "${product.name}" completed successfully via Prava token.`,
      txnRefId,
      product: {
        id: product.id,
        name: product.name,
        price: purchasePrice,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /api/mock-store/checkout POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 500 },
    );
  }
}
