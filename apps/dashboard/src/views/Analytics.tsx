import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  KPI,
  PageLayout,
} from '@/components';
import { useAPI } from '@/hooks';
import { analyticsAPI } from '@/services/api';

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

interface AnalyticsMetric {
  label: string;
  value: string | number;
  delta: number;
  deltaDir: 'up' | 'down' | 'neutral';
  color: string;
  spark: number[];
}

interface ReportData {
  category: string;
  value: number;
  growth: number;
}

export const Analytics: React.FC = () => {
  const [activeNav, setActiveNav] = useState('analytics');
  const [dateRange, setDateRange] = useState('30d');

  const { data: analyticsData, loading: loadingAnalytics } = useAPI(
    () => analyticsAPI.getTrends(dateRange),
    [dateRange]
  );

  const defaultMetrics: AnalyticsMetric[] = [
    {
      label: 'Active Users',
      value: 3847,
      delta: 12.5,
      deltaDir: 'up',
      color: 'cyan',
      spark: [150, 165, 180, 200, 210, 225, 245, 260, 280, 310, 340, 380],
    },
    {
      label: 'Searches',
      value: 28450,
      delta: 8.3,
      deltaDir: 'up',
      color: 'ok',
      spark: [1800, 1950, 2100, 2200, 2350, 2450, 2600, 2750, 2900, 3100, 3300, 3500],
    },
    {
      label: 'Marketplace Orders',
      value: 542,
      delta: 24.7,
      deltaDir: 'up',
      color: 'copper',
      spark: [28, 32, 38, 42, 48, 52, 58, 62, 68, 72, 78, 85],
    },
    {
      label: 'Revenue (MRR)',
      value: '$42,850',
      delta: 31.2,
      deltaDir: 'up',
      color: 'violet',
      spark: [2500, 2800, 3100, 3400, 3800, 4200, 4600, 5000, 5400, 5800, 6200, 6700],
    },
  ];

  const defaultSubscription: ReportData[] = [
    { category: 'Free', value: 2100, growth: 5.2 },
    { category: 'Pro', value: 1240, growth: 18.3 },
    { category: 'Enterprise', value: 420, growth: 42.1 },
    { category: 'Marketplace', value: 87, growth: 65.8 },
  ];

  const defaultEngagement: ReportData[] = [
    { category: 'Daily Active', value: 1856, growth: 8.9 },
    { category: 'Weekly Active', value: 3847, growth: 12.5 },
    { category: 'Monthly Active', value: 8934, growth: 7.2 },
  ];

  const defaultFeatures: ReportData[] = [
    { category: 'Product Search', value: 28450, growth: 8.3 },
    { category: 'Price Tracking', value: 12340, growth: 15.7 },
    { category: 'Marketplace', value: 5420, growth: 42.1 },
    { category: 'Community Forum', value: 8934, growth: 21.3 },
  ];

  // Use API data if available, otherwise use defaults
  const metrics = analyticsData?.metrics || defaultMetrics;
  const subscription = analyticsData?.subscription || defaultSubscription;
  const engagement = analyticsData?.engagement || defaultEngagement;
  const features = analyticsData?.features || defaultFeatures;

  return (
    <PageLayout
      active={activeNav}
      navItems={NAV_ITEMS}
      onNavigate={setActiveNav}
      crumbs={['Analytics']}
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
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={dateRange === '7d' ? 'primary' : 'default'}
              onClick={() => setDateRange('7d')}
              disabled={loadingAnalytics}
            >
              7 Days
            </Button>
            <Button
              variant={dateRange === '30d' ? 'primary' : 'default'}
              onClick={() => setDateRange('30d')}
              disabled={loadingAnalytics}
            >
              30 Days
            </Button>
            <Button
              variant={dateRange === '90d' ? 'primary' : 'default'}
              onClick={() => setDateRange('90d')}
              disabled={loadingAnalytics}
            >
              90 Days
            </Button>
            <Button
              variant={dateRange === '1y' ? 'primary' : 'default'}
              onClick={() => setDateRange('1y')}
              disabled={loadingAnalytics}
            >
              1 Year
            </Button>
          </div>
          <Button variant="accent" disabled={loadingAnalytics}>
            {loadingAnalytics ? 'Generating...' : 'Export Report'}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          {metrics.map((metric, idx) => (
            <KPI
              key={idx}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              deltaDir={metric.deltaDir}
              color={metric.color as any}
              spark={metric.spark}
            />
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Subscription Breakdown */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Subscriptions by Tier</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {subscription.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.category}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.value}</div>
                      <div className="text-xs text-ok">
                        ↑ {item.growth}%
                      </div>
                    </div>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-3)' }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max((item.value / 2100) * 100, 5)}%`,
                        background: 'var(--grad-iq)',
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-line-1 text-xs text-ink-3">
                Total: 3,847 users across all tiers
              </div>
            </CardBody>
          </Card>

          {/* User Engagement */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">User Engagement</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {engagement.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.category}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.value}</div>
                      <div className="text-xs text-ok">
                        ↑ {item.growth}%
                      </div>
                    </div>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-3)' }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(item.value / 8934) * 100}%`,
                        background: 'var(--grad-iq)',
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-line-1 text-xs text-ink-3">
                Retention rate: 87% month-over-month
              </div>
            </CardBody>
          </Card>

          {/* Feature Usage */}
          <Card className="col-span-2">
            <CardHeader>
              <h3 className="text-base font-semibold">Feature Usage</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {features.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.category}</span>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{item.value}</div>
                        <div className="text-xs text-ok">
                          ↑ {item.growth}%
                        </div>
                      </div>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-3)' }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(item.value / 28450) * 100}%`,
                          background: 'var(--grad-iq)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded"
                style={{ background: 'var(--violet)' }}
              />
              <h3 className="text-base font-semibold">Key Insights</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-2)' }}>
              <div className="flex items-start gap-3 mb-1">
                <Chip variant="violet" className="text-xs">
                  GROWTH
                </Chip>
                <span className="text-xs text-ink-3">Updated 2 hours ago</span>
              </div>
              <p className="text-sm text-ink-1">
                Marketplace tier subscriptions growing at 65.8% month-over-month. Consider
                increasing marketing budget for B2B contractor outreach.
              </p>
            </div>

            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-2)' }}>
              <div className="flex items-start gap-3 mb-1">
                <Chip variant="violet" className="text-xs">
                  RETENTION
                </Chip>
                <span className="text-xs text-ink-3">Updated 5 hours ago</span>
              </div>
              <p className="text-sm text-ink-1">
                Pro tier users show 94% retention rate. Consider free-to-Pro conversion
                improvements to increase revenue.
              </p>
            </div>

            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-2)' }}>
              <div className="flex items-start gap-3 mb-1">
                <Chip variant="violet" className="text-xs">
                  ENGAGEMENT
                </Chip>
                <span className="text-xs text-ink-3">Updated 12 hours ago</span>
              </div>
              <p className="text-sm text-ink-1">
                Product search feature dominates usage (28K searches/month). Price tracking
                opportunity to drive engagement with Pro tier.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Analytics;
