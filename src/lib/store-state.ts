import fs from 'fs';
import path from 'path';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  inStock: boolean;
  category: string;
}

export interface DomainMock {
  domain: string;
  available: boolean;
}

export interface StoreState {
  products: Product[];
  domainMocks: { [domain: string]: boolean };
}

const STATE_FILE_PATH = path.join(process.cwd(), 'src/lib/mock-store-state.json');

const DEFAULT_STATE: StoreState = {
  products: [
    {
      id: 'prod_sony_xm5',
      name: 'Sony WH-1000XM5 Wireless Headphones',
      price: 348.00,
      originalPrice: 398.00,
      inStock: true,
      category: 'Electronics'
    },
    {
      id: 'prod_keychron_k2',
      name: 'Keychron K2 Wireless Mechanical Keyboard',
      price: 89.99,
      originalPrice: 99.99,
      inStock: false, // Starts as out of stock, toggle can bring it in stock or drop price
      category: 'Peripherals'
    },
    {
      id: 'prod_dell_u2723qe',
      name: 'Dell UltraSharp U2723QE 27" 4K Monitor',
      price: 479.99,
      originalPrice: 529.99,
      inStock: true, // Drop price to <= $450 to trigger
      category: 'Electronics'
    },
    {
      id: 'prod_sayl_chair',
      name: 'Herman Miller Sayl Ergonomic Gaming Chair',
      price: 699.99,
      originalPrice: 799.99,
      inStock: true,
      category: 'Office'
    },
    {
      id: 'prod_ipad_air',
      name: 'Apple iPad Air 11-inch M2 (128GB)',
      price: 599.00,
      originalPrice: 599.00,
      inStock: false,
      category: 'Electronics'
    }
  ],
  domainMocks: {
    'indigo.dev': false,
    'dev.io': false,
    'tech.ai': false
  }
};

// Ensure directories exist
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

export function readState(): StoreState {
  try {
    if (!fs.existsSync(STATE_FILE_PATH)) {
      ensureDirectoryExistence(STATE_FILE_PATH);
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
      return DEFAULT_STATE;
    }
    const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading mock store state:', error);
    return DEFAULT_STATE;
  }
}

export function writeState(state: StoreState): boolean {
  try {
    ensureDirectoryExistence(STATE_FILE_PATH);
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing mock store state:', error);
    return false;
  }
}

export function getProducts(): Product[] {
  return readState().products;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const state = readState();
  const index = state.products.findIndex(p => p.id === id);
  if (index === -1) return null;

  state.products[index] = {
    ...state.products[index],
    ...updates
  };

  writeState(state);
  return state.products[index];
}

export function getDomainMocks(): { [domain: string]: boolean } {
  return readState().domainMocks;
}

export function updateDomainMock(domain: string, available: boolean): void {
  const state = readState();
  const cleanDomain = domain.toLowerCase().trim();
  state.domainMocks[cleanDomain] = available;
  writeState(state);
}

export function resetState(): StoreState {
  writeState(DEFAULT_STATE);
  return DEFAULT_STATE;
}
