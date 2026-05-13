import React, { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  KPI,
  PageLayout,
  Sparkline,
} from '@/components';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/' },
  { id: 'terminal', label: 'Product Terminal', href: '/terminal' },
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { id: 'forum', label: 'Community Forum', href: '/forum' },
  { id: 'billing', label: 'Billing', href: '/billing' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
];

interface Product {
  sku: string;
  upc?: string;
  title: string;
  brand: string;
  oem: string;
  tier: 'builder' | 'standard' | 'contractor' | 'pro';
  rating: number;
  reviews: number;
  inStock: boolean;
  tracked: boolean;
  components: Array<{ id: string; name: string; type: string }>;
  oemLineage: string[];
}

interface RetailerRow {
  retailer: string;
  channel: 'retail' | 'trade' | 'intl';
  price: number;
  delta24h: number;
  stock: 'in_stock' | 'low' | 'bulk' | 'special' | 'out';
  markup: number;
}

interface AIInsight {
  id: string;
  tag: 'GRADE' | 'OEM' | 'FAILURE' | 'PRICING' | 'SOURCE' | 'CONTRACTOR' | 'MARKET' | 'RISK' | 'OPPORTUNITY';
  text: string;
  confidence: number;
  timestamp: string;
}

export const ProductTerminal: React.FC = () => {
  const [activeNav, setActiveNav] = useState('terminal');
  const [searchQuery, setSearchQuery] = useState('9159-AR-DST');

  const [product] = useState<Product>({
    sku: '9159-AR-DST',
    upc: '034449630906',
    title: 'Trinsic Single-Handle Faucet with Integrated Diverter',
    brand: 'Delta Faucet Co.',
    oem: 'Masco Corp.',
    tier: 'contractor',
    rating: 4.7,
    reviews: 1247,
    inStock: true,
    tracked: true,
    components: [
      { id: '1', name: 'RP Cartridge', type: 'Replacement Part' },
      { id: '2', name: 'Aerator', type: 'Flow Control' },
      { id: '3', name: 'Adapter Rings', type: 'Hardware' },
    ],
    oemLineage: ['Masco Corp.', 'Delta Faucet Co.', 'Cassidy'],
  });

  const [retailers] = useState<RetailerRow[]>([
    {
      retailer: 'Home Depot',
      channel: 'retail',
      price: 185.99,
      delta24h: -1.2,
      stock: 'in_stock',
      markup: 0.35,
    },
    {
      retailer: 'Lowe\'s',
      channel: 'retail',
      price: 189.99,
      delta24h: 0.5,
      stock: 'in_stock',
      markup: 0.38,
    },
    {
      retailer: 'Menards',
      channel: 'retail',
      price: 179.99,
      delta24h: -2.1,
      stock: 'in_stock',
      markup: 0.32,
    },
    {
      retailer: 'Ferguson',
      channel: 'trade',
      price: 155.5,
      delta24h: 0.0,
      stock: 'in_stock',
      markup: 0.22,
    },
    {
      retailer: 'Grainger',
      channel: 'trade',
      price: 165.0,
      delta24h: 1.8,
      stock: 'low',
      markup: 0.28,
    },
  ]);

  const [insights] = useState<AIInsight[]>([
    {
      id: '1',
      tag: 'PRICING',
      text: 'Menards offering 12% discount vs avg retail. Best price point.',
      confidence: 0.95,
      timestamp: '2 min ago',
    },
    {
      id: '2',
      tag: 'OPPORTUNITY',
      text: 'Bulk order (50+) eligible for trade pricing. Save $1,500+.',
      confidence: 0.88,
      timestamp: '5 min ago',
    },
    {
      id: '3',
      tag: 'CONTRACTOR',
      text: 'Delta contractor line has 18mo warranty vs 5yr consumer line.',
      confidence: 0.92,
      timestamp: '12 min ago',
    },
    {
      id: '4',
      tag: 'MARKET',
      text: 'Delta facing shortage next quarter. Current stock healthy.',
      confidence: 0.76,
      timestamp: '23 min ago',
    },
    {
      id: '5',
      tag: 'OEM',
      text: 'Masco phasing out RP cartridge. Stock dwindling.',
      confidence: 0.82,
      timestamp: '45 min ago',
    },
  ]);

  const [priceHistory] = useState<number[]>([
    180, 182, 181, 185, 184, 186, 188, 187, 189, 188, 186, 185.99,
  ]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'builder':
        return 'cyan';
      case 'standard':
        return 'cyan';
      case 'contractor':
        return 'copper';
      case 'pro':
        return 'violet';
      default:
        return 'cyan';
    }
  };

  const getStockColor = (stock: string) => {
    switch (stock) {
      case 'in_stock':
        return 'ok';
      case 'low':
        return 'warn';
      case 'out':
        return 'bad';
      default:
        return 'cyan';
    }
  };

  const getStockLabel = (stock: string) => {
    switch (stock) {
      case 'in_stock':
        return 'In Stock';
      case 'low':
        return 'Low';
      case 'bulk':
        return 'Bulk';
      case 'special':
        return 'Special Order';
      case 'out':
        return 'Out';
      default:
        return stock;
    }
  };

  const avgPrice = retailers.reduce((sum, r) => sum + r.price, 0) / retailers.length;
  const lowestPrice = Math.min(...retailers.map(r => r.price));
  const highestPrice = Math.max(...retailers.map(r => r.price));

  return (
    <PageLayout
      active={activeNav}
      navItems={NAV_ITEMS}
      onNavigate={setActiveNav}
      crumbs={['Product Terminal', product.sku]}
      liveIndicator={true}
      logo={
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded"
            style={{ background: 'var(--grad-iq)' }}
          />
          <span className="font-bold text-sm">Masco Intel</span>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Search Bar */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by SKU, UPC, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-line-2"
            style={{
              backgroundColor: 'var(--bg-2)',
              color: 'var(--ink-0)',
            }}
          />
          <Button variant="primary">Search</Button>
        </div>

        {/* Product Header + KPIs */}
        <div>
          <div className="mb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Chip variant={getTierColor(product.tier)}>
                    {product.tier.toUpperCase()}
                  </Chip>
                  {product.tracked && (
                    <Chip variant="cyan">★ TRACKED</Chip>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
                <div className="flex items-center gap-4 text-sm text-ink-2">
                  <span>
                    <strong>{product.brand}</strong>
                  </span>
                  <span>OEM: {product.oem}</span>
                  <span>
                    ⭐ {product.rating} ({product.reviews.toLocaleString()} reviews)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="default">Compare</Button>
                <Button variant="accent">Track Changes</Button>
              </div>
            </div>
          </div>

          {/* Price KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <KPI
              label="Average Price"
              value={`$${avgPrice.toFixed(2)}`}
              spark={priceHistory}
              color="cyan"
            />
            <KPI
              label="Lowest Price"
              value={`$${lowestPrice.toFixed(2)}`}
              delta={-5.2}
              deltaDir="down"
              color="ok"
              spark={priceHistory}
            />
            <KPI
              label="Price Range"
              value={`$${(highestPrice - lowestPrice).toFixed(2)}`}
              unit="spread"
              color="copper"
              spark={priceHistory}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Components + OEM */}
          <div className="space-y-6">
            {/* Components */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">Components</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {product.components.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-start justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-2)' }}
                  >
                    <div>
                      <div className="font-medium text-sm">{comp.name}</div>
                      <div className="text-xs text-ink-3">{comp.type}</div>
                    </div>
                    <Button size="sm">Details</Button>
                  </div>
                ))}
              </CardBody>
            </Card>

            {/* OEM Lineage */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">OEM Lineage</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {product.oemLineage.map((oem, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {idx > 0 && <span className="text-ink-3">↓</span>}
                      <Chip variant="violet" className="text-xs">
                        {oem}
                      </Chip>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Center: Price Comparison Table */}
          <Card className="col-span-2">
            <CardHeader>
              <h3 className="text-base font-semibold">Retailer Comparison</h3>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line-2">
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Retailer
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Channel
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-2">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-2">
                        24h Change
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-ink-2">
                        Stock
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-2">
                        Markup
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-ink-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {retailers.map((retailer, idx) => (
                      <tr key={idx} className="border-b border-line-1 hover:bg-bg-2 transition">
                        <td className="py-3 px-4 font-medium">{retailer.retailer}</td>
                        <td className="py-3 px-4 text-ink-2">{retailer.channel}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          ${retailer.price.toFixed(2)}
                        </td>
                        <td
                          className="py-3 px-4 text-right font-mono"
                          style={{
                            color:
                              retailer.delta24h < 0
                                ? 'var(--ok)'
                                : 'var(--bad)',
                          }}
                        >
                          {retailer.delta24h > 0 ? '+' : ''}
                          {retailer.delta24h.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Chip variant={getStockColor(retailer.stock)} className="text-xs">
                            {getStockLabel(retailer.stock)}
                          </Chip>
                        </td>
                        <td className="py-3 px-4 text-right text-ink-2">
                          {(retailer.markup * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button size="sm">Buy</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* AI Insight Stream */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded"
                style={{ background: 'var(--violet)' }}
              />
              <h3 className="text-base font-semibold">AI Insight Stream</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 rounded-lg border border-line-1"
                  style={{ backgroundColor: 'var(--bg-2)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Chip variant="violet" className="text-xs">
                      {insight.tag}
                    </Chip>
                    <div className="text-xs text-ink-3">
                      <div>{(insight.confidence * 100).toFixed(0)}% confidence</div>
                      <div>{insight.timestamp}</div>
                    </div>
                  </div>
                  <p className="text-sm text-ink-1">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ProductTerminal;
