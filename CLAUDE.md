# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT: Code Cleanup and Fixes (July 21, 2025)

### Files Removed (Redundant/Unused):
- ❌ `server/debug-server.cjs` - 1,548 lines of duplicate code
- ❌ `server/production-server.cjs` - 1,592 lines of duplicate code  
- ❌ `server/simple-server.cjs` - Unused test server
- ❌ `server/test-server.cjs/ts` - Unused test servers
- ❌ `lib/database.ts` - 313 lines of unused custom QueryBuilder
- ❌ `src/utils/db/dbService.ts` - Unused database service
- ❌ `gestor-condominios-clean/` - 475MB duplicate project folder
- ❌ `backups/` - Old backup files
- ❌ Various `.sql` files in root directory

### ✅ CORRECT Files to Use:
- **Server**: `server/app.cjs` (119 lines - the main server)
- **Database**: `server/config/database.cjs` + Knex.js
- **Routes**: Modular routes in `server/routes/*.cjs`
- **Repositories**: Pattern in `server/repositories/*.cjs`

### Database Status:
- **27 tables** total
- **With data**: buildings (2), members (9), users (2), convocatorias (3), transactions (4), minutes (3)
- **Sample data added**: tasks (5 records), documents (5 records)
- **Connection**: Uses PostgreSQL via `host.docker.internal:5432`
- **Admin user**: admin@example.com now has correct building_id

### Fixes Applied (July 21, 2025):
1. **Database Connection**: Fixed authentication by updating DATABASE_URL in docker-compose.yml
2. **Actas visibility**: Updated admin user's building_id to match existing minutes data
3. **Tasks API error**: Changed `assigned_to` → `assignee_id` and `users` → `members` table
4. **Documents API error**:
   - Removed all references to non-existent `deleted_at` column
   - Changed `m.full_name` → `m.name` (members table uses 'name' column)
5. **Frontend build errors**: Commented out imports from removed `dbService.ts`
6. **Dark theme**: Set dark theme as default to prevent "black pages" issue

## ✨ NEW: Attendance Sheets System (October 20, 2025)

### Overview
Complete implementation of digital attendance tracking system for assembly meetings with signature capture and quorum calculation.

### Backend Implementation (COMPLETE ✅)

#### Files Created:
1. **`server/repositories/attendanceSheetRepository.cjs`** (319 lines)
   - Extends BaseRepository with attendance-specific methods
   - Methods: `findByBuilding`, `findByConvocatoria`, `findByMinute`, `findByIdWithAttendees`
   - Transactional operations: `createWithAttendees`, `updateWithAttendees`
   - Individual attendee operations: `addAttendee`, `updateAttendee`, `removeAttendee`
   - Analytics: `calculateQuorum`, `getAttendanceStats`

2. **`server/controllers/attendanceSheetController.cjs`** (268 lines)
   - RESTful controller with error handling
   - All CRUD operations for attendance sheets and attendees
   - Automatic recalculation of present/represented counts
   - Quorum calculation endpoint

3. **`server/routes/attendanceSheets.cjs`** (125 lines)
   - Protected routes with authentication middleware
   - Role-based authorization (admin, manager for write operations)
   - Input validation using existing schemas
   - 12 endpoints total

#### Routes Registered in `server/app.cjs`:
- `/api/attendance-sheets` - Main API route
- `/attendance-sheets` - Cloudflare proxy compatible route

### API Endpoints:

```javascript
// GET endpoints
GET  /api/attendance-sheets                              // List all (with filters)
GET  /api/attendance-sheets/:id                          // Get by ID with attendees
GET  /api/attendance-sheets/convocatoria/:convocatoriaId // Get by convocatoria
GET  /api/attendance-sheets/minute/:minuteId             // Get by minute
GET  /api/attendance-sheets/:id/quorum                   // Calculate quorum
GET  /api/attendance-sheets/building/:buildingId/stats   // Attendance statistics

// POST endpoints
POST /api/attendance-sheets                              // Create with attendees
POST /api/attendance-sheets/:id/attendees                // Add single attendee

// PUT endpoints
PUT  /api/attendance-sheets/:id                          // Update sheet
PUT  /api/attendance-sheets/:id/attendees/:attendeeId    // Update attendee

// DELETE endpoints
DELETE /api/attendance-sheets/:id                        // Delete sheet
DELETE /api/attendance-sheets/:id/attendees/:attendeeId  // Remove attendee
```

### Frontend Implementation (COMPLETE ✅)

