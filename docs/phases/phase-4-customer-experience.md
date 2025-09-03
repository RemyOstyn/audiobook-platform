# Phase 4: Customer Experience Implementation

**Goal**: Complete shopping experience with browsing, cart, checkout, and user library  
**Timeline**: Day 4 (8-10 hours)  
**Status**: READY TO IMPLEMENT

## Prerequisites Completed

✅ **From Phase 1 (Foundation)**:
- Next.js 15 project with TypeScript and Tailwind CSS
- Supabase authentication and database configured
- Prisma ORM with complete schema including `cart_items`, `orders`, `order_items`, `user_library` tables
- User authentication with roles (admin/user)
- Protected routes and middleware

✅ **From Phase 2 (Admin Core)**:
- Admin dashboard for managing audiobooks
- File upload system with Supabase Storage
- Audiobook CRUD operations
- Database populated with audiobook records

✅ **From Phase 3 (AI Integration)**:
- AI transcription and content generation pipeline
- Processing jobs management system
- Audiobooks have AI-generated descriptions and categories
- Status: 'active' audiobooks ready for customer viewing

## Current State Analysis

### Existing Components:
- Basic browse page at `/browse` (minimal implementation)
- Audiobook detail page at `/audiobooks/[id]` (basic structure)
- User dashboard at `/dashboard` with stats cards
- Zustand already installed (package.json line 46)
- User library table exists in database schema

### Missing Components:
- Shopping cart functionality
- Checkout process
- Payment integration (mocked for MVP)
- User library/purchases page
- Search and filtering
- Download/streaming capabilities

## Core Features to Implement

### 1. Enhanced Catalog Browsing
**Location**: `/app/(protected)/browse/page.tsx`
- Grid/list view toggle for audiobooks
- Display audiobooks with status='active'
- Show cover images, titles, authors, prices
- Pagination (12 items per page)
- Sort options: newest, price (low-high, high-low), title

### 2. Search and Filtering
**Components needed**:
- Search bar with real-time results
- Category filter checkboxes
- Price range slider
- Author filter
- Clear filters button

**Database considerations**:
- Utilize existing indexes for performance
- Full-text search using PostgreSQL capabilities

### 3. Shopping Cart System
**State Management**: Zustand store
- Persistent cart using localStorage
- Sync with database for logged-in users
- Guest cart support using session_id

**Features**:
- Add/remove items
- Cart count in header
- Cart drawer/modal
- Price calculation
- Clear cart functionality

### 4. Product Detail Pages
**Location**: `/app/(protected)/audiobooks/[id]/page.tsx`
- Full audiobook metadata display
- AI-generated description
- Categories/tags display
- Sample audio preview (if available)
- Add to cart button
- Price display
- Download/stream buttons (for purchased items)

### 5. Checkout Process
**Flow**:
1. Cart review page
2. User information (auto-filled if logged in)
3. Payment method (mocked for MVP)
4. Order confirmation

**Database operations**:
- Create order record
- Create order_items
- Add to user_library
- Clear cart
- Update audiobook status if needed

### 6. User Library
**Location**: `/app/(protected)/dashboard/library/page.tsx`
- List all purchased audiobooks
- Download links (presigned URLs)
- Stream/play functionality
- View transcription
- Re-download capability
- Purchase date display

## Technical Architecture

### Data Flow
```
1. Browse Catalog
   ├── Fetch active audiobooks from Supabase
   ├── Apply filters/search
   └── Display with pagination

2. Add to Cart
   ├── Update Zustand store
   ├── Persist to localStorage
   └── Sync with database (if logged in)

3. Checkout
   ├── Validate cart items
   ├── Create order record
   ├── Process payment (mocked)
   ├── Add to user_library
   └── Clear cart

4. Access Library
   ├── Fetch user_library records
   ├── Generate presigned URLs
   └── Enable download/streaming
```

## Required Dependencies

