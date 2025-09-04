# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an audiobook e-commerce platform built with Next.js 15, featuring AI-powered content processing, user authentication, and a complete purchase workflow. The platform includes both customer-facing pages and an admin panel for content management.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed the database with initial data

## Architecture & Tech Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with Row Level Security
- **File Storage**: Supabase Storage for audiobooks and cover images
- **Background Jobs**: Inngest for AI processing pipeline
- **AI Services**: OpenAI (Whisper for transcription, GPT-4 for content generation)
- **State Management**: Zustand for cart state
- **UI**: Tailwind CSS with shadcn/ui components

### Key Architectural Patterns

#### Route Protection
- Uses Supabase middleware for session management (`middleware.ts`)
- Protected routes are in `app/(protected)/` directory
- Admin routes require `admin` role check in database

#### AI Processing Pipeline
- Audiobook uploads trigger Inngest background jobs (`lib/inngest/functions/process-audiobook.ts`)
- Pipeline: Upload → Chunking → Transcription → AI Content Generation → Status Updates
- Jobs are tracked in `processing_jobs` table with real-time status updates

#### Database Schema
- User profiles linked to Supabase auth users
- Audiobooks with comprehensive metadata and AI-generated content
- Cart system supporting both authenticated and guest users
- Order processing with complete purchase history
- User library for purchased content access

#### File Processing
- Large audiobook files (up to 500MB) are chunked for OpenAI Whisper API (25MB limit)
- Presigned URLs for secure file uploads
- Streaming and download endpoints with ownership verification

### Important Implementation Details

#### Authentication Flow
- Supabase handles OAuth and password auth
- User profiles are automatically created via database triggers
- Role-based access control (`admin` vs `user` roles)

#### Cart & Checkout
- Cart state persists in Zustand store and database
- Guest cart items are associated with session IDs
- Ownership protection prevents repurchasing owned content
- Order processing includes inventory management

#### Admin Features
- Complete CRUD operations for audiobooks
- Processing job monitoring and manual retry capabilities  
- User management and statistics dashboard
- File upload with progress tracking

#### Error Handling
- Comprehensive error boundaries in React components
- Database transaction rollbacks on processing failures
- Retry mechanisms for AI service calls
- Graceful degradation when AI services are unavailable

## Directory Structure

- `app/` - Next.js App Router pages and API routes
  - `(protected)/` - Authentication-required pages
  - `api/` - REST API endpoints
- `components/` - Reusable React components
- `lib/` - Utility functions, services, and configurations
  - `supabase/` - Database and auth clients
  - `inngest/` - Background job definitions
  - `ai/` - AI service integrations
  - `audio/` - Audio processing utilities
- `prisma/` - Database schema and migrations
- `docs/` - Project documentation and planning

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` and `DIRECT_URL` for Prisma
- `OPENAI_API_KEY` for AI services
- `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` for background jobs

## Testing & Development

The application uses TypeScript throughout with strict type checking. Database operations are type-safe through Prisma generated types. API routes include comprehensive error handling and validation using Zod schemas.

For local development, ensure Supabase project is configured and environment variables are set. The seed script can populate initial data for testing.