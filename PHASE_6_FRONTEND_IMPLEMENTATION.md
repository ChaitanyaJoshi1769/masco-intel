# Phase 6: Frontend Implementation with HydraIQ Design System

**Status**: Ready to Start  
**Estimated Effort**: 40-50 hours  
**Target Completion**: 2-3 weeks (with 3-5x acceleration)

---

## Overview

Phase 6 focuses on building the complete frontend experience using the HydraIQ design system and the newly created component library. This phase transforms the backend API endpoints into user-facing dashboards, views, and interactive experiences.

## Architecture

```
Backend (Complete)
├── 248 API endpoints
├── 5 major feature areas (User, Intelligence, Expansion, Integrations, Community)
└── Full RBAC, webhooks, OAuth, data sync

        ↓ (REST/WebSocket)

Frontend (Phase 6)
├── Dashboard App (React + HydraIQ)
├── Chrome Extension
├── Mobile App (React Native)
└── Marketing Website
```

## Component Library Ready ✅

**Primitives Implemented:**
- Button (default/primary/accent variants)
- Card (with Header/Body/Footer composition)
- Chip & Badge (with variant colors)
- KPI (with sparkline visualization)
- Sparkline (vector-based charts)

**Layout Implemented:**
- SideNav (navigation with badges)
- TopBar (breadcrumbs + live indicator)
- PageLayout (complete page wrapper)

**Design Tokens Complete:**
- Colors (backgrounds, text, accents, semantics)
- Typography (Geist, Geist Mono, Space Grotesk)
- Spacing, radii, shadows, motion
- All CSS custom properties ready to use

---

## Implementation Plan

### Phase 6.1: Dashboard Home (Week 1) ⭐

**Priority:** CRITICAL | **Effort:** 8-10 hours | **Impact:** Core user experience

**Features:**
1. Dashboard Overview
   - 4 KPI cards (Total Orders, Avg Cost, Savings, Compliance)
   - Status summary chips
   - Live data indicators

2. Watchlist Section
   - Table of tracked products
   - Price change indicators
   - Quick actions (buy, compare, details)

3. AI Daily Digest
   - Card with key insights
   - Taggable intelligence items
   - Timestamp + confidence scores

4. Category Heatmap
   - Grid visualization of procurement by category
   - Color intensity for spending
   - Interactive drill-down

**API Integration:**
- `GET /api/analytics/dashboard/overview` → KPI values
- `GET /api/subscriptions/stats` → watchlist metrics
- `GET /api/chatbot/stats` → digest content
- `GET /api/products` → watchlist data

**Implementation Details:**
```tsx
src/views/Dashboard.tsx
├── DashboardHeader (breadcrumbs + title)
├── KPIGrid (4 KPI components)
├── WatchlistTable (product list with actions)
├── AIDigestCard (violet-tinted AI insights)
└── CategoryHeatmap (visual procurement breakdown)
```

**Estimated Effort:** 8-10 hours

---

### Phase 6.2: Product Intelligence Terminal (Week 1-2) ⭐⭐

**Priority:** CRITICAL | **Effort:** 12-16 hours | **Impact:** Flagship feature

**Features:**
1. Product Search & Lookup
   - SKU/UPC search bar
   - Autocomplete from catalog
   - Search results with ratings

2. Product Detail Panel
   - SKU, title, brand, OEM
   - Grade/tier badge
   - Components list
   - OEM lineage tree

3. Price Comparison Table
   - Retailer columns (Home Depot, Lowes, etc.)
   - Current price + 24h delta
   - Stock status chips
   - Markup percentage

4. Component Compatibility
   - Cartridge/part breakdown
   - OEM alternatives
   - Cross-brand compatibility
   - Aftermarket options

5. AI Insight Stream
   - Right-rail live stream
   - Tagged insights (GRADE, PRICING, FAILURE, etc.)
   - Confidence scores + citations
   - Real-time updates via WebSocket

**API Integration:**
- `GET /api/products/search?q=` → search
- `GET /api/products/:id` → detail
- `GET /api/pricing/:productId` → price history
- `GET /api/comparison/:productId` → comparisons
- `GET /api/chatbot/stats` → AI stream (SSE)

**Implementation Details:**
```tsx
src/views/ProductTerminal.tsx
├── SearchBar (with autocomplete)
├── ProductPanel
│   ├── ProductHeader (SKU, title, grade)
│   ├── ComponentsList
│   └── OEMLineage
├── PriceComparisonTable
├── CompatibilitySection
└── AIInsightStream (scrollable right rail)
```

**Estimated Effort:** 12-16 hours

---

### Phase 6.3: Marketplace & Community Views (Week 2) 

**Priority:** HIGH | **Effort:** 10-12 hours | **Impact:** B2B platform

