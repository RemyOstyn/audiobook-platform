# Phase 2: Admin Core Implementation

**Goal**: Admin can upload and manage audiobooks with AI processing pipeline  
**Timeline**: Day 2 (6-8 hours)  
**Status**: 🔄 IN PROGRESS

## Prerequisites

✅ **From Phase 1**:
- Authentication system with role-based access
- Database schema deployed (9 tables)
- Supabase Storage configured
- shadcn/ui components installed
- Middleware for route protection

## Core Features

### 1. Admin Dashboard
- Statistics cards (total audiobooks, processing status, storage usage)
- Recent uploads and processing activity
- System health indicators
- Quick action buttons

### 2. Upload System
- Drag-and-drop interface with progress tracking
- File validation (MP3, M4A, M4B, AAC formats, max 500MB)
- Direct-to-storage uploads using Supabase presigned URLs
- Metadata collection form (title, author, price, cover image)

### 3. Audiobook Management
- Data table with filtering, sorting, and pagination
- CRUD operations (Create, Read, Update, Delete)
- Status management (draft, processing, active, inactive)
- Bulk operations support

## Technical Architecture

### Upload Strategy
- **Direct Upload**: Browser → Supabase Storage (bypasses server)
- **Presigned URLs**: Generated server-side with temporary access
- **File Chunking**: For large files to handle network interruptions
- **Processing Trigger**: File upload completion triggers AI processing job

### Data Flow
1. Admin uploads file → Direct to Supabase Storage
2. File upload completion → Create audiobook record (status: processing)
3. Database trigger → Queue AI processing job (Phase 3)
4. Processing completion → Update audiobook status to active

## Required Dependencies

### New Packages to Install
- `react-dropzone` - File upload UI component
- `@tanstack/react-table` - Advanced data table with sorting/filtering
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-select` - Dropdown selections
- `@radix-ui/react-toast` - Notifications
- `@radix-ui/react-tabs` - Tab navigation
- `@radix-ui/react-progress` - Progress bars

## File Structure

```
app/admin/
├── layout.tsx                    # Admin layout with sidebar
├── page.tsx                      # Dashboard
├── audiobooks/
│   ├── page.tsx                  # List/table view
│   ├── new/page.tsx             # Upload interface
│   └── [id]/edit/page.tsx       # Edit form
└── api/
    ├── stats/route.ts           # Dashboard statistics
    ├── audiobooks/route.ts      # CRUD operations
    └── upload/presigned/route.ts # Upload URL generation

components/admin/
├── layout/
│   ├── admin-nav.tsx            # Navigation sidebar
│   └── admin-header.tsx         # Top header
├── dashboard/
│   ├── stats-cards.tsx          # Statistics display
│   └── recent-activity.tsx      # Activity feed
├── audiobooks/
│   ├── data-table.tsx           # Main table component
│   ├── upload-dropzone.tsx      # File upload UI
│   ├── metadata-form.tsx        # Audiobook details form
│   └── status-badge.tsx         # Status indicator
└── ui/
    ├── progress.tsx             # Progress component
    └── toast.tsx                # Notification component

lib/
├── api/
│   ├── admin.ts                 # Admin API client
│   └── upload.ts                # Upload utilities
├── hooks/
│   ├── use-upload.ts            # Upload state management
│   └── use-admin-data.ts        # Data fetching
└── validators/
    └── audiobook.ts             # Zod validation schemas
```

## Implementation Steps

### Step 1: Install Dependencies
Install required packages and configure components

### Step 2: Admin Layout
- Create admin-specific layout with sidebar navigation
- Implement breadcrumb navigation
- Add role-based access control middleware

### Step 3: Dashboard Implementation
- Build statistics cards with real-time data
- Implement recent activity feed
- Add quick action buttons

### Step 4: Upload Interface
- Create drag-and-drop file upload component
- Implement file validation (format, size)
- Build presigned URL generation API
- Add progress tracking and error handling

### Step 5: Audiobook Management
- Build data table with filtering and sorting
- Create CRUD API endpoints
- Implement metadata forms with Zod validation
- Add status management functionality

### Step 6: Error Handling & UX
- Implement comprehensive error boundaries
- Add loading states and skeleton components
- Create toast notifications for user feedback

## API Endpoints

### Admin Statistics
- `GET /api/admin/stats` - Dashboard metrics

### Audiobook Management
- `GET /api/admin/audiobooks` - List with pagination/filters
- `POST /api/admin/audiobooks` - Create new audiobook
- `PUT /api/admin/audiobooks/[id]` - Update audiobook
- `DELETE /api/admin/audiobooks/[id]` - Delete audiobook

### File Upload
- `POST /api/admin/upload/presigned` - Generate upload URL
- `POST /api/admin/upload/complete` - Confirm upload completion

## Security Considerations

### Access Control
- Middleware checks for admin role on all `/admin` routes
- API endpoints validate admin permissions
- File upload URLs have expiration times

### File Validation
- Server-side format validation
- Size limits enforced (500MB max)
- File type verification using magic numbers

## Testing Checklist

- [ ] Admin role required for dashboard access
- [ ] Non-admin users redirected appropriately
- [ ] File uploads work for supported formats
- [ ] Large file uploads (up to 500MB) succeed
- [ ] Invalid file types rejected with clear errors
- [ ] Data table sorting and filtering functional
- [ ] CRUD operations work correctly
- [ ] Form validation prevents invalid data
- [ ] Error states display helpful messages
- [ ] Loading states show during operations

## Performance Considerations

### File Uploads
- Direct-to-storage to avoid server bottlenecks
- Chunked uploads for large files
- Progress tracking for user feedback

### Data Tables
- Server-side pagination for large datasets
- Debounced search to reduce API calls
- Optimistic updates for better UX

## Success Criteria

✅ **Core Functionality**:
- Admin dashboard displays system statistics
- File upload handles 500MB audiobook files
- Data table shows all audiobooks with CRUD operations
- Metadata forms validate input correctly

✅ **User Experience**:
- Clear error messages for all failure cases
- Loading states for all async operations
- Responsive design works on all screen sizes
- Intuitive navigation between admin sections

✅ **Security**:
- Only admin users can access admin features
- File uploads are validated and secure
- API endpoints check permissions appropriately

## Next Phase Preparation

**Ready for Phase 3 (AI Integration)**:
- Upload completion triggers database events
- Processing job status tracking in place
- File URLs stored for AI processing
- Error handling for failed processing

## Troubleshooting

### Common Issues
- **Upload failures**: Check Supabase Storage permissions and CORS settings
- **Large file timeouts**: Verify timeout settings in middleware and upload client
- **Permission errors**: Ensure role-based middleware is correctly implemented
- **Table performance**: Add pagination and server-side filtering for large datasets