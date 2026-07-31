import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import { getDomainMocks, updateDomainMock } from '@/lib/store-state';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const mockAvailableOverride = searchParams.get('mock_available');

    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return NextResponse.json(
        { success: false, error: 'Domain name is required.' },
        { status: 400 }
      );
    }

    const cleanDomain = domain.toLowerCase().trim();

    // Check query override first
    if (mockAvailableOverride !== null) {
      const isAvailable = mockAvailableOverride === 'true';
      return NextResponse.json({
        success: true,
        domain: cleanDomain,
        available: isAvailable,
        source: 'query_override',
        timestamp: new Date().toISOString(),
      });
    }

    // Check persistent mock in store-state
    const mocks = getDomainMocks();
    if (mocks[cleanDomain] !== undefined) {
      return NextResponse.json({
        success: true,
        domain: cleanDomain,
        available: mocks[cleanDomain],
        source: 'persistent_mock',
        timestamp: new Date().toISOString(),
      });
    }

    // Perform actual RDAP check
    let available = false;
    let source = 'rdap';
    let details = '';

    try {
      // Fetch RDAP (following redirects)
      const rdapUrl = `https://rdap.org/domain/${cleanDomain}`;
      const res = await fetch(rdapUrl, {
        headers: { Accept: 'application/rdap+json, application/json' },
        next: { revalidate: 10 }, // Short cache
      });

      if (res.status === 200) {
        available = false; // Domain exists
        details = 'Domain found in registry database (Status 200)';
      } else if (res.status === 404) {
        available = true; // Domain not found -> available
        details = 'Domain not found in registry (Status 404)';
      } else {
        // Any other code (e.g. rate limit, bad request) -> trigger DNS fallback
        throw new Error(`RDAP returned status ${res.status}`);
      }
    } catch (rdapErr: any) {
      console.warn(`RDAP check failed for ${cleanDomain}, falling back to DNS resolution:`, rdapErr.message);
      source = 'dns_fallback';
      
      try {
        // Fallback to DNS resolve
        await dns.promises.resolve(cleanDomain);
        available = false; // DNS resolved -> domain is taken
        details = 'DNS resolution succeeded (host exists)';
      } catch (dnsErr: any) {
        if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA') {
          available = true; // DNS resolved empty -> domain available
          details = 'DNS resolution failed (host not found)';
        } else {
          available = false;
          details = `DNS error: ${dnsErr.code || dnsErr.message}`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      domain: cleanDomain,
      available,
      source,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /api/check-domain error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, available } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: domain' },
        { status: 400 }
      );
    }

    updateDomainMock(domain, !!available);

    return NextResponse.json({
      success: true,
      domain: domain.toLowerCase().trim(),
      available: !!available,
      message: `Availability mock updated for ${domain}`,
    });
  } catch (error: any) {
    console.error('API /api/check-domain POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update domain availability mock' },
      { status: 500 }
    );
  }
}
