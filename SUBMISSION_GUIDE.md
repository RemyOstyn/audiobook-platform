# Audiobook Platform - Submission Guide

## Repository & Demo
**GitHub:** [https://github.com/[your-username]/audiobook-platform](https://github.com/[your-username]/audiobook-platform)  
**Live Demo:** [https://audiobook-platform.vercel.app/](https://audiobook-platform.vercel.app/)

## Quick Overview
This is my implementation of the Senior Full Stack Engineer case study - a complete audiobook e-commerce platform with AI-powered features, built with Next.js 15 and Supabase.

## Key Deliverables

### ✅ Part 1: Core Features
- **Authentication**: Email/password + Google OAuth with Supabase Auth
- **User Roles**: Admin and regular user separation
- **Admin Panel**: Upload audiobooks with AI-powered transcription and categorization
- **E-commerce**: Browse, cart, and checkout flow (payment mocked)
- **User Library**: Download purchased audiobooks and transcriptions

### ✅ Part 2: Testing & Reliability
- Backend service tests with comprehensive coverage
- Graceful failure handling for AI services and file uploads
- Retry mechanisms and status tracking for processing jobs

## Where to Find Everything

### 📁 Documentation
- **Case Study Requirements**: `/docs/case-study.md`
- **Architecture Overview**: `/docs/architecture.md` - System design and data flow
- **Setup Guide**: `/README.md` - Installation and configuration steps

### 🏗️ Architecture Highlights
- **Tech Stack**: Next.js 15, PostgreSQL, Supabase, OpenAI APIs
- **Background Processing**: Inngest for async AI pipeline
- **File Handling**: Chunked processing for large audiobooks (up to 500MB)
- **Real-time Updates**: Live processing status for admin uploads

### 🧪 Testing
- API endpoint tests in `/app/api/**/__tests__/`
- Service layer tests demonstrating error handling
- Edge case coverage for file uploads and AI failures

## Quick Start
1. Clone the repository
2. Copy `.env.example` to `.env.local` and configure
3. Run `npm install && npm run dev`
4. Visit `http://localhost:3000`


## Key Technical Decisions
- **Supabase**: Chose for integrated auth, storage, and RLS security
- **Inngest**: Reliable background job processing with built-in retries
- **Chunked Processing**: Handles OpenAI's 25MB limit while supporting 500MB files
- **Zustand + Database**: Hybrid cart state for optimal UX and persistence

Feel free to explore the codebase and documentation. I'm happy to discuss any implementation details or technical choices!