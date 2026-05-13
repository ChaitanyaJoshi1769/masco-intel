import React, { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  KPI,
  PageLayout,
} from '@/components';
import { useAPIMutation } from '@/hooks';
import { useToast } from '@/hooks';
import { subscriptionAPI } from '@/services/api';

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

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  current: boolean;
}

interface UsageMetric {
  name: string;
  used: number;
  limit: number;
  unit: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
}

export const Billing: React.FC = () => {
  const [activeNav, setActiveNav] = useState('billing');
  const [viewMode, setViewMode] = useState<'plans' | 'usage' | 'invoices'>('plans');
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const { addToast } = useToast();

  const { execute: upgradePlan } = useAPIMutation(
    (planId: string) => subscriptionAPI.upgrade(planId)
  );

  const handleUpgrade = async (planId: string) => {
    setUpgradingPlanId(planId);
    try {
      await upgradePlan(planId);
      addToast({
        type: 'success',
        message: `Successfully upgraded to ${plans.find(p => p.id === planId)?.name} plan`,
        duration: 3000,
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to upgrade plan',
        duration: 4000,
      });
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const [plans] = useState<Plan[]>([
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Great for getting started',
      features: [
        '10 product searches per month',
        'Basic price tracking',
        'Community forum access',
        'Email support',
      ],
      current: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      period: 'month',
      description: 'For active users',
      features: [
        'Unlimited searches',
        'Advanced analytics',
        'Real-time price alerts',
        'Marketplace access',
        'Priority support',
        'API access (1000 req/mo)',
      ],
      current: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      period: 'month',
      description: 'For teams',
      features: [
        'Everything in Pro',
        'Team management',
        'Bulk export (CSV/PDF)',
        'Custom integrations',
        'Dedicated support',
        'Unlimited API calls',
        'Advanced RBAC',
      ],
      current: false,
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      price: 199,
      period: 'month',
      description: 'Contractor marketplace',
      features: [
        'Everything in Enterprise',
        'Contractor profile',
        'Service listings',
        'Order management',
        'Commission: 10%',
        'Marketing support',
      ],
      current: false,
    },
  ]);

  const [usage] = useState<UsageMetric[]>([
    { name: 'API Requests', used: 847, limit: 1000, unit: 'requests' },
    { name: 'Saved Products', used: 234, limit: 500, unit: 'products' },
    { name: 'Team Members', used: 3, limit: 5, unit: 'members' },
    { name: 'Price Alerts', used: 12, limit: 50, unit: 'alerts' },
  ]);

  const [invoices] = useState<Invoice[]>([
    {
      id: 'INV-2026-005',
      date: '2026-05-01',
      amount: 29,
      status: 'paid',
      plan: 'Pro Monthly',
    },
    {
      id: 'INV-2026-004',
      date: '2026-04-01',
      amount: 29,
      status: 'paid',
      plan: 'Pro Monthly',
    },
    {
      id: 'INV-2026-003',
      date: '2026-03-01',
      amount: 29,
      status: 'paid',
      plan: 'Pro Monthly',
    },
    {
      id: 'INV-2026-002',
      date: '2026-02-01',
      amount: 0,
      status: 'paid',
      plan: 'Free',
    },
  ]);

  const currentPlan = plans.find(p => p.current);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'ok';
      case 'pending':
        return 'warn';
      case 'failed':
        return 'bad';
      default:
        return 'cyan';
    }
  };

  return (
    <PageLayout
      active={activeNav}
      navItems={NAV_ITEMS}
      onNavigate={setActiveNav}
      crumbs={['Billing & Subscription']}
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
        {/* View Switcher */}
        <div className="flex gap-3">
          <Button
            variant={viewMode === 'plans' ? 'primary' : 'default'}
            onClick={() => setViewMode('plans')}
          >
            Plans
          </Button>
          <Button
            variant={viewMode === 'usage' ? 'primary' : 'default'}
            onClick={() => setViewMode('usage')}
          >
            Usage
          </Button>
          <Button
            variant={viewMode === 'invoices' ? 'primary' : 'default'}
            onClick={() => setViewMode('invoices')}
          >
            Invoices
          </Button>
        </div>

        {/* Current Plan Summary */}
        {currentPlan && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Current Subscription</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold mb-1">{currentPlan.name} Plan</h4>
                  <p className="text-sm text-ink-2 mb-4">{currentPlan.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-cyan">📅 Renews on June 1, 2026</span>
                    <span className="text-ink-3">Auto-renewal enabled</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold mb-1">
                    ${currentPlan.price}
                    <span className="text-lg text-ink-3">/{currentPlan.period}</span>
                  </div>
                  <Button variant="default">Manage</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Plans Grid */}
        {viewMode === 'plans' && (
          <div className="grid grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={plan.current ? 'ring-2' : ''}
                style={plan.current ? { ringColor: 'var(--cyan)' } : {}}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <p className="text-sm text-ink-3">{plan.description}</p>
                    </div>
                    {plan.current && (
                      <Chip variant="cyan">Current</Chip>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      ${plan.price}
                      <span className="text-lg text-ink-3">/{plan.period}</span>
                    </div>
                    {plan.price === 0 && (
                      <p className="text-xs text-ink-3">Free forever</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-ok mt-1">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-line-1">
                    {plan.current ? (
                      <Button variant="default" disabled>
                        Current Plan
                      </Button>
                    ) : plan.price === 0 ? (
                      <Button variant="default" disabled>
                        Limited Plan
                      </Button>
                    ) : (
                      <Button
                        variant="accent"
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={upgradingPlanId !== null}
                      >
                        {upgradingPlanId === plan.id
                          ? 'Upgrading...'
                          : `Upgrade to ${plan.name}`}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Usage Metrics */}
        {viewMode === 'usage' && (
          <div className="space-y-6">
            {usage.map((metric, idx) => {
              const percentage = Math.round((metric.used / metric.limit) * 100);
              const isWarning = percentage > 80;
              return (
                <Card key={idx}>
                  <CardBody>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-sm">{metric.name}</h4>
                        <p className="text-xs text-ink-3">
                          {metric.used} of {metric.limit} {metric.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold">
                          {percentage}%
                        </div>
                        {isWarning && (
                          <Chip variant="warn" className="text-xs">
                            High usage
                          </Chip>
                        )}
                      </div>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-3)' }}
                    >
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          background: isWarning ? 'var(--warn)' : 'var(--ok)',
                        }}
                      />
                    </div>
                  </CardBody>
                </Card>
              );
            })}
            <Card>
              <CardBody>
                <p className="text-sm text-ink-2 mb-3">
                  Usage resets monthly on the 1st of each month. Upgrade to increase limits.
                </p>
                <Button variant="accent">View Upgrade Options</Button>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Invoices */}
        {viewMode === 'invoices' && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Billing History</h3>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line-2">
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Invoice
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-ink-2">
                        Plan
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-2">
                        Amount
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
                    {invoices.map((invoice, idx) => (
                      <tr key={idx} className="border-b border-line-1 hover:bg-bg-2 transition">
                        <td className="py-3 px-4 font-mono text-xs">
                          {invoice.id}
                        </td>
                        <td className="py-3 px-4">{invoice.date}</td>
                        <td className="py-3 px-4 text-ink-2">{invoice.plan}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          ${invoice.amount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Chip
                            variant={getStatusColor(invoice.status) as any}
                            className="text-xs"
                          >
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                          </Chip>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button size="sm">Download</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default Billing;
