# Product Requirements Document (PRD)
## Audiobook E-Commerce Platform

### Document Information
- **Version**: 1.0
- **Date**: January 2025
- **Author**: Senior Full Stack Developer
- **Timeline**: 6 days (MVP)
- **Status**: Implementation Ready

---

## 1. Executive Summary

### 1.1 Objective
Build a production-ready audiobook e-commerce platform with AI-powered transcription and content generation capabilities. The platform consists of a customer-facing storefront and an admin panel for content management.

### 1.2 Success Criteria
- Functional e-commerce flow from browsing to digital delivery
- AI-powered transcription and description generation for audiobooks
- Robust error handling for file processing failures
- Comprehensive testing coverage for critical paths
- Clean architecture demonstrating production-ready patterns

### 1.3 Constraints
- 6-day development timeline
- Must handle files up to 500MB (typical audiobook size)
- OpenAI Whisper API 25MB file size limit
- Vercel serverless function timeout limitations
- Budget constraint (~$10 for demo period)

---

## 2. Technical Architecture

### 2.1 Tech Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Frontend** | Next.js 15 (App Router) | Full-stack capabilities, React Server Components, excellent DX |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design system |
| **Database** | PostgreSQL (Supabase) | ACID compliance, full-text search, JSON support |
| **Authentication** | Supabase Auth | Built-in OAuth, session management, RLS integration |
| **File Storage** | Supabase Storage | S3-compatible, presigned URLs, integrated with auth |
| **Queue System** | Inngest | Event-driven, durable execution, built-in monitoring |
| **AI Services** | OpenAI (Whisper + GPT-4) | Industry standard, reliable, single vendor |
| **Deployment** | Vercel (frontend) + Railway (workers) | Optimal for Next.js, background job support |
| **State Management** | Zustand | Lightweight, TypeScript-first, persistent cart |
| **ORM** | Prisma | Type-safe database access, migrations |

### 2.2 Architecture Pattern

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │────▶│  Next.js/    │────▶│   Supabase   │
│             │     │   Vercel     │     │   Database   │
└─────────────┘     └──────────────┘     └──────────────┘
       │                    │                     ▲
       │                    ▼                     │
       │             ┌──────────────┐            │
       └────────────▶│   Supabase   │            │
         Direct      │   Storage    │            │
         Upload      └──────────────┘            │
                            │                     │
                            ▼                     │
                     ┌──────────────┐            │
                     │   Inngest    │            │
                     │  Event Bus   │            │
                     └──────────────┘            │
                            │                     │
                            ▼                     │
                     ┌──────────────┐            │
                     │   Railway    │            │
                     │   Worker     │────────────┘
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  OpenAI API  │
                     └──────────────┘