### Already Installed:
- `zustand@^5.0.8` - State management for cart
- `@tanstack/react-table` - For data tables
- `react-hook-form` - For checkout forms
- `zod` - Form validation
- `lucide-react` - Icons
- All UI components from shadcn/ui

### No Additional Dependencies Needed

## API Endpoints to Create

### Cart Management
```
GET    /api/cart                 // Get current cart
POST   /api/cart/add             // Add item to cart
DELETE /api/cart/remove/[id]     // Remove item
DELETE /api/cart/clear           // Clear entire cart
POST   /api/cart/sync            // Sync guest cart after login
```

### Checkout
```
POST   /api/checkout/validate    // Validate cart before checkout
POST   /api/checkout/process     // Process order (mock payment)
GET    /api/orders/[id]          // Get order details
```

### User Library
```
GET    /api/user/library         // Get purchased audiobooks
GET    /api/user/library/[id]/download  // Generate download URL
GET    /api/user/library/[id]/stream    // Generate streaming URL
```

### Search and Browse
```
GET    /api/audiobooks/search    // Search with filters
GET    /api/audiobooks/categories // Get all categories
```

## Database Queries Required

### Browse Catalog
```sql
-- Get active audiobooks with pagination
SELECT id, title, author, price, cover_image_url, categories
FROM audiobooks
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 12 OFFSET ?;
```

### Cart Operations
```sql
-- Add to cart (handle unique constraint)
INSERT INTO cart_items (user_id, session_id, audiobook_id)
VALUES (?, ?, ?)
ON CONFLICT DO NOTHING;
```

### Order Processing
```sql
-- Transaction for order creation
BEGIN;
INSERT INTO orders (...) VALUES (...);
INSERT INTO order_items (...) VALUES (...);
INSERT INTO user_library (...) VALUES (...);
DELETE FROM cart_items WHERE user_id = ?;
COMMIT;
```

## Zustand Store Structure

```typescript
interface CartStore {
  items: CartItem[]
  isLoading: boolean
  
  // Actions
  addItem: (audiobook: Audiobook) => Promise<void>
  removeItem: (audioBookId: string) => Promise<void>
  clearCart: () => Promise<void>
  syncCart: () => Promise<void>
  
  // Computed
  totalItems: number
  totalPrice: number
}
```

## Implementation Task List

### Phase 4 Task Breakdown (8-10 hours)

#### Task 1: Cart State Management (2 hours)
**Priority**: High
**Dependencies**: None

**Subtasks**:
- [ ] Create Zustand store at `lib/stores/cart-store.ts`
- [ ] Implement localStorage persistence layer
- [ ] Add cart actions (addItem, removeItem, clearCart, syncCart)
- [ ] Create cart API routes in `/api/cart/`
- [ ] Add cart icon to header with count badge
- [ ] Test cart persistence across page refreshes

**Files to create/modify**:
- `lib/stores/cart-store.ts`
- `app/api/cart/route.ts`
- `app/api/cart/add/route.ts`
- `app/api/cart/remove/[id]/route.ts`
- `app/api/cart/clear/route.ts`
- `components/header.tsx` (add cart icon)

#### Task 2: Enhanced Browse Page (2 hours)
**Priority**: High
**Dependencies**: None

**Subtasks**:
- [ ] Update `/app/(protected)/browse/page.tsx` with proper layout
- [ ] Create AudiobookCard component for grid display
- [ ] Implement responsive grid (1 col mobile, 2 tablet, 3-4 desktop)
- [ ] Add pagination controls component
- [ ] Create sort dropdown (newest, price low-high, high-low, title)
- [ ] Add loading skeletons for better UX
- [ ] Connect to existing audiobooks API

**Files to create/modify**:
- `app/(protected)/browse/page.tsx`
- `components/browse/audiobook-card.tsx`
- `components/browse/pagination.tsx`
- `components/browse/sort-dropdown.tsx`
- `components/ui/skeleton.tsx`

#### Task 3: Search and Filtering (1.5 hours)
**Priority**: Medium
**Dependencies**: Task 2

