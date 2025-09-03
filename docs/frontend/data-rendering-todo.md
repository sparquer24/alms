# Frontend Data Rendering TODO (Inbox / Sent / Closed)

Purpose: Ensure all sidebar statuses (Forwarded, Returned, Red Flagged, Disposed, Sent, Closed/FInal) render live API data consistently (no mock leakage) using the new backend `statusIds` query.

## 1. Route & Structure Cleanup
- [x] Remove legacy mock-based route: `src/app/inbox/[type]/page.tsx` (and stray `page.tsx.new`).
- [x] Keep only `src/app/inbox/[status]/page.tsx` as the single dynamic inbox route.
- [x] Verify no imports or navigations still reference `/inbox/forwarded` via the old param name `type`.

## 2. Status Normalization Utility
- [x] Create `src/utils/statusNormalize.ts` exporting `normalizeRouteStatus(routeSegment: string): string` returning canonical status key used for API (e.g. forwarded→forward, redFlagged→red_flagged, disposed→disposed, closed→closed, sent→sent, freshform→initiated).
- [x] Reuse this in Sidebar, inbox page, Sent, Closed pages.

## 3. Inbox Page Data Fetch
- [x] Enhance `app/inbox/[status]/page.tsx`:
  - [x] On mount & when `status` changes: derive canonical via `normalizeRouteStatus` and call `getApplicationsByStatus(canonical)`.
  - [x] Map API response using `mapAPIApplicationToTableData` before pushing to context.
  - [x] Add local `loading` + `error` states; show spinner or message instead of blank table.
  - [x] If context already has data for that status (optional cache layer), skip refetch unless a force-refresh flag is set.
  - [ ] On unmount (optional) do nothing (keep cache for navigation back).

## 4. Sent Page Migration (`app/sent/page.tsx`)
- [x] Remove mock filtering logic.
- [x] Fetch with `getApplicationsByStatus('sent')` (canonical statusIds=sent) + mapper.
- [x] Replace manual `a.status === 'sent'` check (no longer compatible with nested status object).
- [ ] Add loading & error states consistent with inbox page. (pending error UI polish)

## 5. Closed Page Migration (`app/closed/page.tsx`)
- [x] Remove `mockApplications` + `getApplicationsByStatus` from mock module.
- [x] Decide canonical: use `closed` (if backend defines status code) or alias to `disposed` if `closed` not present; may query both: `getApplicationsByStatuses(['closed','disposed'])`.
- [x] Map results and render.
- [ ] Add loading & error states.

## 6. Shared Application Fetch Helper
- [x] Add `src/services/fetchAndMapApplications.ts` exporting async `fetchMappedApplications(statusOrStatuses: string | string[]): ApplicationData[]`.
- [x] Internally: build `statusIds` (comma-separated), call API, map via mapper.
- [x] Use this helper in inbox, sent, closed pages.

## 7. Sidebar Integration Improvements
- [x] When clicking a status sub-item, navigate first and let page fetch (removed duplicate sidebar fetch).
- [ ] Optional: Implement quick prefetch on hover.
- [ ] Optional: Debounce rapid multi-clicks.

## 8. Context Enhancements (`ApplicationContext`)
- [x] Store applications keyed by status (e.g. `{ forwarded: [...], returned: [...] }`).
- [x] Provide helper: `setApplicationsForStatus(status, items)` and `getApplicationsForStatus(status)`.
- [x] Maintain a simple freshness timestamp per status for potential auto-refresh intervals (stored in `statusFreshness`).

## 9. Mapper & Types Alignment
- [ ] Ensure mapper gracefully handles `status` as object `{ code, name }` and raw string fallback.
- [ ] Add mapping for any missing codes (FORWARD, RETURN, CLOSED vs DISPOSED if both appear).
- [ ] Extend `ApplicationData.status_id` to preserve original code for debugging.

## 10. Table Behavior
- [ ] Confirm `ApplicationTable` no longer depends on legacy fields (e.g. `forwardedTo`) when not provided by API.
- [ ] Add column safe defaults: if `applicationType` absent, show `-`.
- [ ] Verify date formatting uses `createdAt`; fallback to `applicationDate` if needed.

## 11. Error & Empty States
- [x] Standard component `DataState` with props: `{ loading, error, empty, children }`.
- [x] Replace inline “No applications found” with this consistent component in `ApplicationTable`.

## 12. Manual Test Matrix
- [ ] Navigate via Sidebar to: Forwarded → Returned → Red Flagged → Disposed → Sent → Closed; ensure each triggers exactly 1 fetch on first view.
- [ ] Refresh browser on each route; data repopulates.
- [ ] Simulate backend returning empty list; empty state message displays.
- [ ] Turn network offline after one fetch; navigate back to previously loaded status; cached data shows (if caching implemented).

## 13. Optional Performance / Future
- [ ] Add prefetch (Next.js router.prefetch) for inbox statuses on hover.
- [ ] Add batch endpoint on backend to return counts + minimal row list for all statuses.
- [ ] Implement SWR or React Query for automatic background refresh.

## 14. Clean-Up & Removal
- [ ] Delete unused mock utilities (`mockApplications`, old `getApplicationsByStatus` from mock file) once API flow stable.
- [ ] Remove console.debug logs or gate them behind an env flag (e.g. `NEXT_PUBLIC_DEBUG=1`).

## 15. Documentation
- [ ] Add README section: “Status-Based Application Fetching” explaining canonical statuses and mapping.
- [ ] Document error handling + caching strategy.

## 16. (If Needed) Backend Alignment Follow-Up
- [ ] Confirm backend supports all canonical status codes used (`forward`, `returned`, `red_flagged`, `disposed`, `sent`, `closed`, `initiated`).
- [ ] If `closed` not a direct code, update frontend mapping to query underlying code actually used (e.g. `disposed`).

---
Execution Order Suggestion:
1. Remove duplicate route & create helper util (Sections 1–2).
2. Update inbox page with direct fetch (Section 3).
3. Migrate sent & closed pages (Sections 4–5).
4. Add shared fetch helper + context per-status storage (Sections 6 & 8).
5. Sidebar optimization (Section 7).
6. Mapper/type alignment & table polishing (Sections 9–10).
7. Error/empty component + test matrix (Sections 11–12).
8. Cleanup + docs (Sections 13–15).

Keep this checklist updated as tasks complete.