```

### 2.3 Data Flow Diagrams

#### Upload Flow
```
1. Admin selects file → Browser
2. Browser requests presigned URL → Next.js API
3. Next.js generates URL → Supabase Storage
4. Browser uploads directly → Supabase Storage
5. Upload complete → Trigger Inngest event
6. Inngest orchestrates → Railway worker
7. Worker processes → OpenAI APIs
8. Results saved → Supabase Database
```

#### Purchase Flow
```
1. User browses catalog → Next.js SSR
2. Add to cart → Zustand + localStorage
3. Checkout → Next.js API
4. Payment (mocked) → Success response
5. Order created → Database transaction
6. Library updated → User access granted
7. Download/stream → Presigned URLs
```

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

#### FR-AUTH-001: User Registration
- **Email/password** registration with validation
- **Google OAuth** as alternative signup method
- Email verification (optional for MVP)
- Automatic cart migration on registration
- Profile creation with default user role

#### FR-AUTH-002: User Login
- Email/password authentication
- Google OAuth login
- "Remember me" functionality (30-day sessions)
- Session refresh without re-login
- Redirect to intended page after login

#### FR-AUTH-003: Password Management
- Password reset via email link
- Password strength requirements (min 8 chars, 1 number)
- Secure token expiration (1 hour)
- Password change requires current password

#### FR-AUTH-004: Role Management
- Two roles: `admin` and `user`
- Role-based route protection
- Admin dashboard access control
- Role checking middleware

### 3.2 Admin Features

#### FR-ADMIN-001: Audiobook Upload
- Support formats: MP3, M4A, M4B, AAC
- Maximum file size: 500MB
- Direct-to-storage upload with progress indicator
- Metadata input form:
  - Title (required)
  - Author (required)
  - Price (required, min $0.99)
  - Cover image (optional)
  - ISBN (optional)
  - Publication year (optional)

#### FR-ADMIN-002: AI Processing
- Automatic transcription via Whisper API
- AI-generated description (500-1000 words)
- Auto-categorization (up to 3 tags)
- Processing status dashboard
- Retry failed processing
- Manual override options

#### FR-ADMIN-003: Content Management
- Edit audiobook metadata
- Re-generate AI content
- Set pricing and availability
- View sales analytics (basic)
- Bulk operations (future)
- Export data as CSV

#### FR-ADMIN-004: Dashboard
- Upload queue status
- Processing statistics
- Recent orders
- System health indicators
- Quick actions panel

### 3.3 Customer Features

#### FR-USER-001: Browse Catalog
- Grid/list view toggle
- Search by title/author
- Filter by category
- Sort by: newest, price, popularity
- Pagination (12 items per page)
- Book cover thumbnails

#### FR-USER-002: Product Details
- Audiobook metadata display
- AI-generated description
- Sample preview (first 2 minutes)
- Add to cart functionality
- Reviews (future feature)
- Related books (future feature)

#### FR-USER-003: Shopping Cart
- Persistent cart (localStorage + DB)
- Quantity management (digital = 1)
- Price calculation
- Remove items
- Clear cart
- Guest checkout support
- Cart count in header

#### FR-USER-004: Checkout
- Order summary
- User information (auto-filled if logged in)
- Mock payment (success/failure simulation)
- Order confirmation page
- Order confirmation email (optional)
- Instant library access on success

#### FR-USER-005: User Library
- List purchased audiobooks
- Stream audio player
- Download audiobook file
- Download transcription (TXT/PDF)
- Purchase history
- Re-download capability

### 3.4 AI Processing Requirements

#### FR-AI-001: Transcription
- Process audio files up to 500MB
- Handle chunking for files > 25MB
- Maintain timestamp accuracy
- Support English (MVP)
- Error recovery for partial failures

#### FR-AI-002: Content Generation
- Generate 500-1000 word descriptions
- Extract key themes and topics
- Create SEO-friendly summaries
- Auto-tag with relevant categories:
  - Fiction genres (Mystery, Romance, Sci-Fi, etc.)
  - Non-fiction categories (Business, Self-help, History, etc.)
  - Age groups (Children, Young Adult, Adult)

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **Page Load**: < 3s on 3G connection
- **Time to Interactive**: < 5s
- **Upload Speed**: Limited only by user bandwidth
- **Processing Time**: < 1 minute per 10 minutes of audio
- **Database Queries**: < 100ms for catalog browsing
- **API Response**: < 500ms for CRUD operations

### 4.2 Scalability
- Support 100 concurrent users (MVP)
- Handle 10 simultaneous uploads
- Process queue for 50 pending jobs
- Horizontal scaling ready architecture
- Database connection pooling
- CDN-ready static assets

### 4.3 Reliability
- **Uptime Target**: 99% (MVP)
- Automatic retry for failed AI processing (3 attempts)
- Graceful degradation if AI services unavailable
- Data consistency across distributed system
- Transaction rollback on failures
- Idempotent operations where applicable

### 4.4 Security
- HTTPS everywhere
- SQL injection prevention (parameterized queries)
- XSS protection (React default escaping)
- CSRF tokens for state-changing operations
- Rate limiting on API endpoints (100 req/min)
- Secure file access (signed URLs, 1-hour expiry)
- Input validation and sanitization
- Secure password hashing (bcrypt)

### 4.5 Usability
- Mobile-responsive design (breakpoints: 640px, 768px, 1024px)
- Accessible (WCAG 2.1 Level AA)
- Clear error messages with recovery actions
- Loading states for all async operations
- Progressive enhancement
- Intuitive navigation
- Consistent UI patterns

### 4.6 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 5. Database Schema

### 5.1 Core Tables

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE audiobook_status AS ENUM ('draft', 'processing', 'active', 'inactive');
CREATE TYPE job_type AS ENUM ('transcription', 'summary', 'categorization');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users (managed by Supabase Auth)
-- Additional user data
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    display_name TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audiobooks
CREATE TABLE audiobooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    narrator TEXT,
    isbn VARCHAR(13),
    publication_year INTEGER,
    description TEXT,
    ai_summary TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    file_url TEXT NOT NULL,
    cover_image_url TEXT,
    sample_url TEXT,
    status audiobook_status DEFAULT 'processing',
    categories TEXT[] DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcriptions
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
    full_text TEXT,
    word_count INTEGER,
    language VARCHAR(10) DEFAULT 'en',
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing Jobs
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
    job_type job_type NOT NULL,
    status job_status DEFAULT 'pending',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id TEXT, -- For guest users
    audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, audiobook_id),
    UNIQUE(session_id, audiobook_id)
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id),
    email TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status order_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_intent_id TEXT,
    metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    audiobook_id UUID REFERENCES audiobooks(id),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Library (Purchases)
CREATE TABLE user_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0,
    UNIQUE(user_id, audiobook_id)
);

-- API Usage Tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL,
    endpoint VARCHAR(100),
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),
    audiobook_id UUID REFERENCES audiobooks(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Indexes for Performance

```sql
-- Search and filtering
CREATE INDEX idx_audiobooks_status ON audiobooks(status);
CREATE INDEX idx_audiobooks_categories ON audiobooks USING GIN(categories);
CREATE INDEX idx_audiobooks_author ON audiobooks(author);
CREATE INDEX idx_audiobooks_price ON audiobooks(price);
CREATE INDEX idx_audiobooks_created ON audiobooks(created_at DESC);