**Subtasks**:
- [ ] Create SearchBar component with debounced input
- [ ] Add category filter sidebar/dropdown
- [ ] Implement price range filter component
- [ ] Create search API endpoint with full-text search
- [ ] Create categories API endpoint
- [ ] Integrate filters with browse page state
- [ ] Add clear filters functionality

**Files to create/modify**:
- `components/search/search-bar.tsx`
- `components/search/category-filter.tsx`
- `components/search/price-range-filter.tsx`
- `app/api/audiobooks/search/route.ts`
- `app/api/audiobooks/categories/route.ts`

#### Task 4: Product Detail Page (1.5 hours)
**Priority**: High
**Dependencies**: Task 1

**Subtasks**:
- [ ] Enhance `/app/(protected)/audiobooks/[id]/page.tsx`
- [ ] Display full audiobook metadata and AI description
- [ ] Add "Add to Cart" button with loading state
- [ ] Show ownership status if user has purchased
- [ ] Add breadcrumb navigation
- [ ] Display categories as tags
- [ ] Add error handling for non-existent audiobooks

**Files to create/modify**:
- `app/(protected)/audiobooks/[id]/page.tsx`
- `components/audiobooks/add-to-cart-button.tsx`
- `components/audiobooks/ownership-badge.tsx`
- `components/ui/breadcrumb.tsx`

#### Task 5: Checkout Process (2 hours)
**Priority**: High
**Dependencies**: Task 1

**Subtasks**:
- [ ] Create cart review page at `/cart`
- [ ] Build checkout form with user information
- [ ] Add form validation using react-hook-form + zod
- [ ] Implement mock payment processing
- [ ] Create order confirmation page
- [ ] Build checkout API endpoints with proper error handling
- [ ] Add order number generation
- [ ] Handle inventory checks during checkout

**Files to create/modify**:
- `app/(protected)/cart/page.tsx`
- `app/(protected)/checkout/page.tsx`
- `app/(protected)/checkout/success/page.tsx`
- `components/cart/cart-summary.tsx`
- `components/checkout/checkout-form.tsx`
- `app/api/checkout/validate/route.ts`
- `app/api/checkout/process/route.ts`
- `lib/utils/order-utils.ts`

#### Task 6: User Library (1 hour)
**Priority**: Medium
**Dependencies**: Task 5

**Subtasks**:
- [ ] Create `/app/(protected)/dashboard/library/page.tsx`
- [ ] Display purchased audiobooks in grid/list format
- [ ] Add download functionality with presigned URLs
- [ ] Create basic streaming player component
- [ ] Enable re-download capability with limits
- [ ] Add purchase date and order reference
- [ ] Handle empty library state

**Files to create/modify**:
- `app/(protected)/dashboard/library/page.tsx`
- `components/library/library-grid.tsx`
- `components/library/download-button.tsx`
- `components/library/audio-player.tsx`
- `app/api/user/library/route.ts`
- `app/api/user/library/[id]/download/route.ts`

### Testing Tasks (Throughout implementation)

#### Unit Tests
- [ ] Cart store actions and state management
- [ ] Order processing utility functions
- [ ] Form validation schemas
- [ ] Price calculation functions

#### Integration Tests
- [ ] Cart API endpoints
- [ ] Checkout flow API endpoints
- [ ] Search and filter functionality
- [ ] User library access

#### E2E Tests
- [ ] Complete purchase flow (browse → add to cart → checkout → library)
- [ ] Cart persistence across login/logout
- [ ] Search and filter functionality
- [ ] Mobile responsiveness

## UI/UX Considerations

### Mobile Responsiveness
- Responsive grid (1 col mobile, 2 col tablet, 3-4 col desktop)
- Touch-friendly buttons (min 44px)
- Swipeable cart drawer on mobile
- Responsive tables in library

### Loading States
- Skeleton loaders for audiobook cards
- Loading spinners for actions
- Optimistic updates for cart operations
- Progress indicators for checkout

