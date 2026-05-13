import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  KPI,
  PageLayout,
  Sparkline,
  NotificationCenter,
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

interface DashboardMetrics {
  totalOrders: number;
  avgCost: number;
  totalSavings: number;
  complianceScore: number;
  orderTrend: number[];
  costTrend: number[];
  savingsTrend: number[];
  complianceTrend: number[];
}

interface WatchlistItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  currentPrice: number;
  priceDelta: number;
  status: 'in_stock' | 'low' | 'out_stock';
}

interface AIInsight {
  id: string;
  tag: 'GRADE' | 'PRICING' | 'FAILURE' | 'MARKET' | 'OPPORTUNITY';
  text: string;
  confidence: number;
}

interface CategoryMetric {
  category: string;
  spending: number;
  percentage: number;
}

export const Dashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);

  const defaultMetrics: DashboardMetrics = {
    totalOrders: 2847,
    avgCost: 385,
    totalSavings: 12500,
    complianceScore: 94,
    orderTrend: [180, 220, 195, 280, 240, 310, 290],
    costTrend: [350, 375, 360, 400, 390, 425, 415],
    savingsTrend: [500, 750, 600, 1200, 950, 1500, 1400],
    complianceTrend: [85, 88, 90, 92, 91, 94, 94],
  };

  const { data: metrics = defaultMetrics, loading: loadingMetrics } = useAPI(
    () => dashboardAPI.getMetrics(),
    []
  );

  const { data: watchlist = [], loading: loadingWatchlist } = useAPI(
    () => dashboardAPI.getWatchlist(),
    []
  );

  const { data: insights = [], loading: loadingInsights } = useAPI(
    () => dashboardAPI.getDigest(),
    []
  );

  const { data: categories = [], loading: loadingCategories } = useAPI(
    () => dashboardAPI.getCategoryHeatmap(),
    []
  );

  const defaultWatchlist: WatchlistItem[] = [
    {
      id: '1',
      sku: '9159-AR-DST',
      name: 'Trinsic Single-Handle Faucet',
      brand: 'Delta',
      currentPrice: 185.99,
      priceDelta: -2.5,
      status: 'in_stock',
    },
    {
      id: '2',
      sku: 'K-2355-AL',
      name: 'Coralais Single-Control Kitchen Sink Faucet',
      brand: 'Kohler',
      currentPrice: 225.5,
      priceDelta: 1.8,
      status: 'in_stock',
    },
    {
      id: '3',
      sku: 'M-8009-N',
      name: 'Centerset Bathroom Sink Faucet',
      brand: 'Moen',
      currentPrice: 145.0,
      priceDelta: -4.2,
      status: 'low',
    },
  ];

  const defaultInsights: AIInsight[] = [
    {
      id: '1',
      tag: 'PRICING',
      text: 'Delta faucets 12% cheaper at Menards this week',
      confidence: 0.92,
    },
    {
      id: '2',
      tag: 'OPPORTUNITY',
      text: 'Bulk discount available for 50+ unit orders',
      confidence: 0.88,
    },
    {
      id: '3',
      tag: 'MARKET',
      text: 'Plumbing supply shortage expected next month',
      confidence: 0.78,
    },
  ];

  const defaultCategories: CategoryMetric[] = [
    { category: 'Faucets', spending: 45000, percentage: 32 },
    { category: 'Fixtures', spending: 38000, percentage: 27 },
    { category: 'Valves', spending: 28000, percentage: 20 },
    { category: 'Pumps', spending: 22000, percentage: 16 },
    { category: 'Pipes', spending: 7000, percentage: 5 },
  ];

  const activeWatchlist = watchlist && watchlist.length > 0 ? watchlist : defaultWatchlist;
  const activeInsights = insights && insights.length > 0 ? insights : defaultInsights;
  const activeCategories = categories && categories.length > 0 ? categories : defaultCategories;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'ok';
      case 'low':
        return 'warn';
      case 'out_stock':
        return 'bad';
      default:
        return 'cyan';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low':
        return 'Low Stock';
      case 'out_stock':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  return (
    <PageLayout
      active={activeNav}
      navItems={NAV_ITEMS}
      onNavigate={setActiveNav}
      crumbs={['Dashboard']}
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
      {/* Notification Center */}
      <NotificationCenter
        userId="current-user"
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Dashboard Content */}
      <div className="p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-4">
          <KPI
            label="Total Orders"
            value={metrics.totalOrders.toLocaleString()}
            delta={15.2}
            deltaDir="up"
            color="cyan"
            spark={metrics.orderTrend}
          />
          <KPI
            label="Average Cost"
            value={`$${metrics.avgCost}`}
            unit="per order"
            delta={-2.8}
            deltaDir="down"
            color="copper"
            spark={metrics.costTrend}
          />
          <KPI
            label="Total Savings"
            value={`$${(metrics.totalSavings / 1000).toFixed(1)}K`}
            delta={23.6}
            deltaDir="up"
            color="ok"
            spark={metrics.savingsTrend}
          />
          <KPI
            label="Compliance"
            value={`${metrics.complianceScore}%`}
            delta={3.0}
            deltaDir="up"
            color="violet"
            spark={metrics.complianceTrend}
          />
        </div>

        {/* Watchlist Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Tracked Products</h3>
                <p className="text-xs text-ink-3 mt-1">
                  Monitor prices and availability
                </p>
              </div>
              <Button variant="accent">Add Product</Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line-2">
                    <th className="text-left py-3 px-4 font-semibold text-ink-2">
                      SKU
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-ink-2">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-ink-2">
                      Brand
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-ink-2">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-ink-2">
                      Change
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-ink-2">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-ink-2">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeWatchlist.map((item) => (
                    <tr key={item.id} className="border-b border-line-1 hover:bg-bg-2 transition">
                      <td className="py-3 px-4 font-mono text-xs text-cyan">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4 text-ink-2">{item.brand}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        ${item.currentPrice.toFixed(2)}
                      </td>
                      <td
                        className="py-3 px-4 text-right font-mono"
                        style={{
                          color:
                            item.priceDelta < 0
                              ? 'var(--ok)'
                              : 'var(--bad)',
                        }}
                      >
                        {item.priceDelta > 0 ? '+' : ''}
                        {item.priceDelta.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Chip
                          variant={getStatusColor(item.status) as any}
                          className="text-xs"
                        >
                          {getStatusLabel(item.status)}
                        </Chip>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button size="sm">Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* AI Digest + Heatmap */}
        <div className="grid grid-cols-2 gap-6">
          {/* AI Digest */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded"
                  style={{ background: 'var(--violet)' }}
                />
                <h3 className="text-base font-semibold">AI Insights</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {activeInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-2)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Chip
                      variant="violet"
                      className="text-xs"
                    >
                      {insight.tag}
                    </Chip>
                    <span className="text-xs text-ink-3">
                      {(insight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-ink-1">{insight.text}</p>
                </div>
              ))}
              <Button variant="accent" className="w-full mt-4">
                View All Insights
              </Button>
            </CardBody>
          </Card>

          {/* Category Heatmap */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Procurement by Category</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {activeCategories.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className="text-xs text-ink-2">
                      ${(cat.spending / 1000).toFixed(1)}K ({cat.percentage}%)
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: 'var(--bg-3)' }}
                  >
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${cat.percentage}%`,
                        background: 'var(--grad-iq)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
