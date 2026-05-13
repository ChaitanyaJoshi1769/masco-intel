import React, { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  PageLayout,
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

interface Setting {
  key: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'text';
  value: any;
  options?: Array<{ label: string; value: any }>;
}

export const Settings: React.FC = () => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'integrations' | 'privacy'>('account');
  const [saved, setSaved] = useState(false);

  const [accountSettings] = useState<Setting[]>([
    {
      key: 'email',
      label: 'Email',
      description: 'Your primary account email',
      type: 'text',
      value: 'user@example.com',
    },
    {
      key: 'displayName',
      label: 'Display Name',
      description: 'How you appear to other users',
      type: 'text',
      value: 'John Doe',
    },
    {
      key: 'timezone',
      label: 'Timezone',
      description: 'Used for scheduling and reporting',
      type: 'select',
      value: 'America/New_York',
      options: [
        { label: 'America/New_York', value: 'America/New_York' },
        { label: 'America/Chicago', value: 'America/Chicago' },
        { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
        { label: 'Europe/London', value: 'Europe/London' },
        { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
      ],
    },
    {
      key: 'theme',
      label: 'Theme',
      description: 'Visual appearance preference',
      type: 'select',
      value: 'dark',
      options: [
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
        { label: 'System', value: 'system' },
      ],
    },
  ]);

  const [notificationSettings] = useState<Setting[]>([
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive updates via email',
      type: 'toggle',
      value: true,
    },
    {
      key: 'priceAlerts',
      label: 'Price Alerts',
      description: 'Notify when tracked prices change',
      type: 'toggle',
      value: true,
    },
    {
      key: 'marketingEmails',
      label: 'Marketing Emails',
      description: 'Receive news and special offers',
      type: 'toggle',
      value: false,
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly Digest',
      description: 'Summary email every Monday',
      type: 'toggle',
      value: true,
    },
  ]);

  const [integrationSettings] = useState<Setting[]>([
    {
      key: 'apiAccess',
      label: 'API Access',
      description: 'Enable API key for integrations',
      type: 'toggle',
      value: true,
    },
    {
      key: 'webhooks',
      label: 'Webhooks',
      description: 'Send real-time events to your servers',
      type: 'toggle',
      value: false,
    },
    {
      key: 'zapierIntegration',
      label: 'Zapier Integration',
      description: 'Connect to 3000+ apps via Zapier',
      type: 'toggle',
      value: false,
    },
  ]);

  const [privacySettings] = useState<Setting[]>([
    {
      key: 'profileVisibility',
      label: 'Profile Visibility',
      description: 'Who can see your profile',
      type: 'select',
      value: 'private',
      options: [
        { label: 'Private (Only me)', value: 'private' },
        { label: 'Contractors only', value: 'contractors' },
        { label: 'Public', value: 'public' },
      ],
    },
    {
      key: 'dataCollection',
      label: 'Analytics & Data Collection',
      description: 'Help us improve by sharing usage data',
      type: 'toggle',
      value: true,
    },
    {
      key: 'searchHistory',
      label: 'Save Search History',
      description: 'Remember your searches for suggestions',
      type: 'toggle',
      value: true,
    },
  ]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const renderSettings = (settings: Setting[]) => (
    <div className="space-y-4">
      {settings.map((setting) => (
        <div
          key={setting.key}
          className="p-4 rounded-lg border border-line-1"
          style={{ backgroundColor: 'var(--bg-2)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">{setting.label}</h4>
              <p className="text-xs text-ink-3">{setting.description}</p>
            </div>
            {setting.type === 'toggle' && (
              <button
                className="relative w-12 h-6 rounded-full transition-colors"
                style={{
                  backgroundColor: setting.value ? 'var(--ok)' : 'var(--bg-3)',
                }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full transition-transform"
                  style={{
                    left: setting.value ? '26px' : '2px',
                    backgroundColor: 'var(--bg-0)',
                  }}
                />
              </button>
            )}
            {setting.type === 'text' && (
              <input
                type="text"
                value={setting.value}
                readOnly
                className="px-2 py-1 rounded text-sm border border-line-2 bg-bg-3"
                style={{
                  backgroundColor: 'var(--bg-3)',
                  borderColor: 'var(--line-2)',
                  color: 'var(--ink-1)',
                }}
              />
            )}
            {setting.type === 'select' && (
              <select
                value={setting.value}
                readOnly
                className="px-2 py-1 rounded text-sm border border-line-2 bg-bg-3"
                style={{
                  backgroundColor: 'var(--bg-3)',
                  borderColor: 'var(--line-2)',
                  color: 'var(--ink-1)',
                }}
              >
                {setting.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <PageLayout
      active={activeNav}
      navItems={NAV_ITEMS}
      onNavigate={setActiveNav}
      crumbs={['Settings']}
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
        {/* Tabs */}
        <div className="flex gap-3 border-b border-line-2 pb-4">
          <button
            onClick={() => setActiveTab('account')}
            className="px-4 py-2 font-medium text-sm transition-colors"
            style={{
              color: activeTab === 'account' ? 'var(--cyan)' : 'var(--ink-2)',
              borderBottom: activeTab === 'account' ? '2px solid var(--cyan)' : 'none',
              marginBottom: '-4px',
            }}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className="px-4 py-2 font-medium text-sm transition-colors"
            style={{
              color: activeTab === 'notifications' ? 'var(--cyan)' : 'var(--ink-2)',
              borderBottom: activeTab === 'notifications' ? '2px solid var(--cyan)' : 'none',
              marginBottom: '-4px',
            }}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className="px-4 py-2 font-medium text-sm transition-colors"
            style={{
              color: activeTab === 'integrations' ? 'var(--cyan)' : 'var(--ink-2)',
              borderBottom: activeTab === 'integrations' ? '2px solid var(--cyan)' : 'none',
              marginBottom: '-4px',
            }}
          >
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className="px-4 py-2 font-medium text-sm transition-colors"
            style={{
              color: activeTab === 'privacy' ? 'var(--cyan)' : 'var(--ink-2)',
              borderBottom: activeTab === 'privacy' ? '2px solid var(--cyan)' : 'none',
              marginBottom: '-4px',
            }}
          >
            Privacy
          </button>
        </div>

        {/* Account Settings */}
        {activeTab === 'account' && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Account Settings</h3>
            </CardHeader>
            <CardBody>
              {renderSettings(accountSettings)}
            </CardBody>
          </Card>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Notification Preferences</h3>
            </CardHeader>
            <CardBody>
              {renderSettings(notificationSettings)}
            </CardBody>
          </Card>
        )}

        {/* Integration Settings */}
        {activeTab === 'integrations' && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Integrations & API</h3>
            </CardHeader>
            <CardBody>
              {renderSettings(integrationSettings)}
              <div className="mt-6 p-4 rounded-lg border border-line-1" style={{ backgroundColor: 'var(--bg-2)' }}>
                <h4 className="font-medium text-sm mb-2">API Key</h4>
                <p className="text-xs text-ink-3 mb-3">
                  Use your API key to integrate Masco Intel with external applications.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="sk_test_••••••••••••••••••••••••••••••"
                    readOnly
                    className="flex-1 px-2 py-2 rounded text-xs font-mono bg-bg-3 border border-line-2"
                    style={{
                      backgroundColor: 'var(--bg-3)',
                      borderColor: 'var(--line-2)',
                      color: 'var(--ink-1)',
                    }}
                  />
                  <Button size="sm">Copy</Button>
                  <Button size="sm" variant="default">Regenerate</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Privacy & Data</h3>
            </CardHeader>
            <CardBody>
              {renderSettings(privacySettings)}
              <div className="mt-6 p-4 rounded-lg border border-line-1" style={{ backgroundColor: 'var(--bg-2)' }}>
                <h4 className="font-medium text-sm mb-2">Data & Privacy</h4>
                <p className="text-xs text-ink-3 mb-4">
                  Manage how your data is used and exported.
                </p>
                <div className="space-y-2">
                  <Button variant="default">Download My Data (CSV)</Button>
                  <Button variant="default">Request Data Deletion</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
          {saved && (
            <div className="flex items-center gap-2 text-ok text-sm">
              <span>✓</span>
              <span>Settings saved successfully</span>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
