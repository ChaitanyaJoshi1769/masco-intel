# Masco Intel API Endpoints Reference

**Total Endpoints**: 248+ REST + 12 WebSocket events  
**Version**: v3.4.0  
**Base URL**: `http://localhost:3001/api`

## 🔐 Authentication

All endpoints (except `/auth/login`, `/auth/register`) require JWT token in `Authorization` header:
```
Authorization: Bearer <token>
```

### Auth Endpoints
- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Register new account
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/password-reset` - Request password reset
- `POST /auth/password-reset/:token` - Reset password with token

## 🛍️ Products

### Search & Discovery
- `GET /products/search?q=<query>&limit=20` - Full-text search
- `GET /products/:id` - Get product details
- `GET /products/:id/components` - Get product components & parts
- `GET /products/:id/lineage` - Get OEM relationship tree
- `GET /products/:id/retailers` - Get product from different retailers
- `GET /products/:id/insights` - Get AI insights about product

### Watchlist Management
- `POST /watchlist` - Add product to watchlist
- `DELETE /watchlist/:productId` - Remove from watchlist
- `GET /watchlist` - Get all saved products

### Pricing
- `GET /pricing/:productId` - Get current prices across retailers
- `GET /pricing/:productId/history?days=90` - Price history (90d, 6m, 1y)
- `GET /pricing/:productId/trends` - Price trend analysis
- `GET /pricing/:productId/comparison` - Compare prices by retailer

## 📊 Intelligence & Analysis

### Product Comparison
- `POST /comparison` - Compare multiple products
- `POST /comparison/bulk` - Bulk comparison (3+ products)
- `GET /comparison/:id` - Get comparison results

### Recommendations
- `GET /recommendations/:productId` - Get product recommendations
- `GET /recommendations/personalized` - Personalized recommendations
- `GET /recommendations/trending` - Trending products
- `GET /recommendations/bundles` - Compatible bundles

### Quality Analysis
- `GET /quality/:productId` - Quality analysis report
- `GET /quality/bulk?ids=<id1,id2,...>` - Bulk quality analysis
- `POST /quality/custom` - Custom quality scoring

### Contractor Intelligence
- `GET /contractor/:productId` - Contractor suitability analysis
- `GET /contractor/ranking?productType=faucet` - Brand reliability ranking
- `POST /contractor/roi` - ROI calculator
- `POST /contractor/tco` - Total cost of ownership analysis

### Product Matching
- `POST /matching/find-duplicates` - Find duplicate products
- `POST /matching/semantic-search` - Semantic product matching
- `POST /matching/image-search` - Image-based product matching

## 🔍 Market Intelligence

### Brand Analysis
- `GET /market-intelligence/brands` - All brand metrics
- `GET /market-intelligence/brands/:name` - Single brand analysis
- `GET /market-intelligence/market-share` - Brand market share distribution
- `GET /market-intelligence/positioning?type=faucet` - Competitive positioning

### Price Trends
- `GET /market-intelligence/price-trends/:productId?days=90` - Price history
- `GET /market-intelligence/volatility/:productId` - Price volatility metrics
- `GET /market-intelligence/best-buy/:productId` - Best buy time recommendations

## 💬 Community & Marketplace

### Forums
- `GET /forum/categories` - Get all forum categories
- `GET /forum/threads?category=general` - Get threads by category
- `GET /forum/threads/:id` - Get thread details
- `POST /forum/threads` - Create new thread
- `POST /forum/threads/:id/replies` - Post reply
- `GET /forum/search?q=<query>` - Search forum posts

### Marketplace
- `GET /marketplace/profiles` - List contractor profiles
- `GET /marketplace/services` - List available services
- `GET /marketplace/orders` - Get user's orders
- `POST /marketplace/orders` - Create new order
- `GET /marketplace/reviews/:contractorId` - Get contractor reviews
- `POST /marketplace/reviews` - Post review

## 💳 Billing & Subscriptions

### Plans & Subscriptions
- `GET /subscriptions/plans` - Get all subscription plans
- `GET /subscriptions/current` - Get current subscription
- `GET /subscriptions/usage` - Get usage metrics
- `POST /subscriptions/upgrade` - Upgrade subscription plan
- `POST /subscriptions/cancel` - Cancel subscription
- `GET /subscriptions/invoices` - Get billing history

## 📈 Dashboard & Analytics

### Dashboard Metrics
- `GET /analytics/dashboard/overview` - Dashboard overview
- `GET /analytics/dashboard/metrics` - KPI metrics (orders, costs, savings, compliance)
- `GET /analytics/dashboard/trends` - Dashboard trends

### Analytics
- `GET /analytics/metrics` - Comprehensive metrics
- `GET /analytics/trends?range=30d` - Trends (7d, 30d, 90d, 1y)
- `GET /analytics/heatmap` - Category heatmap
- `GET /analytics/export?format=csv` - Export analytics (CSV/JSON)

## 💬 Chatbot & Support

### Conversations
- `POST /chatbot/conversations` - Create new conversation
- `GET /chatbot/conversations/:id` - Get conversation history
- `POST /chatbot/conversations/:id/messages` - Send message
- `POST /chatbot/messages/:id/helpful` - Mark message helpful/not helpful

## 📧 Notifications

### Alerts & Subscriptions
- `GET /notifications` - Get user notifications
- `GET /notifications/preferences` - Get notification preferences
- `PUT /notifications/preferences` - Update preferences
- `POST /notifications/subscribe` - Subscribe to alerts
- `DELETE /notifications/unsubscribe/:alertId` - Unsubscribe

## 🔌 WebSocket Events (Real-time)

**URL**: `ws://localhost:3001`

