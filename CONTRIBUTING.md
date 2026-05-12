# Contributing to Masco Intel

Thank you for your interest in contributing to Masco Intel! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional. We're building something great together.

## Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/yourusername/masco-intel.git
cd masco-intel
```

### 2. Setup Development Environment

```bash
pnpm install
cp .env.example .env.local
docker-compose -f infrastructure/docker/docker-compose.yml up
pnpm run build
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## Development Workflow

### Running Tests

```bash
pnpm test
pnpm test:watch
```

### Type Checking

```bash
pnpm type-check
```

### Linting & Formatting

```bash
pnpm lint
pnpm format
```

### Building

```bash
pnpm build
```

## Making Changes

### Extension Development

1. Modify `apps/extension/src/*`
2. Build: `cd apps/extension && pnpm build`
3. Load `dist/` in Chrome (`chrome://extensions` → Load unpacked)
4. Test against supported retailers

### API Development

1. Modify `apps/api/src/*`
2. API hot-reloads: `pnpm dev` in `apps/api`
3. Test endpoints at `http://localhost:3001`

### Adding a New Retailer

1. Create scraper in `packages/scrapers/src`
2. Add content script extraction in `apps/extension/src/content.ts`
3. Update test coverage
4. Document retailer in README

### Database Changes

1. Update `packages/db/prisma/schema.prisma`
2. Create migration: `pnpm migrate`
3. Update TypeScript types if needed
4. Add test data in seed script

## Commit Messages

Use conventional commits:

```
feat: add builder-grade detection
fix: correct price comparison logic
docs: update API documentation
refactor: simplify matching engine
test: add integration tests for scrapers
chore: update dependencies
```

## Pull Requests

1. **Write clear PR title and description**
   - What problem does this solve?
   - How does it solve it?
   - Any breaking changes?

2. **Include tests** for new features
   - Unit tests for business logic
   - Integration tests for APIs
   - E2E tests for UI changes

3. **Update documentation**
   - API docs if endpoints change
   - README if user-facing
   - Architecture docs if design changes

4. **Ensure CI passes**
   - Type checking
   - Linting
   - All tests

### PR Checklist

- [ ] Tests pass locally
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Documentation updated
- [ ] No console errors/warnings
- [ ] Commit messages follow conventional format

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types without justification
- Proper error handling
- Comprehensive types for public APIs

### React Components

```typescript
interface Props {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<Props> = ({ title, onAction }) => {
  // Implementation
};
```

### API Controllers

```typescript
@Controller('api/resource')
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const data = await this.resourceService.findOne(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Database Models

Use Prisma conventions:
- CamelCase fields
- @id @default(cuid()) for primary keys
- Proper @relations
- @@index for frequently queried fields
- @@fulltext for search capabilities

## Testing

### Unit Tests

```typescript
describe('ProductService', () => {
  it('should find product by SKU', async () => {
    const result = await service.findBySku('ABC-123');
    expect(result).toBeDefined();
    expect(result.sku).toBe('ABC-123');
  });
});
```

### Integration Tests

```typescript
describe('Product API (e2e)', () => {
  it('POST /api/products should create product', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .send(createProductDto)
      .expect(201);
    expect(res.body.data.id).toBeDefined();
  });
});
```

## Documentation Style

- Use Markdown
- Code examples should be complete and runnable
- Keep paragraphs short and scannable
- Use headers to organize content
- Include diagrams for complex concepts

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions will build and push Docker image

## Questions?

- Check existing [issues](https://github.com/yourusername/masco-intel/issues)
- Join [discussions](https://github.com/yourusername/masco-intel/discussions)
- Email: dev@mascointe.dev

Thank you for contributing! 🚀