-- Full-text search
CREATE INDEX idx_audiobooks_search ON audiobooks USING GIN(
    to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(author, '') || ' ' || 
        COALESCE(description, '')
    )
);

-- Job processing
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status, created_at);
CREATE INDEX idx_processing_jobs_audiobook ON processing_jobs(audiobook_id);

-- User queries
CREATE INDEX idx_user_library_user ON user_library(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Cart operations
CREATE INDEX idx_cart_items_user ON cart_items(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cart_items_session ON cart_items(session_id) WHERE session_id IS NOT NULL;
```

### 5.3 Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Audiobooks policies
CREATE POLICY "Anyone can view active audiobooks" ON audiobooks
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage audiobooks" ON audiobooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- User library policies
CREATE POLICY "Users can view own library" ON user_library
    FOR SELECT USING (auth.uid() = user_id);

-- Cart policies
CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id OR session_id = current_setting('app.session_id'));
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Day 1)
**Goal**: Basic setup and authentication

**Tasks**:
1. Initialize Next.js project with TypeScript
   ```bash
   npx create-next-app@latest audiobook-store --typescript --tailwind --app
   ```
2. Setup Supabase project
   - Create new project
   - Configure auth providers
   - Run database migrations
3. Configure Prisma ORM
   - Define schema
   - Generate client
   - Seed initial data
4. Implement authentication flows
   - Register component
   - Login component
   - Password reset flow
   - OAuth integration
5. Create layouts
   - Public layout
   - Admin layout
   - User dashboard layout
6. Setup middleware
   - Auth middleware
   - Role checking
   - Session management
7. Environment configuration
   - Development .env
   - Production variables

**Deliverables**:
- Working auth with email/password
- Google OAuth configured
- Protected routes functioning
- Basic navigation structure
- Database connected

**Success Criteria**:
- User can register and login
- Admin routes are protected
- Sessions persist across refreshes

### Phase 2: Admin Core (Day 2)
**Goal**: Admin can upload and manage audiobooks

**Tasks**:
1. Build admin dashboard
   - Statistics cards
   - Recent activity
   - Quick actions
2. Create upload interface
   - Drag-and-drop zone
   - File validation
   - Progress indicator
3. Implement presigned URLs
   - API endpoint
   - Direct upload to storage
   - Success callback
4. Build audiobook management
   - List view with pagination
   - Edit modal
   - Delete confirmation
5. Create metadata forms
   - Validation rules
   - Error handling
   - Success feedback
6. Setup file handling
   - Format validation
   - Size checking
   - Preview generation

**Deliverables**:
- Admin dashboard functional
- File upload working
- Audiobook CRUD complete
- Storage integration done

**Success Criteria**:
- Can upload 500MB files
- Metadata saves correctly
- Files accessible via URLs

### Phase 3: AI Integration (Day 3)
**Goal**: Automated transcription and content generation

**Tasks**:
1. Setup Inngest
   - Install SDK
   - Configure events
   - Create functions
2. Configure Railway worker
   - Setup repository
   - Deploy worker
   - Environment variables
3. Implement chunking
   - Audio splitting logic
   - Overlap handling
   - Chunk management
4. Integrate Whisper API
   - API client setup
   - Error handling
   - Response parsing
5. Add GPT-4 integration
   - Summary generation
   - Category extraction
   - Prompt engineering
6. Build job monitoring
   - Status dashboard
   - Progress updates
   - Error display
7. Implement retry logic
   - Exponential backoff
   - Max attempts
   - Dead letter queue

**Deliverables**:
- Transcription working
- Summaries generated
- Categories assigned
- Progress tracking live

**Success Criteria**:
- Processes 100MB files
- Handles API failures
- Shows real-time progress

### Phase 4: Customer Experience (Day 4)
**Goal**: Complete shopping experience

**Tasks**:
1. Build catalog page
   - Grid layout
   - Responsive design
   - Loading states
2. Implement search
   - Full-text search
   - Instant results
   - Search highlighting
3. Add filters
   - Category filter
   - Price range
   - Sort options
4. Create product pages
   - Detail display
   - Audio player
   - Add to cart
5. Build cart
   - Zustand store
   - Persistence logic
   - UI components
6. Implement checkout
   - Order summary
   - Payment mock
   - Success page
7. Create user library
   - Purchase list
   - Download links
   - Streaming player

**Deliverables**:
- Browse and search working
- Cart fully functional
- Checkout complete
- Library accessible

**Success Criteria**:
- Search returns results
- Cart persists
- Can complete purchase
- Can download files

### Phase 5: Polish & Error Handling (Day 5)
**Goal**: Production-ready features

**Tasks**:
1. Error boundaries
   - Global handler
   - Component level
   - Fallback UI
2. Loading states
   - Skeletons
   - Spinners
   - Progress bars
3. Optimizations
   - Image optimization
   - Code splitting
   - Bundle analysis
4. Real-time updates
   - SSE implementation
   - Progress events
   - Status changes
5. Notifications
   - Toast messages
   - Email setup (optional)
   - Success feedback
6. UI polish
   - Animations
   - Transitions
   - Hover effects
7. Mobile optimization
   - Touch gestures
   - Responsive tables
   - Mobile navigation

**Deliverables**:
- Smooth UX
- Error recovery
- Performance optimized
- Mobile responsive

**Success Criteria**:
- No unhandled errors
- < 3s page loads
- Works on mobile
- Animations smooth

### Phase 6: Testing & Documentation (Day 6)
**Goal**: Complete testing and deployment

**Tasks**:
1. Unit tests
   - Business logic
   - Utilities
   - Components
2. Integration tests
   - API endpoints
   - Database operations
   - Auth flows
3. E2E tests
   - Purchase flow
   - Admin workflow
   - Search functionality
4. Load testing
   - Concurrent users
   - Large file uploads
   - API stress test
5. Documentation
   - README completion
   - API documentation
   - Setup guide
6. Deployment
   - Vercel setup
   - Railway deployment
   - Environment config
7. Demo preparation
   - Seed data
   - Video recording
   - Test accounts

**Deliverables**:
- Test suite complete
- Documentation ready
- Live deployment
- Demo video recorded

**Success Criteria**:
- 60% test coverage
- All features working
- Deployment stable
- Demo impressive

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// Priority test areas
describe('Business Logic', () => {
  test('calculateOrderTotal')
  test('validateAudioFormat')
  test('chunkAudioFile')
  test('mergeTranscriptions')
  test('generateOrderNumber')
})

describe('Auth Utils', () => {
  test('validatePassword')
  test('checkUserRole')
  test('generateResetToken')
  test('verifySession')
})

describe('AI Processing', () => {
  test('splitIntoChunks')
  test('handleWhisperResponse')
  test('extractCategories')
  test('retryWithBackoff')
})
```

### 7.2 Integration Tests

```typescript
// API endpoints
describe('API Routes', () => {
  test('POST /api/auth/register')
  test('POST /api/auth/login')
  test('POST /api/upload/presigned')
  test('POST /api/cart/add')
  test('POST /api/checkout')
  test('GET /api/audiobooks')
})

// Database operations
describe('Database', () => {
  test('Transaction rollback')
  test('Concurrent cart updates')
  test('RLS policies')
  test('Search performance')
})
```

### 7.3 E2E Tests (Playwright)

```typescript
// Critical user journeys
test('Complete purchase flow', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-testid="browse"]')
  await page.click('[data-testid="add-to-cart"]')
  await page.click('[data-testid="checkout"]')
  await page.fill('[name="email"]', 'test@example.com')
  await page.click('[data-testid="complete-purchase"]')
  await expect(page).toHaveURL('/success')
})

test('Admin upload and process', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin')
  await page.setInputFiles('[data-testid="file-input"]', 'sample.mp3')
  await page.click('[data-testid="upload"]')
  await expect(page.locator('[data-testid="processing"]')).toBeVisible()
})
```

### 7.4 Error Scenario Testing

```typescript
// Must handle gracefully
describe('Error Scenarios', () => {
  test('AI service timeout')
  test('File upload interruption')
  test('Invalid file format')
  test('Concurrent cart updates')
  test('Payment failure')
  test('Storage quota exceeded')
  test('Database connection lost')
})
```

---

## 8. Error Handling Strategy

### 8.1 Error Categories

```typescript
enum ErrorCategory {
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'auth_error',
  AUTHORIZATION = 'permission_error',
  NETWORK = 'network_error',
  PROCESSING = 'processing_error',
  STORAGE = 'storage_error',
  PAYMENT = 'payment_error',
  SYSTEM = 'system_error'
}

interface AppError {
  category: ErrorCategory
  code: string
  message: string
  userMessage: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  retry: boolean
  context?: Record<string, any>
}
```

### 8.2 User-Facing Error Messages

```typescript
const userMessages = {
  FILE_TOO_LARGE: "File exceeds 500MB limit. Please compress or split the file.",
  INVALID_FORMAT: "Please upload an audio file (MP3, M4A, M4B, AAC).",
  NETWORK_ERROR: "Connection issue. Please check your internet and try again.",
  PROCESSING_FAILED: "Processing failed. We'll retry automatically.",
  PAYMENT_FAILED: "Payment couldn't be processed. Please try again.",
  NOT_FOUND: "Content not found. It may have been moved or deleted.",
  PERMISSION_DENIED: "You don't have permission to access this resource.",
  SESSION_EXPIRED: "Your session has expired. Please log in again."
}
```

### 8.3 Error Recovery Strategies

```typescript
class ErrorRecovery {
  strategies = {
    NETWORK_ERROR: {
      action: 'retry',
      maxAttempts: 3,
      backoff: 'exponential'
    },
    FILE_TOO_LARGE: {
      action: 'split',
      suggestion: 'Use audio compression tool'
    },
    API_RATE_LIMIT: {
      action: 'queue',
      delay: 60000
    },
    PROCESSING_FAILED: {
      action: 'retry',
      notification: 'admin',
      fallback: 'manual_review'
    }
  }
}
```

### 8.4 Monitoring and Alerting

```typescript
interface ErrorMonitoring {
  logToSentry(error: AppError): void
  trackMetric(metric: string, value: number): void
  alertAdmin(severity: 'high' | 'critical'): void
  createIncident(error: AppError): string
}

// Implementation
class MonitoringService {
  async handleError(error: AppError) {
    // Log to service
    await this.logToSentry(error)
    
    // Track metrics
    this.trackMetric(`error.${error.category}`, 1)
    
    // Alert if critical
    if (error.severity === 'critical') {
      await this.alertAdmin(error)
    }
    
    // Create incident for follow-up
    if (error.severity >= 'high') {
      const incidentId = await this.createIncident(error)
      return incidentId
    }
  }
}
```

---

## 9. API Design

### 9.1 RESTful Endpoints

```typescript
// Public endpoints
GET    /api/audiobooks          // List audiobooks
GET    /api/audiobooks/:id      // Get single audiobook
GET    /api/audiobooks/search   // Search audiobooks
GET    /api/categories          // List categories

// Auth endpoints
POST   /api/auth/register       // Register user
POST   /api/auth/login          // Login
POST   /api/auth/logout         // Logout
POST   /api/auth/reset-password // Request reset
POST   /api/auth/confirm-reset  // Confirm reset

// User endpoints (authenticated)
GET    /api/user/profile        // Get profile
PUT    /api/user/profile        // Update profile
GET    /api/user/library        // Get purchases
GET    /api/user/orders         // Order history

// Cart endpoints
GET    /api/cart                // Get cart
POST   /api/cart/add            // Add item
DELETE /api/cart/remove/:id     // Remove item
DELETE /api/cart/clear          // Clear cart

// Checkout
POST   /api/checkout            // Process order
GET    /api/checkout/success    // Confirm order

// Admin endpoints
POST   /api/admin/audiobooks    // Create audiobook
PUT    /api/admin/audiobooks/:id // Update audiobook
DELETE /api/admin/audiobooks/:id // Delete audiobook
POST   /api/admin/upload/presigned // Get upload URL
GET    /api/admin/jobs          // List processing jobs
POST   /api/admin/jobs/:id/retry // Retry job
GET    /api/admin/analytics     // Get analytics

// Webhooks
POST   /api/webhooks/inngest    // Inngest events
POST   /api/webhooks/process    // Processing complete
```

### 9.2 Response Format

```typescript
// Success response
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2025-01-20T10:00:00Z",
    "version": "1.0"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Technical error message",
    "userMessage": "User-friendly message",
    "field": "email" // For validation errors
  },
  "meta": {
    "timestamp": "2025-01-20T10:00:00Z",
    "requestId": "uuid"
  }
}

// Paginated response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 10. Performance Optimization

### 10.1 Frontend Optimizations

```typescript
// Image optimization
import Image from 'next/image'

// Dynamic imports
const AudioPlayer = dynamic(() => import('@/components/AudioPlayer'), {
  loading: () => <PlayerSkeleton />,
  ssr: false
})

// React Query for caching
const { data, isLoading } = useQuery({
  queryKey: ['audiobooks', filters],
  queryFn: fetchAudiobooks,
  staleTime: 5 * 60 * 1000, // 5 minutes
})

// Virtual scrolling for large lists
import { VirtualList } from '@tanstack/react-virtual'
```

### 10.2 Backend Optimizations

```typescript
// Database query optimization
const audiobooks = await prisma.audiobook.findMany({
  where: { status: 'active' },
  select: {
    id: true,
    title: true,
    author: true,
    price: true,
    coverImageUrl: true
    // Only select needed fields
  },
  take: 12,
  skip: (page - 1) * 12
})

// Caching strategy
const cacheKey = `audiobook:${id}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const audiobook = await fetchAudiobook(id)
await redis.set(cacheKey, JSON.stringify(audiobook), 'EX', 300)
```

### 10.3 Infrastructure Optimizations

```yaml
# CDN configuration
images:
  domains: ['supabase.co']
  formats: ['image/avif', 'image/webp']

# API rate limiting
rateLimit:
  windowMs: 60000  # 1 minute
  max: 100         # 100 requests per minute

# Database indexes
indexes:
  - audiobooks_search_idx
  - user_library_user_idx
  - processing_jobs_status_idx
```

---

## 11. Security Considerations

### 11.1 Authentication Security

```typescript
// Password hashing
import bcrypt from 'bcryptjs'
const hashedPassword = await bcrypt.hash(password, 12)

// JWT configuration
const token = jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

// Session management
const session = {
  userId,
  role,
  csrfToken: generateCSRFToken(),
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
}
```

### 11.2 Input Validation

```typescript
// Zod schemas
const audioBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  price: z.number().min(0.99).max(999.99),
  categories: z.array(z.string()).max(3)
})

// File validation
const validateAudioFile = (file: File) => {
  const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a']
  const maxSize = 500 * 1024 * 1024 // 500MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large')
  }
}
```

### 11.3 API Security

```typescript
// Rate limiting
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests'
})

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}

// Content Security Policy
const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
}
```

---

## 12. Monitoring and Analytics

### 12.1 Application Monitoring

```typescript
// Performance monitoring
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
})

// Custom metrics
export const metrics = {
  audioUploadTime: new Histogram('audio_upload_duration'),
  processingTime: new Histogram('ai_processing_duration'),
  apiLatency: new Histogram('api_request_duration'),
  errorRate: new Counter('errors_total')
}
```

### 12.2 Business Analytics

```typescript
// Track key events
const analytics = {
  trackPurchase(orderId: string, amount: number) {
    // Implementation
  },
  trackUpload(audioBookId: string, processingTime: number) {
    // Implementation
  },
  trackSearch(query: string, resultsCount: number) {
    // Implementation
  }
}
```

---

## 13. Deployment Configuration

### 13.1 Environment Variables

```bash
# .env.example
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Railway Worker
WORKER_URL=

# Monitoring
SENTRY_DSN=

# Email (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### 13.2 Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 14. Success Metrics

### 14.1 Technical Metrics
- **Uptime**: 99% during demo period
- **Response Time**: < 500ms p95
- **Error Rate**: < 1%
- **Test Coverage**: > 60% for critical paths
- **Build Time**: < 5 minutes
- **Deployment Success**: 100%

### 14.2 Functional Metrics
- **Features Complete**: 100% of MVP scope
- **AI Processing Success**: > 95%
- **User Journey Completion**: End-to-end working
- **Mobile Responsive**: All pages
- **Accessibility**: WCAG 2.1 AA compliant

### 14.3 Business Metrics
- **User Registration**: Working
- **Purchase Flow**: Complete
- **Admin Upload**: Functional
- **Search Accuracy**: > 90%
- **Download Success**: 100%

---

## 15. Risks and Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| OpenAI API downtime | Low | High | Implement fallback queue, manual approval option |
| Large file processing timeout | Medium | Medium | Chunking strategy, progress saving |
| Railway deployment issues | Low | Medium | Backup: Deploy worker to Render.com |
| Database performance issues | Low | High | Indexes, connection pooling, caching |
| Supabase quota exceeded | Low | Medium | Monitor usage, upgrade plan if needed |
| Time overrun | Medium | High | Focus on core features, defer nice-to-haves |
| Complex bugs in AI processing | Medium | Medium | Comprehensive logging, manual override |
| Poor mobile experience | Low | Medium | Mobile-first development, testing on devices |

---

## 16. Post-MVP Roadmap

### 16.1 Immediate Enhancements (Week 2)
- Real payment integration (Stripe)
- Email notifications (SendGrid)
- Advanced search filters
- User reviews and ratings
- Social sharing features

### 16.2 Short-term (Month 1)
- Multi-language support
- Chapter detection and navigation
- Bookmarking and notes
- Recommendation engine
- Author profiles

### 16.3 Medium-term (Quarter 1)
- Subscription model
- Series and collections
- Gifting functionality
- Affiliate program
- Mobile apps (React Native)

### 16.4 Long-term (Year 1)
- Publisher partnerships
- Original content creation
- Community features
- AI voice customization
- Global CDN deployment

---

## Appendix A: Technical Decision Log

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| Database | PostgreSQL, MongoDB, MySQL | PostgreSQL | ACID compliance, full-text search, Supabase integration |
| File Storage | AWS S3, Cloudinary, Supabase | Supabase Storage | Integrated auth, presigned URLs, cost-effective |
| Queue System | BullMQ, SQS, Inngest | Inngest | Event-driven, built-in UI, generous free tier |
| AI Provider | OpenAI, Anthropic, Hugging Face | OpenAI | Single vendor, reliable, industry standard |
| Deployment | AWS, Vercel+Railway, DO | Vercel+Railway | Optimized for Next.js, simple setup |
| Auth Provider | Auth0, Clerk, Supabase | Supabase Auth | Integrated with DB, cost-effective |
| CSS Framework | MUI, Ant Design, Tailwind | Tailwind+shadcn | Rapid development, customizable |

---

## Appendix B: Sample Code Snippets

### B.1 File Upload with Progress

```typescript
// components/AudioUpload.tsx
import { useState } from 'react'
import { useUpload } from '@/hooks/useUpload'

export function AudioUpload() {
  const [progress, setProgress] = useState(0)
  const { upload, isUploading } = useUpload()

  const handleUpload = async (file: File) => {
    const { presignedUrl } = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size 
      })
    }).then(r => r.json())

    await upload(file, presignedUrl, {
      onProgress: (percent) => setProgress(percent)
    })
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-8">
      <input 
        type="file" 
        accept="audio/*"
        onChange={(e) => handleUpload(e.target.files[0])}
        disabled={isUploading}
      />
      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-2">{progress}% uploaded</p>
        </div>
      )}
    </div>
  )
}
```

### B.2 Inngest Event Handler

```typescript
// inngest/functions/process-audiobook.ts
import { inngest } from './client'