**Features:**
1. Marketplace Home
   - Featured contractors
   - Category grid
   - Search by service

2. Contractor Profiles
   - Name, bio, expertise
   - Star rating + review count
   - Service listings
   - Order history

3. Marketplace Orders
   - Order list with status (pending/in-progress/completed)
   - Quick actions (message, rate, relist)
   - Invoice + tracking

4. Community Forum
   - Category tabs
   - Thread list (title, replies, views)
   - Trending threads
   - Reply UI

**API Integration:**
- `GET /api/marketplace/profiles` → contractor list
- `GET /api/marketplace/services` → services
- `GET /api/marketplace/orders` → orders
- `GET /api/forum/threads` → forum threads
- `POST /api/forum/threads/:id/replies` → post replies

**Implementation Details:**
```tsx
src/views/Marketplace/
├── MarketplaceHome.tsx
├── ContractorProfile.tsx
├── OrdersList.tsx
└── Community/
    ├── ForumHome.tsx
    ├── ThreadView.tsx
    └── ReplyForm.tsx
```

**Estimated Effort:** 10-12 hours

---

### Phase 6.4: Subscription & Billing (Week 2)

**Priority:** MEDIUM | **Effort:** 8-10 hours | **Impact:** Monetization

**Features:**
1. Subscription Page
   - Current tier display
   - 4-tier comparison (Free, Pro, Enterprise, Marketplace)
   - Upgrade/downgrade actions
   - Feature matrix

2. Billing Dashboard
   - Current plan + renewal date
   - Usage meters (API requests, saved products, etc.)
   - Payment methods
   - Invoice history

3. Settings
   - Billing email
   - Billing cycle (monthly/yearly)
   - Usage alerts
   - Downgrade confirmation

**API Integration:**
- `GET /api/subscriptions/plans` → tier list
- `GET /api/subscriptions/:userId` → current sub
- `GET /api/subscriptions/:userId/limits` → usage
- `POST /api/subscriptions/:userId/upgrade` → upgrade
- `GET /api/subscriptions/stats` → analytics

**Implementation Details:**
```tsx
src/views/Billing/
├── SubscriptionPage.tsx
├── BillingDashboard.tsx
├── UpgradePage.tsx
└── Settings.tsx
```

**Estimated Effort:** 8-10 hours

---

### Phase 6.5: AI Console & Command Palette (Week 3)

**Priority:** HIGH | **Effort:** 8-10 hours | **Impact:** Core differentiator

**Features:**
1. Command Palette (⌘K)
   - Keyboard-driven search
   - AI suggestion in first row
   - Tool shortcuts (pricing-scan, oem-tree, compat-map)
   - Recent searches

2. AI Console
   - Chat interface (messages + responses)
   - Tool calls display (with results)
   - Citations + sources
   - Model badge + confidence

3. Streaming Updates
   - Real-time token streaming
   - Animated dot pulse while generating
   - Citation formatting

**API Integration:**
- `POST /api/chatbot/conversations` → create chat
- `POST /api/chatbot/conversations/:id/messages` → send message
- `GET /api/chatbot/conversations/:id/messages` → stream (SSE)
- `POST /api/chatbot/messages/:id/helpful` → feedback

**Implementation Details:**
```tsx
src/components/CommandPalette.tsx
└── CommandPaletteUI
    ├── SearchInput
    ├── AIFirstRow
    └── Results

src/views/AIConsole.tsx
├── ChatHistory
├── MessageInput
├── ToolCallDisplay
└── CitationLinks
```

**Estimated Effort:** 8-10 hours

---

### Phase 6.6: Analytics & Reporting (Week 3)

**Priority:** MEDIUM | **Effort:** 8-10 hours | **Impact:** Insights

**Features:**
1. Analytics Dashboard
   - User metrics (active users, retention, churn)
   - Subscription metrics (MRR, churn, tiers)
   - Marketplace metrics (orders, revenue, ratings)
   - Forum engagement (threads, replies, views)

2. Trend Charts
   - User growth (line chart)
   - Revenue growth (line chart)
   - Order volume (bar chart)
   - Category heatmap

3. Reports
   - Custom date range selection
   - Export (JSON/CSV)
   - Saved reports
   - Scheduled reports

**API Integration:**
- `GET /api/analytics/dashboard/overview` → metrics
- `GET /api/analytics/dashboard/trends` → trend data
- `GET /api/analytics/dashboard/report` → custom reports
- `POST /api/analytics/dashboard/export` → export data

**Implementation Details:**
```tsx
src/views/Analytics/
├── AnalyticsDashboard.tsx
├── MetricsGrid.tsx
├── TrendCharts.tsx
└── ReportsGenerator.tsx
```

**Estimated Effort:** 8-10 hours

---

## Implementation Sequence

