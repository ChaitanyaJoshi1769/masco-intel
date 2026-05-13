export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/' },
  { id: 'terminal', label: 'Product Terminal', href: '/terminal' },
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { id: 'forum', label: 'Community Forum', href: '/forum' },
  { id: 'ai', label: 'AI Console', href: '/ai' },
  { id: 'billing', label: 'Billing', href: '/billing' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
];