export const processAudiobook = inngest.createFunction(
  {
    id: 'process-audiobook',
    retries: 3,
  },
  { event: 'audiobook/uploaded' },
  async ({ event, step }) => {
    const { audioBookId, fileUrl } = event.data

    // Step 1: Download and prepare file
    const audioFile = await step.run('download-audio', async () => {
      return await downloadFromStorage(fileUrl)
    })

    // Step 2: Transcribe with chunking if needed
    const transcription = await step.run('transcribe', async () => {
      if (audioFile.size > 25 * 1024 * 1024) {
        const chunks = await splitAudioFile(audioFile)
        const results = await Promise.all(
          chunks.map(chunk => transcribeWithWhisper(chunk))
        )
        return mergeTranscriptions(results)
      }
      return await transcribeWithWhisper(audioFile)
    })

    // Step 3: Generate AI summary
    const summary = await step.run('generate-summary', async () => {
      return await generateSummaryWithGPT4(transcription.text)
    })

    // Step 4: Extract categories
    const categories = await step.run('extract-categories', async () => {
      return await extractCategories(summary)
    })

    // Step 5: Update database
    await step.run('update-database', async () => {
      await updateAudiobook(audioBookId, {
        transcription: transcription.text,
        summary,
        categories,
        status: 'active'
      })
    })

    return { success: true, audioBookId }
  }
)
```

---

This PRD provides a comprehensive blueprint for building a production-ready audiobook e-commerce platform in 6 days, with clear phases, technical specifications, and best practices throughout.