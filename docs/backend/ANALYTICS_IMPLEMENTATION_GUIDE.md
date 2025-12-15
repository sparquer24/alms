# Analytics API Integration Guide

## Frontend Implementation Complete ✓

The `/admin/analytics` page has been fully upgraded with the following features:

### Features Implemented

1. **Real Dynamic Data Integration**
   - API calls to: `/api/analytics/applications`, `/api/analytics/role-load`, `/api/analytics/states`, `/api/analytics/admin-activities`
   - Configurable via `NEXT_PUBLIC_API_URL` environment variable
   - Error handling with loading and error states

2. **Date Range Filtering**
   - From Date and To Date inputs
   - "Last 30 Days" quick filter button
   - Filters applied to all API calls via query parameters

3. **Loading & Error States**
   - Skeleton loaders for charts during data fetching
   - Error boundaries around each chart
   - Individual error messages per data source
   - Graceful fallbacks with user-friendly messages

4. **ISO Week Aggregation**
   - Weekly aggregation using `date-fns` library
   - ISO week format (YYYY-W##)
   - Proper date handling and display

5. **Interactive Drill-Down**
   - Click any bar in the applications chart to drill down
   - Click any pie slice in the role chart to drill down
   - Click any bar in the status chart to drill down
   - Side panel shows detailed data with timestamp information
   - Export options available from drill-down panel

6. **Export Functionality**
   - CSV export with proper escaping and formatting
   - Excel (XLSX) export using the `xlsx` package
   - Export buttons on each chart card
   - Export available from drill-down panel

7. **Responsive Layout**
   - Grid-based responsive design (1 col mobile → 2 cols tablet → responsive desktop)
   - Card-based UI with consistent styling
   - Summary stats grid with 5 columns on desktop
   - Charts in 2-column grid on desktop, single column on mobile

8. **Dark/Light Theme Support**
   - Automatic theme detection
   - Real-time theme change detection
   - Tailwind dark mode classes throughout
   - Styled charts that adapt to theme

9. **Admin Activity Feed**
   - Timeline-style activity visualization
   - Activity timestamps formatted for readability
   - Visual timeline with colored dots
   - No activities state with helpful message

### Backend API Endpoints Required

Your backend needs to implement these endpoints. The analytics service is configured to call them with optional `fromDate` and `toDate` query parameters.

#### 1. GET `/api/analytics/applications`
Returns applications data aggregated by week.

**Query Parameters:**
- `fromDate` (optional): ISO date string (YYYY-MM-DD)
- `toDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "week": "2025-W01",
      "count": 15,
      "date": "2025-01-06"
    }
  ]
}
```

#### 2. GET `/api/analytics/role-load`
Returns application load by role.

**Query Parameters:**
- `fromDate` (optional): ISO date string (YYYY-MM-DD)
- `toDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "ZS",
      "value": 45
    },
    {
      "name": "DCP",
      "value": 32
    },
    {
      "name": "SHO",
      "value": 28
    }
  ]
}
```

#### 3. GET `/api/analytics/states`
Returns application distribution by status.

**Query Parameters:**
- `fromDate` (optional): ISO date string (YYYY-MM-DD)
- `toDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "state": "pending",
      "count": 42
    },
    {
      "state": "approved",
      "count": 35
    },
    {
      "state": "rejected",
      "count": 28
    }
  ]
}
```

#### 4. GET `/api/analytics/admin-activities`
Returns admin activity feed.

**Query Parameters:**
- `fromDate` (optional): ISO date string (YYYY-MM-DD)
- `toDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user": "admin@example.com",
      "action": "Approved application #123",
      "time": "2025-01-20 10:30:45",
      "timestamp": 1737335445000
    },
    {
      "id": 2,
      "user": "officer@example.com",
      "action": "Forwarded application #122 to review",
      "time": "2025-01-20 09:15:20",
      "timestamp": 1737330920000
    }
  ]
}
```

### Component Files Created

1. **`/frontend/src/services/analyticsService.ts`**
   - Service class for all analytics API calls
   - Export functionality (CSV and Excel)
   - Type definitions for all data structures

2. **`/frontend/src/components/analytics/AnalyticsComponents.tsx`**
   - `ErrorBoundary`: Catches and displays chart errors
   - `LoadingSkeleton`: Animated loading placeholder
   - `ChartCard`: Reusable card wrapper for charts with loading/error states
   - `StatCard`: Summary statistic display card
   - `DrillDownPanel`: Side panel for detailed view and export

3. **`/frontend/src/components/analytics/AdminActivityFeed.tsx`**
   - `AdminActivityFeed`: Timeline-style activity display
   - Animated loading states
   - Empty state message

4. **`/frontend/src/app/admin/analytics/page.tsx`**
   - Main analytics page component
   - State management with React hooks
   - Date range filtering
   - Data fetching with error handling
   - Theme detection and switching
   - Interactive charts with drill-down
   - Export functionality

### Key Features of the Implementation

- **Type Safe**: Full TypeScript types for all API responses
- **Error Handling**: Graceful error handling with user-friendly messages
- **Performance**: Parallel data fetching using Promise.allSettled
- **Responsive**: Mobile-first responsive design
- **Accessible**: Semantic HTML, ARIA labels where needed
- **Animations**: Smooth transitions and chart animations
- **Theme Support**: Full dark/light mode compatibility
- **Extensible**: Easy to add new charts or data sources

### Environment Configuration

Add to your `.env.local` if backend is on different URL:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Default: `http://localhost:3001/api`

### Testing the Integration

1. Run the frontend: `npm run dev`
2. Implement the backend endpoints above
3. Navigate to `/admin/analytics`
4. Date range should auto-populate with last 30 days
5. Click refresh to fetch data
6. Interact with charts (click bars/slices for drill-down)
7. Export data using CSV/Excel buttons
