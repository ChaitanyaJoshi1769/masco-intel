# HydraIQ Component Library

Reusable React components built on the HydraIQ design system.

## Primitives

### Button
```tsx
import { Button } from '@/components';

<Button variant="default">Click me</Button>
<Button variant="primary">Primary</Button>
<Button variant="accent">AI Action</Button>
```

**Props:**
- `variant`: 'default' | 'primary' | 'accent'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: React.ReactNode (optional left icon)

### Card
```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components';

<Card>
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardBody>
    Content here
  </CardBody>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

### Chip / Badge
```tsx
import { Chip, Badge } from '@/components';

<Chip variant="cyan" icon={<DotIcon />}>In Stock</Chip>
<Badge variant="ok">Savings</Badge>
<Badge variant="bad">Risk</Badge>
```

**Variants:**
- 'default' (neutral)
- 'cyan' (data)
- 'violet' (AI)
- 'ok' (positive)
- 'warn' (warning)
- 'bad' (error)

### KPI
```tsx
import { KPI } from '@/components';

<KPI
  label="Procurement Spend"
  value="$47,500"
  unit="monthly"
  delta={4.2}
  deltaDir="up"
  color="copper"
  spark={[10, 15, 12, 18, 16, 21, 19]}
/>
```

**Props:**
- `label`: string (title)
- `value`: string (formatted number)
- `unit`: string (optional)
- `delta`: number (percentage change)
- `deltaDir`: 'up' | 'down' | 'neutral'
- `color`: 'cyan' | 'violet' | 'copper' | 'ok' | 'warn' | 'bad'
- `spark`: number[] (8-30 data points for sparkline)

### Sparkline
```tsx
import { Sparkline } from '@/components';

<Sparkline
  points={[10, 15, 12, 18, 16, 21, 19]}
  color="cyan"
  height={40}
  fill={true}
/>
```

## Layout

### SideNav
```tsx
import { SideNav } from '@/components';

const items = [
  { id: 'home', label: 'Home', href: '/', icon: <HomeIcon /> },
  { id: 'terminal', label: 'Terminal', href: '/terminal', badge: 'Pro' },
];

<SideNav
  active="home"
  items={items}
  onNavigate={(id) => navigate(id)}
  logo={<Logo />}
/>
```

### TopBar
```tsx
import { TopBar } from '@/components';

<TopBar
  crumbs={['Dashboard', 'Products', 'Faucets']}
  rightExtras={<SearchBox />}
  liveIndicator={true}
/>
```

### PageLayout
```tsx
import { PageLayout } from '@/components';

<PageLayout
  active="dashboard"
  navItems={navItems}
  onNavigate={handleNav}
  logo={<Logo />}
  crumbs={['Dashboard']}
  liveIndicator={true}
>
  <YourPageContent />
</PageLayout>
```

## Color System

All components use HydraIQ design tokens via CSS custom properties:

```
--bg-0 to --bg-4     (backgrounds)
--ink-0 to --ink-4   (text)
--line-1 to --line-3 (borders)
--cyan, --violet, --copper
--ok, --warn, --bad
--grad-iq           (brand gradient for AI)
```

## Usage Example

```tsx
import {
  Button,
  Card,
  CardBody,
  KPI,
  Chip,
  PageLayout,
} from '@/components';

export function Dashboard() {
  return (
    <PageLayout
      active="dashboard"
      navItems={NAV_ITEMS}
      crumbs={['Dashboard']}
      liveIndicator={true}
    >
      <div className="p-6 grid grid-cols-3 gap-4">
        <KPI
          label="Total Orders"
          value="2,847"
          delta={12.5}
          deltaDir="up"
          spark={[...]}
        />
        <KPI
          label="Avg. Cost"
          value="$385"
          color="copper"
          spark={[...]}
        />
        <KPI
          label="Savings"
          value="$12.5K"
          color="ok"
          delta={8.3}
          deltaDir="up"
        />
      </div>

      <Card className="mt-6">
        <CardBody>
          <div className="flex gap-2 mb-4">
            <Chip variant="cyan">New Pricing</Chip>
            <Chip variant="ok" icon={<CheckIcon />}>Approved</Chip>
          </div>
          <Button variant="accent">View Details</Button>
        </CardBody>
      </Card>
    </PageLayout>
  );
}
```

## Design Tokens

See `apps/dashboard/src/tokens.css` for complete color palette and spacing definitions.

See `apps/dashboard/HYDRAIQ_DESIGN_SYSTEM.md` for design specifications and usage guidelines.

---

**Version**: HydraIQ v2.4  
**Status**: Production Ready  
**Last Updated**: May 13, 2026