### Week 1
1. Dashboard Home (8-10 hours)
2. Product Terminal - Part 1: Search + Detail (6-8 hours)

**Week 1 Total:** 14-18 hours

### Week 2
1. Product Terminal - Part 2: Pricing + AI Stream (6-8 hours)
2. Marketplace & Community (10-12 hours)
3. Subscription & Billing (8-10 hours)

**Week 2 Total:** 24-30 hours

### Week 3
1. AI Console & Command Palette (8-10 hours)
2. Analytics & Reporting (8-10 hours)
3. Polish & optimizations (4-6 hours)

**Week 3 Total:** 20-26 hours

**Grand Total:** 58-74 hours estimated → 20-30 hours actual (2-3.5x acceleration)

---

## Component Usage Patterns

### Using the Component Library

```tsx
// Button patterns
<Button variant="default">Action</Button>
<Button variant="primary">Save</Button>
<Button variant="accent">AI Feature</Button>

// Card patterns
<Card>
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardBody>
    Content
  </CardBody>
</Card>

// KPI patterns
<KPI
  label="metric"
  value="$12,500"
  delta={15.2}
  deltaDir="up"
  color="copper"
  spark={[...]}
/>

// Layout pattern
<PageLayout
  active="dashboard"
  navItems={NAV_ITEMS}
  crumbs={['Dashboard']}
  liveIndicator={true}
>
  <YourContent />
</PageLayout>
```

## Design System Integration

- **All colors**: Use CSS custom properties (`var(--cyan)`, `var(--ink-0)`, etc.)
- **All spacing**: Use Tailwind scale (4px grid: `p-4`, `gap-6`, etc.)
- **All typography**: Use Geist font already imported in `tokens.css`
- **All components**: Import from `@/components`

## Testing Strategy

### Functionality Testing
- [ ] Each view loads without errors
- [ ] API calls return correct data shapes
- [ ] User interactions trigger expected actions
- [ ] Real-time updates (WebSocket, SSE) work correctly

### Design Testing
- [ ] Colors match tokens.css values
- [ ] Spacing aligns to 4px grid
- [ ] Typography matches specifications
- [ ] Components responsive on mobile
- [ ] Reduced motion respected

### Performance Testing
- [ ] Dashboard loads in < 2 seconds
- [ ] Infinite scroll smooth at 60fps
- [ ] WebSocket reconnection graceful
- [ ] No memory leaks in long sessions

---

## Known Blockers & Solutions

### Issue: Real-time data (WebSocket/SSE)
**Solution**: Use TanStack Query (React Query) for cache invalidation after SSE updates

### Issue: Complex charts (Sparklines, Heatmaps)
**Solution**: Use Recharts (lightweight, React-native) for all chart components

### Issue: Compatibility graph visualization
**Solution**: Use d3-force for 3-ring layout per HydraIQ design file

### Issue: Mobile responsiveness
**Solution**: Test on multiple breakpoints; ensure sidebar collapses at 768px

---

## Success Criteria

✅ **Functionality:**
- All 6 major views fully functional
- All API endpoints integrated
- Real-time data updates working
- Command palette operational

✅ **Design Fidelity:**
- Pixel-perfect HydraIQ implementation
- All colors match design system
- All spacing follows 4px grid
- All typography correct

✅ **Performance:**
- Dashboard loads < 2 sec
- Terminal responds < 1 sec
- No layout shifts
- Smooth scrolling

✅ **Code Quality:**
- Full TypeScript strict mode
- Reusable component library
- Clean separation of concerns
- Comprehensive error handling

---

## Velocity Projection

**Phase 1:** 20 hours → 4x acceleration  
**Phase 2:** 25 hours → 2.7x acceleration  
**Phase 3:** 22 hours → 1.8x acceleration  
**Phase 4:** 17.5 hours → 2.3x acceleration  
**Phase 5:** 8 hours → 3.75x acceleration  
**Phase 6:** 58-74 hours estimated → **20-30 hours actual (2-3.5x expected)**

**Total Project:** 92.5 + 25 = **117.5 hours actual vs 400+ estimated**

---

## Next Steps

1. ✅ **Design System**: HydraIQ tokens + documentation complete
2. ✅ **Component Library**: Primitives + layout components ready
3. **Dashboard Home**: Ready to implement this week
4. **Product Terminal**: Core feature for week 2
5. **Community Views**: Week 2-3
6. **Analytics**: Week 3
7. **Polish & Deploy**: Week 3-4

---

**Start Date**: May 13, 2026  
**Target Completion**: May 30, 2026  
**Status**: Ready for development  
**Acceleration Factor**: 2-3.5x expected on Phase 6

---

*Phase 6 Implementation Guide | Masco Intel v3.1 | HydraIQ Design System*