#### API Client Functions (`src/lib/api.ts`) - 88 lines added:
- `getAttendanceSheets(params)` - List with filters
- `getAttendanceSheetById(id)` - Get single sheet
- `getAttendanceSheetByConvocatoria(convocatoriaId)` - Get by convocatoria
- `getAttendanceSheetByMinute(minuteId)` - Get by minute
- `createAttendanceSheet(data)` - Create new sheet
- `updateAttendanceSheet(id, data)` - Update sheet
- `deleteAttendanceSheet(id)` - Delete sheet
- `addAttendee(sheetId, data)` - Add member to sheet
- `updateAttendee(sheetId, attendeeId, data)` - Update attendance status
- `removeAttendee(sheetId, attendeeId)` - Remove member
- `calculateQuorum(sheetId)` - Get quorum calculation
- `getAttendanceStats(buildingId, fromDate, toDate)` - Statistics

#### Existing UI Components (Already Implemented):
- `src/components/actas/AttendanceSheet.tsx` - Full attendance UI with signatures
- `src/components/workflows/ControlAsistenciaStep.tsx` - Workflow step (needs API integration)
- `src/components/ui/signature-pad.tsx` - Digital signature capture

### Database Schema:

#### attendance_sheets table:
```sql
- id (uuid, PK)
- building_id (uuid, FK → buildings)
- convocatoria_id (uuid, FK → convocatorias, nullable)
- minute_id (uuid, FK → minutes, nullable)
- meeting_date (date)
- total_members (integer)
- present_members (integer)
- represented_members (integer)
- created_at, updated_at (timestamps)
```

#### attendees table:
```sql
- id (uuid, PK)
- attendance_sheet_id (uuid, FK → attendance_sheets)
- member_id (uuid, FK → members)
- member_name (varchar)
- attendance_type (enum: 'present', 'represented', 'absent')
- representative_name (varchar, nullable)
- signature (text, base64 PNG)
- arrival_time (time, nullable)
- created_at, updated_at (timestamps)
```

### Features:
- ✅ Digital signature capture (mouse + touch support for iPad/tablets)
- ✅ Real-time quorum calculation based on permilage
- ✅ Three attendance states: present, represented, absent
- ✅ PDF generation for attendance sheets
- ✅ Print-friendly view
- ✅ Automatic statistics and analytics
- ✅ Full CRUD operations with transactions
- ✅ Legal compliance (Portuguese Civil Code Art. 1431º, 1432º)

### Testing:
```bash
# Test endpoint availability (requires auth token)
curl -X GET http://localhost:3002/api/attendance-sheets \
  -H "Content-Type: application/json"

# Expected: {"success": false, "error": "Token de autenticação não fornecido"}
# This confirms endpoint is registered and auth middleware is working
```

### Next Steps (TODO):
1. ⏳ **Integrate API calls in ControlAsistenciaStep** - Save attendance to database
2. ⏳ **Auto-load attendance sheet** when editing existing acta
3. ⏳ **Implement VerificacionQuorumStep** - Use attendance data for quorum verification
4. ⏳ **Add attendance statistics to Dashboard** - Show attendance trends
5. ⏳ **Implement offline support** - Cache signatures locally if API fails

### Legal Compliance:
- Portuguese Civil Code **Art. 1431º, n.º 3** - Proxy representation rights
- Portuguese Civil Code **Art. 1432º** - Assembly convocation rules
- **Dec-Lei n.º 290-D/99** - Electronic signatures validity
- **Regulamento (UE) n.º 910/2014** - eIDAS regulation

### Architecture Pattern:
```
User Action → ControlAsistenciaStep (UI)
           → api.createAttendanceSheet()
           → attendanceSheetController.createAttendanceSheet()
           → attendanceSheetRepository.createWithAttendees()
           → PostgreSQL (attendance_sheets + attendees tables)
```

## Development Commands

### Running the Application
- `npm run dev:all` - Start both frontend (port 5173) and backend (port 3002) simultaneously
- `npm run dev` - Start frontend only (Vite development server)
- `npm run dev:server` - Start backend only (Express server with database)

### Building and Quality
- `npm run build` - TypeScript compilation + Vite build for production
- `npm run lint` - ESLint with TypeScript rules (must pass with 0 warnings)
- `npm run type-check` - TypeScript type checking without emitting files
- `npm run preview` - Preview production build locally

## Architecture Overview

### Full-Stack Setup
This is a **monorepo** containing both frontend and backend in a single repository:
- **Frontend**: React 18 + TypeScript + Vite (src/ directory)
- **Backend**: Express.js + TypeScript (server/ directory)
- **Database**: PostgreSQL hosted on Neon with SSL required

### Critical Development Notes

#### Server Configuration
- **Primary server**: `server/debug-server.cjs` (CommonJS, port 3002)
- **Alternative**: `server/index.ts` (TypeScript, currently has import issues)
- **Database connection**: Uses Neon PostgreSQL with SSL requirement
- The project uses `"type": "module"` in package.json, so ES modules are default

