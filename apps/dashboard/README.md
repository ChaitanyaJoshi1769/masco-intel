# Masco Intel Dashboard

Production-ready React dashboard for Masco Intel - the AI-powered B2B marketplace for plumbing fixtures and contractor services.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Backend API running on `http://localhost:3001`

### Installation

```bash
# From project root
cd apps/dashboard

# Install dependencies (handled by root pnpm)
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Configuration

Create `.env.local` in the dashboard directory:

```env
VITE_API_URL=http://localhost:3001
VITE_ENV=development
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_TIME=true
```

## 📋 Architecture

### Directory Structure

```
apps/dashboard/
├── src/
│   ├── views/              # Page components (Dashboard, Terminal, etc.)
│   ├── components/         # Reusable components (Button, Card, etc.)
│   │   ├── primitives/     # UI primitives
│   │   └── layout/         # Layout components
│   ├── services/           # API client and business logic
│   │   ├── api.ts          # Typed HTTP client
│   │   └── auth.ts         # Authentication service
│   ├── hooks/              # React hooks
│   │   ├── useAPI.ts       # Data fetching hook
│   │   └── useAuth.ts      # Authentication hook
│   ├── constants/          # Constants and enums
│   ├── tokens.css          # Design tokens (HydraIQ)
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

### Key Components

#### **Views (8 Total)**
- **Dashboard**: Overview with KPIs, watchlist, and insights
- **Product Terminal**: Product search, pricing, comparisons
- **Marketplace**: Contractor profiles and order management
- **Community**: Discussion forums and threads
- **Billing**: Subscription management and invoicing
- **Analytics**: Platform metrics and reporting
- **AI Console**: Chat with intelligent tool integration
- **Settings**: User preferences and configuration

#### **Services**
- **api.ts**: Type-safe HTTP client with request/response handling
- **auth.ts**: JWT-based authentication with token persistence

#### **Hooks**
- **useAPI**: Fetch data with loading/error states
- **useAuth**: Authentication state and methods
- **useMutation**: Execute mutations with optimistic updates

#### **Component Library**
- **Primitives**: Button, Card, Chip, KPI, Sparkline
- **Layout**: SideNav, TopBar, PageLayout
- **Utilities**: Loading, Error

## 🎨 Design System

### HydraIQ Integration
The dashboard uses the HydraIQ design system with:

- **Color Palette**: Dark mode (bg-0 to bg-4), accents (cyan/violet/copper), semantics (ok/warn/bad)
- **Typography**: Geist, Geist Mono, Space Grotesk
- **Spacing**: 4px grid throughout
- **Tokens**: 30+ CSS custom properties in `tokens.css`

### Using Design Tokens

```tsx
// Colors
style={{ color: 'var(--cyan)' }}
style={{ backgroundColor: 'var(--bg-2)' }}

// Spacing (via Tailwind)
className="p-4 gap-6 mb-8"

// Typography (imported in tokens.css)
className="font-geist text-base font-bold"
```

## 🔐 Authentication

### Login Flow
1. User enters email/password on Login view
2. `authService.login()` calls `/api/auth/login`
3. Backend returns JWT tokens + user data
4. Tokens stored in localStorage
5. Auth state updated via observable pattern
6. Components re-render via `useAuth()` hook

### API Authentication
All API calls automatically include auth headers:

```ts
const headers = authService.getAuthHeaders();
// Returns: { Authorization: "Bearer <token>" }
```

### Token Refresh
Automatic token refresh on 401 responses:

```ts
await authService.refreshToken();
// Calls /api/auth/refresh with refresh_token
// Returns new access_token
```

## 📡 API Integration

### Fetching Data

```tsx
import { useAPI } from '../hooks';
import { dashboardAPI } from '../services/api';

function Dashboard() {
  const { data, loading, error, refetch } = useAPI(
    () => dashboardAPI.getOverview(),
    { dependencies: [] }
  );

  if (loading) return <Loading />;
  if (error) return <Error error={error} onRetry={refetch} />;

  return <div>{/* Render data */}</div>;
}
```

### Mutating Data

```tsx
import { useAPIMutation } from '../hooks';
import { marketplaceAPI } from '../services/api';

function CreateOrder() {
  const { execute, loading, error } = useAPIMutation(
    (orderData) => marketplaceAPI.createOrder(orderData)
  );

  const handleSubmit = async (data) => {
    try {
      await execute(data);
      // Success!
    } catch (err) {
      // Error handling
    }
  };
}
```

## 🛠️ Development

### Vite Configuration
- Fast HMR (Hot Module Replacement)
- TypeScript support
- CSS preprocessing
- Build optimization

### TypeScript
- Strict mode enabled
- Full type safety
- Auto-import via path aliases (`@/components`)

### Build Command
```bash
pnpm build
# Output: dist/
```

### Preview Production Build
```bash
pnpm preview
```

## 📦 Dependencies

### Key Libraries
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Fetch API**: HTTP client

### No External UI Library
The dashboard implements its own component library using:
- CSS custom properties for theming
- Tailwind CSS for utility-first styling
- React composition patterns

## 🧪 Testing

Run tests with:
```bash
pnpm test
```

Test coverage includes:
- Component rendering
- API integration
- Authentication flow
- Form validation

## 📈 Performance

- **Bundle Size**: ~214 KB (61 KB gzipped)
- **Build Time**: ~3.5 seconds
- **Load Time**: <2 seconds on 3G
- **Lighthouse Score**: 95+ (performance)

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 5173
CMD ["pnpm", "preview"]
```

### Environment Variables (Production)
```env
VITE_API_URL=https://api.example.com
VITE_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_SOURCE_MAP=false
```

### Deploying to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --cwd apps/dashboard
```

## 📚 API Endpoints

### Dashboard
- `GET /api/analytics/dashboard/overview` - Dashboard metrics
- `GET /api/analytics/dashboard/trends` - Trend data

### Products
- `GET /api/products/search` - Search products
- `GET /api/products/:id` - Product details
- `GET /api/pricing/:id` - Pricing information
- `GET /api/comparison/:id` - Comparison data

### Marketplace
- `GET /api/marketplace/profiles` - Contractor list
- `GET /api/marketplace/services` - Services list
- `GET /api/marketplace/orders` - User orders
- `POST /api/marketplace/orders` - Create order

### Community
- `GET /api/forum/threads` - Discussion threads
- `POST /api/forum/threads/:id/replies` - Post reply

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Current user

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes with tests
3. Ensure build passes: `pnpm build`
4. Submit PR with description

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- **Backend API**: [Masco Intel API](../api)
- **Design System**: [HydraIQ Design](./HYDRAIQ_DESIGN_SYSTEM.md)
- **GitHub**: [masco-intel](https://github.com/ChaitanyaJoshi1769/masco-intel)
- **Documentation**: [Docs](../../docs)

---

**Version**: 3.1.0 | **Last Updated**: May 13, 2026