### Chat Events
- `register` - Register user connection
- `join-conversation` - Join conversation room
- `leave-conversation` - Leave conversation room
- `send-message` - Send message (broadcasts to room)
- `typing` - Send typing indicator
- `mark-read` - Mark messages as read

### Notification Events
- `subscribe-notifications` - Subscribe to notifications
- `unsubscribe-notifications` - Unsubscribe from notifications
- `notification` - Receive notification (broadcast)
- `mark-notification-read` - Mark notification as read
- `clear-notifications` - Clear all notifications
- `pending-notifications` - Receive pending on reconnect

## 🛡️ Advanced Features

### Integrations
- `GET /integrations/providers` - List available providers
- `POST /integrations/:provider/connect` - Connect provider
- `GET /integrations/:provider/status` - Check connection status
- `POST /integrations/:provider/sync` - Trigger sync

### Webhooks
- `POST /webhooks` - Create webhook
- `GET /webhooks` - List webhooks
- `DELETE /webhooks/:id` - Delete webhook
- `GET /webhooks/:id/logs` - View webhook logs

### API Keys
- `POST /api-keys` - Generate API key
- `GET /api-keys` - List API keys
- `DELETE /api-keys/:id` - Revoke API key
- `POST /api-keys/:id/rotate` - Rotate key

### Permissions
- `GET /permissions` - Get user permissions
- `POST /permissions/grant` - Grant permission
- `DELETE /permissions/:id` - Revoke permission
- `GET /audit-logs` - View audit logs

## 📊 Bulk Operations

### Batch Processing
- `POST /bulk/analyze` - Analyze multiple products
- `POST /bulk/compare` - Compare multiple products
- `POST /bulk/recommend` - Get recommendations for multiple
- `POST /bulk/export` - Bulk export
- `POST /bulk/job/:jobId/status` - Check job status

## 🔍 Search API

### Full-text & Faceted Search
- `GET /search/products?q=<query>&filters=<json>` - Search with filters
- `GET /search/suggest?q=<query>` - Auto-complete suggestions
- `GET /search/filters` - Available filter options
- `POST /search/advanced` - Advanced search with complex queries

## Error Responses

All endpoints return standard error format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## Rate Limiting

- Standard: 100 requests/minute per IP
- Authenticated: 1000 requests/minute per user
- Premium: Unlimited

## Pagination

List endpoints support:
- `limit` - Items per page (default: 20, max: 100)
- `offset` - Starting position (default: 0)
- `sort` - Sort by field (default: created_at)
- `order` - asc or desc (default: desc)

Example:
```
GET /products/search?q=faucet&limit=20&offset=0&sort=price&order=asc
```

## Testing Endpoints

Try these in Postman or cURL:

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Search Products
curl -X GET "http://localhost:3001/api/products/search?q=faucet" \
  -H "Authorization: Bearer <token>"

# Get Dashboard Metrics
curl -X GET http://localhost:3001/api/analytics/dashboard/metrics \
  -H "Authorization: Bearer <token>"
```

---

**Last Updated**: May 14, 2026  
**Maintained by**: Masco Intel Team  
**Questions?**: Check [docs](./docs) or open an [issue](https://github.com/ChaitanyaJoshi1769/masco-intel/issues)
