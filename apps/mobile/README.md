# Masco Intel Mobile App

React Native mobile application for iOS and Android platforms.

## Features

- **Product Discovery**: Browse and search building materials across multiple retailers
- **Price Tracking**: Monitor price changes and set price alerts
- **Saved Products**: Bookmark favorite products for later reference
- **Comparisons**: Compare multiple products side-by-side
- **Recommendations**: Get personalized product recommendations
- **Market Intelligence**: View price trends and market analysis
- **Real-time Alerts**: Receive notifications for price drops and stock updates

## Tech Stack

- **React Native**: Cross-platform mobile framework
- **TypeScript**: Type-safe development
- **React Navigation**: Navigation management
- **Zustand**: State management
- **Axios**: HTTP client
- **AsyncStorage**: Local persistence

## Project Structure

```
src/
├── screens/           # Screen components
│   ├── HomeScreen.tsx
│   ├── SearchScreen.tsx
│   ├── ProductDetailScreen.tsx
│   ├── SavedProductsScreen.tsx
│   ├── AlertsScreen.tsx
│   └── SettingsScreen.tsx
├── store/            # Zustand state management
│   └── productStore.ts
├── services/         # API and business logic
│   └── api.ts
└── App.tsx           # Main app component
```

## Getting Started

### Prerequisites

- Node.js 16+
- Xcode (for iOS development)
- Android Studio (for Android development)
- Watchman (recommended for macOS)

### Installation

```bash
# Install dependencies
npm install

# or
pnpm install

# For iOS additional setup
cd ios && pod install && cd ..
```

### Running the App

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Development Server:**
```bash
npm start
```

## API Integration

The app connects to the Masco Intel API backend. Configure the API URL in the environment:

```bash
REACT_APP_API_URL=http://localhost:3001/api
```

## Navigation Structure

- **Home**: Featured products and trending items
- **Search**: Full-text product search with filters
- **Saved**: Bookmarked products with notes
- **Alerts**: Price drop alerts and notifications
- **Settings**: User preferences and account management

## Screens

### Home Screen
Displays featured products and quick access to categories

### Search Screen
Full-text search with autocomplete and filtering by:
- Price range
- Brand
- Product type
- Finish/Style

### Product Detail Screen
Complete product information including:
- Images and specifications
- Price history chart
- Quality analysis
- Contractor ratings
- Related products
- Save/compare actions

### Saved Products Screen
Manage bookmarked products with:
- Custom notes
- Price tracking
- Quick comparison access

### Alerts Screen
Real-time notifications for:
- Price drops
- Stock availability
- Quality issues
- Competitor actions

### Settings Screen
- Notification preferences
- Theme settings
- Account management

## Development

### Build Commands

```bash
# Development build
npm start

# Production build (iOS)
npm run build:ios

# Production build (Android)
npm run build:android

# Linting
npm run lint

# Tests
npm run test
```

### State Management

The app uses Zustand for state management. The main store is `productStore`:

```typescript
import { useProductStore } from '@/store/productStore';

const { products, savedProducts, searchQuery } = useProductStore();
```

### API Calls

Use the `apiClient` utility for all API calls:

```typescript
import { apiClient } from '@/services/api';

const products = await apiClient.getProducts(page, limit);
const saved = await apiClient.getSavedProducts();
await apiClient.saveProduct(productId, notes);
```

## Features Roadmap

- [ ] Offline support with data sync
- [ ] Camera integration for product photo scanning
- [ ] AR product visualization
- [ ] Voice search
- [ ] Batch product comparison
- [ ] Export comparison reports
- [ ] Contractor workspace collaboration
- [ ] Integration with supplier systems

## Testing

```bash
npm run test
```

## Performance Optimization

- Image lazy loading
- Virtual lists for large datasets
- Memoization of expensive components
- Debounced search

## License

© 2024 Masco Intel. All rights reserved.