### Error Handling
- Toast notifications for cart actions
- Form validation messages
- Network error recovery
- Empty state designs

## Security Considerations

### Cart Security
- Validate audiobook availability before checkout
- Prevent price manipulation
- Rate limit cart operations
- Sanitize search inputs

### Download Security
- Short-lived presigned URLs (1 hour)
- Verify ownership before generating URLs
- Log download attempts
- Limit concurrent downloads

### API Security
- Input validation on all endpoints
- Rate limiting on search endpoints
- Proper error messages without data exposure
- CSRF protection for state-changing operations

## Performance Optimizations

### Frontend
- Implement proper pagination (don't load all audiobooks)
- Debounce search input (300ms)
- Lazy load audiobook covers
- Virtual scrolling for large lists (future enhancement)
- Optimize images with Next.js Image component

### Backend
- Use database indexes for search queries
- Implement query optimization for browse page
- Cache popular search results (future enhancement)
- Batch cart operations where possible

## Common Pitfalls to Avoid

1. **Cart State Issues**: Ensure proper synchronization between Zustand, localStorage, and database
2. **Race Conditions**: Handle concurrent cart updates properly
3. **URL Security**: Don't expose direct file URLs, always use presigned URLs
4. **Mobile UX**: Test thoroughly on mobile devices
5. **Performance**: Implement proper pagination and avoid loading all audiobooks at once
6. **Error States**: Always handle loading and error states gracefully
7. **Form Validation**: Validate both client-side and server-side
8. **Inventory**: Check audiobook availability during checkout

## Environment Variables

**No new environment variables required**. Using existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Success Criteria

### Must Have (MVP)
- [ ] Browse catalog with active audiobooks
- [ ] Search audiobooks by title/author
- [ ] Filter by categories and price range
- [ ] Add/remove items from cart
- [ ] Persistent cart across sessions
- [ ] Complete checkout with mocked payment
- [ ] Access purchased audiobooks in library
- [ ] Download audiobook files
- [ ] Mobile responsive design

### Nice to Have (if time permits)
- [ ] Audio preview player
- [ ] Advanced filtering options
- [ ] Recently viewed items
- [ ] Wishlist functionality
- [ ] Email order confirmation
- [ ] Order history page
- [ ] Streaming audio player

## Testing Checklist

### Functional Tests
- [ ] Can browse audiobooks without errors
- [ ] Search returns relevant results
- [ ] Filters work correctly
- [ ] Can add items to cart
- [ ] Cart persists across page refreshes
- [ ] Cart syncs after login
- [ ] Can complete checkout flow
- [ ] Can access purchased audiobooks
- [ ] Can download audiobook files
- [ ] Mobile layout works correctly

### Edge Cases
- [ ] Adding duplicate items to cart
- [ ] Checkout with empty cart
- [ ] Network failure during checkout
- [ ] Invalid audiobook IDs
- [ ] Large cart (10+ items)
- [ ] Concurrent cart updates
- [ ] Search with no results
- [ ] Filters with no matches

### Performance
- [ ] Browse page loads < 2s
- [ ] Search results appear < 500ms
- [ ] Cart operations < 200ms
- [ ] Smooth scrolling on mobile
- [ ] Images load progressively

## Documentation Notes

### For Developers
- All components should use TypeScript with proper type definitions
- Follow existing code patterns and naming conventions
- Use shadcn/ui components for consistency
- Implement proper error boundaries
- Add loading states for all async operations
- Follow the existing folder structure

### API Documentation
- Document all new API endpoints
- Include request/response examples
- Add proper error codes and messages
- Document rate limiting rules
- Include authentication requirements

## Next Phase Preview

After Phase 4 completion, Phase 5 will focus on:
- Polish and error handling improvements
- Advanced loading states and animations
- Performance optimizations
- Real-time updates
- Enhanced mobile optimization
- UI refinements and accessibility
- Comprehensive testing

---

**Phase 4 is ready for implementation. All core customer experience features are defined with clear task breakdown and technical requirements.**