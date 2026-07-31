import { NextRequest, NextResponse } from 'next/server';
import { getProducts, updateProduct, resetState } from '@/lib/store-state';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inStockOverride = searchParams.get('in_stock');
    const priceOverride = searchParams.get('price');
    const productId = searchParams.get('id');

    let products = getProducts();

    // Apply overrides if passed in query parameters for direct toggle simulation
    if (inStockOverride !== null) {
      const targetStock = inStockOverride === 'true';
      products = products.map((p) => {
        // If an ID is provided, only override that product, otherwise override all
        if (!productId || p.id === productId) {
          return { ...p, inStock: targetStock };
        }
        return p;
      });
    }

    if (priceOverride !== null) {
      const targetPrice = parseFloat(priceOverride);
      if (!isNaN(targetPrice)) {
        products = products.map((p) => {
          if (!productId || p.id === productId) {
            return { ...p, price: targetPrice };
          }
          return p;
        });
      }
    }

    return NextResponse.json({
      success: true,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /api/mock-store/products GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, inStock, price } = body;

    if (action === 'reset') {
      const state = resetState();
      return NextResponse.json({
        success: true,
        message: 'Mock store reset to defaults',
        products: state.products,
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (inStock !== undefined) {
      updates.inStock = !!inStock;
    }
    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (!isNaN(numPrice) && numPrice >= 0) {
        updates.price = numPrice;
      }
    }

    const updated = updateProduct(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Product with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: updated,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('API /api/mock-store/products POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}