#### Port Configuration
- **Frontend**: 5173 (Vite dev server)
- **Backend**: 3002 (Express API server)
- **Vite proxy**: Configured to proxy `/api/*` requests to `localhost:3002`

#### Environment Variables
Essential environment variables in `.env`:
- `DATABASE_URL` - Neon PostgreSQL connection string with SSL
- `VITE_API_URL` - API base URL (http://localhost:3002)
- `VITE_APP_URL` - Frontend URL (http://localhost:5173)

### Database Architecture
- **Provider**: Neon PostgreSQL (serverless)
- **Connection**: SSL required, connection pooling enabled
- **Database Access**: 
  - Backend: Direct PostgreSQL queries using `pg` library
  - Frontend: REST API calls through axios client

### Frontend Architecture

#### State Management
- **Global State**: Zustand store (`src/store/useStore.ts`)
- **Server State**: TanStack Query for API data fetching and caching
- **Form State**: React Hook Form with Zod validation

#### UI System
- **Design System**: Radix UI primitives + custom Tailwind CSS components
- **Theme**: Dark/light mode support via `next-themes`
- **Animations**: Framer Motion for transitions
- **Icons**: Lucide React icon library

#### Key Frontend Patterns
- Components organized by feature (buildings/, members/, finance/, etc.)
- Shared UI components in `src/components/ui/`
- API layer centralized in `src/lib/api.ts`
- Business logic in service files under `src/utils/db/`

### Backend Architecture

#### API Structure
- RESTful API with Express.js
- Routes organized by feature in `server/routes/`
- Database queries use direct PostgreSQL with parameterized queries
- CORS enabled for frontend communication

#### Database Schema
Key entities include:
- `buildings` - Condominium properties
- `members` - Residents/owners
- `convocatorias` - Meeting notices
- `minutes` - Meeting minutes
- `tasks` - Task management
- `transactions` - Financial records

## Development Workflow

### Starting Development
1. Ensure `.env` file is configured with Neon database credentials
2. Run `npm install` for dependencies
3. Use `npm run dev:all` to start both servers
4. Frontend available at http://localhost:5173
5. Backend API at http://localhost:3002/api

### Database Connections
- Backend connects directly to Neon PostgreSQL
- Frontend makes HTTP requests to backend API
- All database operations must use parameterized queries for security

### Code Quality
- TypeScript strict mode enabled
- ESLint configured for React and TypeScript
- All API responses should use consistent `{ success: boolean, data?: any, error?: string }` format

### Import Considerations
- Project uses ES modules (`"type": "module"`)
- Backend server files may need `.cjs` extension for CommonJS compatibility
- Frontend uses path aliases (`@/` maps to `src/`)

## Project Closure Information

**Closed:** 2025-06-26 02:03:07
**Version:** v0.0.1
**Status:** ✅ Closed via Universal Script

### Closure Summary:
- Project successfully closed via automated script
- Git repository initialized with existing GitHub remote - GitHub connection established
- All changes committed and tagged
- ⚠️ Push failed: Error de autenticación o conectividad - GitHub repository not configured

### Repository Status:
- ✅ **GitHub**: [https://github.com/vmsebas/gestor-condominos-easypanel-v2](https://github.com/vmsebas/gestor-condominos-easypanel-v2)
 - ✅ **Version**: v0.0.1 available on GitHub
 - ✅ **Tags**: All tags pushed successfully
- ⚠️ **GitHub**: Not configured yet
- 📋 **Setup GitHub**:
  1. Create repository: https://github.com/new
  2. Add remote: `git remote add origin https://github.com/username/gestor-condominos-easypanel-v2.git`
  3. Push: `git push -u origin main --tags`

### Project Details:
- **Type**: Node.js
- **Technology**: JavaScript/Node.js
- **Git Status**: InitializedExisting
- **Changes**: CommittedNone

### Development Notes:
- Last closure: 2025-06-26 02:03:07
- Automated via universal closure script
- Version management: Semantic versioning (major.minor.patch)
- All project files properly versioned and documented




## Project Closure Information

**Closed:** 2025-06-26 02:36:30
**Version:** v0.0.2
**Status:** ✅ Closed via Universal Script

### Closure Summary:
- Project successfully closed via automated script
- Git repository initialized with existing GitHub remote - GitHub connection established
- All changes committed and tagged
- ⚠️ Push failed: Error de autenticación o conectividad - GitHub repository not configured

### Repository Status:
- ✅ **GitHub**: [https://github.com/vmsebas/gestor-condominos-easypanel-v2](https://github.com/vmsebas/gestor-condominos-easypanel-v2)
 - ✅ **Version**: v0.0.2 available on GitHub
 - ✅ **Tags**: All tags pushed successfully
- ⚠️ **GitHub**: Not configured yet
- 📋 **Setup GitHub**:
  1. Create repository: https://github.com/new
  2. Add remote: `git remote add origin https://github.com/username/gestor-condominos-easypanel-v2.git`
  3. Push: `git push -u origin main --tags`

### Project Details:
- **Type**: Node.js
- **Technology**: JavaScript/Node.js
- **Git Status**: InitializedExisting
- **Changes**: CommittedNone

### Development Notes:
- Last closure: 2025-06-26 02:36:30
- Automated via universal closure script
- Version management: Semantic versioning (major.minor.patch)
- All project files properly versioned and documented




## Project Closure Information

**Closed:** 2025-06-26 12:21:23
**Version:** v0.0.3
**Status:** ✅ Closed via Universal Script

### Closure Summary:
- Project successfully closed via automated script
- Git repository initialized with existing GitHub remote - GitHub connection established
- All changes committed and tagged
- ⚠️ Push failed: Error de autenticación o conectividad - GitHub repository not configured

### Repository Status:
- ✅ **GitHub**: [https://github.com/vmsebas/gestor-condominos-easypanel-v2](https://github.com/vmsebas/gestor-condominos-easypanel-v2)
 - ✅ **Version**: v0.0.3 available on GitHub
 - ✅ **Tags**: All tags pushed successfully
- ⚠️ **GitHub**: Not configured yet
- 📋 **Setup GitHub**:
  1. Create repository: https://github.com/new
  2. Add remote: `git remote add origin https://github.com/username/gestor-condominos-easypanel-v2.git`
  3. Push: `git push -u origin main --tags`

### Project Details:
- **Type**: Node.js
- **Technology**: JavaScript/Node.js
- **Git Status**: InitializedExisting
- **Changes**: CommittedNone

### Development Notes:
- Last closure: 2025-06-26 12:21:23
- Automated via universal closure script
- Version management: Semantic versioning (major.minor.patch)
- All project files properly versioned and documented




## Project Closure Information

**Closed:** 2025-06-26 12:42:31
**Version:** v0.0.4
**Status:** ✅ Closed via Universal Script

### Closure Summary:
- Project successfully closed via automated script
- Git repository initialized with existing GitHub remote - GitHub connection established
- All changes committed and tagged
- ⚠️ Push failed: Error de autenticación o conectividad - GitHub repository not configured

### Repository Status:
- ✅ **GitHub**: [https://github.com/vmsebas/gestor-condominos-easypanel-v2](https://github.com/vmsebas/gestor-condominos-easypanel-v2)
 - ✅ **Version**: v0.0.4 available on GitHub
 - ✅ **Tags**: All tags pushed successfully
- ⚠️ **GitHub**: Not configured yet
- 📋 **Setup GitHub**:
  1. Create repository: https://github.com/new
  2. Add remote: `git remote add origin https://github.com/username/gestor-condominos-easypanel-v2.git`
  3. Push: `git push -u origin main --tags`

### Project Details:
- **Type**: Node.js
- **Technology**: JavaScript/Node.js
- **Git Status**: InitializedExisting
- **Changes**: CommittedNone

### Development Notes:
- Last closure: 2025-06-26 12:42:31
- Automated via universal closure script
- Version management: Semantic versioning (major.minor.patch)
- All project files properly versioned and documented




## Project Closure Information

**Closed:** 2025-10-19 03:23:24
**Version:** v0.0.5
**Status:** ✅ Closed via Universal Script

### Closure Summary:
- Project successfully closed via automated script
- Git repository initialized with existing GitHub remote - GitHub connection established
- All changes committed and tagged
- ⚠️ Push failed: Error de autenticación o conectividad - GitHub repository not configured

### Repository Status:
- ✅ **GitHub**: [https://github.com/vmsebas/gestor-condominos-easypanel-v2](https://github.com/vmsebas/gestor-condominos-easypanel-v2)
 - ✅ **Version**: v0.0.5 available on GitHub
 - ✅ **Tags**: All tags pushed successfully
- ⚠️ **GitHub**: Not configured yet
- 📋 **Setup GitHub**:
  1. Create repository: https://github.com/new
  2. Add remote: `git remote add origin https://github.com/username/gestor-condominos.git`
  3. Push: `git push -u origin main --tags`

### Project Details:
- **Type**: Node.js
- **Technology**: JavaScript/Node.js
- **Git Status**: InitializedExisting
- **Changes**: CommittedNone

### Development Notes:
- Last closure: 2025-10-19 03:23:24
- Automated via universal closure script
- Version management: Semantic versioning (major.minor.patch)
- All project files properly versioned and documented


