# Complete Trial & Subscription System - Implementation Plan

## Overview
Rebuild the trial and subscription system from scratch with proper Supabase integration and real-time access control.

## Requirements

### Page Access Rules:
1. **Public Pages** (Anyone can access):
   - `/` (Home page)
   - `/pricing`
   - `/contact` (not built yet)
   - `/faqs` (not built yet)
   - `/auth/*` (login, register, etc.)

2. **Dashboard Page** (`/dashboard`):
   - ✅ Logged in users → Can access
   - ❌ Logged out users → Redirect to `/` (home)

3. **AI Pages** (Require active trial/subscription):
   - `/presentation`
   - `/flashcards`
   - `/lesson-generator`
   - `/lesson-planner`
   - `/quiz-generator`
   - `/diagram-generator`
   - `/summary-generator`
   - ✅ Active trial → Can access
   - ✅ Active subscription → Can access
   - ❌ No trial/subscription → Redirect to `/pricing`

### Trial System:
- **On First Login**: Automatically create 2-day free trial
- **Trial Status**: Managed in Supabase `Subscription` table
- **Real-time**: Check subscription status on every request (no caching)

## Implementation Steps

### Phase 1: Database Setup ✅ (Already Done)
- ✅ Subscription table exists in Prisma schema
- ✅ Need to ensure Supabase RLS policies allow service role access

### Phase 2: Create Dashboard Page
- Create `/dashboard` route
- Show all AI tools (similar to homepage but for logged-in users)
- Protect with middleware (logged in only)

### Phase 3: Fix Middleware
- Update middleware to handle:
  - Public routes (no auth needed)
  - Dashboard route (auth required, no subscription needed)
  - AI routes (auth + subscription required)
- Use Supabase service role key for subscription checks

### Phase 4: Trial Initialization
- On user signup/login, check if subscription exists
- If not, create trial automatically
- Set trialStart = now(), trialEnd = now() + 2 days

### Phase 5: Real-time Subscription Check
- Every request to AI pages checks subscription status
- No caching - always query Supabase
- Check both trial period and subscription status

### Phase 6: Testing
- Test active trial → should access AIs
- Test expired trial → should redirect to pricing
- Test dashboard access → logged in vs logged out

