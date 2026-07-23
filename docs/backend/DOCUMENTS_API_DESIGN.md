# Documents API — Design Document

> **Status:** Draft  
> **Version:** 1.0  
> **Date:** 2026-07-17  
> **Authors:** Architectural Review Board

---

## 1. Overview

### 1.1 Purpose

Provide a unified, read-only API endpoint that returns all uploaded documents (files) associated with an application across the three application types: **Fresh**, **Renewal License**, and **Cancellation Request**. Today the frontend has to query separate endpoints for each application type and then pluck `fileUploads` from each response. A single endpoint simplifies frontend integration, audit, and document viewing.

### 1.2 Goal

```
GET /api/documents?id={applicationId}&type={Fresh|Renewal|Cancellation}
```

- **id** – The application ID (integer) in the corresponding table.
- **type** – One of `Fresh`, `Renewal`, or `Cancellation`.
- Returns a paginated or flat list of document metadata sorted by `uploadedAt` descending.
- **No database schema changes** – reuse existing `FLAFFileUploads`, `RenewalFileUploads` tables.
- For `Cancellation` type, file uploads are not currently stored in the DB; return an empty array (or an optional `attachments` field from `CancelWorkflowHistories` if available).

### 1.3 Non-Goals

- **File upload** – This endpoint is read-only. Upload endpoints already exist.
- **File download / streaming** – The endpoint returns metadata (URLs) only.
- **Schema changes** – No new tables or columns.
- **Authentication for public access** – This endpoint requires the same JWT auth as all other protected routes.

---

## 2. Existing Code Analysis

### 2.1 Database Schema (Prisma)

**File upload models** (no changes required):

**`FLAFFileUploads`** (for Fresh applications):

```prisma
model FLAFFileUploads {
  id            Int                                    @id @default(autoincrement())
  applicationId Int
  fileType      FileType
  fileUrl       String
  uploadedAt    DateTime                               @default(now())
  fileName      String
  fileSize      Int
  application   FreshLicenseApplicationPersonalDetails @relation("FileUploads", fields: [applicationId], references: [id], onDelete: Cascade)
}
```

**`RenewalFileUploads`** (for Renewal License applications):

```prisma
model RenewalFileUploads {
  id            Int                        @id @default(autoincrement())
  applicationId Int
  fileType      FileType
  fileUrl       String
  uploadedAt    DateTime                   @default(now())
  fileName      String
  fileSize      Int
  application   RenewalFormPersonalDetails @relation("RenewalFileUploads", fields: [applicationId], references: [id], onDelete: Cascade)
}
```

**`CancelFormRequests`** – No dedicated file upload table. Workflow history rows have an optional `attachments` JSON field.

**`FileType` enum:**

```
AADHAR_CARD, PAN_CARD, TRAINING_CERTIFICATE, OTHER_STATE_LICENSE,
EXISTING_LICENSE, SAFE_CUSTODY, MEDICAL_REPORT, REJECTED_LICENSE,
CLAIM_DOCS, OTHER, SIGNATURE_THUMB, PHOTOGRAPH, IRIS_SCAN
```

### 2.2 Existing API Endpoints (Backend)

| Method   | Endpoint                                       | Module       | Description                                           |
| -------- | ---------------------------------------------- | ------------ | ----------------------------------------------------- |
| `POST`   | `/application-form/:applicationId/upload-file` | FreshLicense | Store file URL for fresh application                  |
| `DELETE` | `/application-form/file/:id`                   | FreshLicense | Delete file from fresh application                    |
| `POST`   | `/renewal-forms/:applicationId/upload-file`    | Renewal      | Store file URL for renewal application                |
| `DELETE` | `/renewal-forms/file/:fileId`                  | Renewal      | Delete file from renewal application                  |
| `GET`    | `/application-form/`                           | FreshLicense | Get applications (returns fileUploads included)       |
| `GET`    | `/renewal-forms/:applicationId`                | Renewal      | Get renewal by ID (includes fileUploads)              |
| `GET`    | `/licenses/:id`                                | Licenses     | Get license details (includes source app fileUploads) |

**Key observation:** There is currently **no dedicated "get documents for an application" endpoint**. Files are returned embedded in full application detail responses. A dedicated documents endpoint would be a lightweight query against only the file upload tables.

### 2.3 Frontend Document Consumption

The frontend currently accesses documents through:

- `application.fileUploads` array (fresh applications)
- `application.renewalFileUploads` / `application.fileUploads` (renewal applications)
- `application.documents` field (general fallback)

The frontend's `fileHandler.ts` service (`getDocumentUploadMeta`, `resolveFileHref`, `openDocumentFile`) normalizes file metadata objects regardless of source.

### 2.4 Existing Architecture Pattern

All NestJS modules follow:

```
Controller → Service → Prisma (direct via prismaClient or PrismaService)
```

The existing services use:

- `prisma` (direct import from `../../db/prismaClient`) — FreshLicense and Renewal modules
- `PrismaService` (injected) — Licenses module

Response format follows:

```json
{
  "success": true,
  "message": "…",
  "data": { … }
}
```

---

## 3. API Specification

### `GET /api/documents`

#### 3.1 Request

| Parameter | Type     | Required | Location | Description                                             |
| --------- | -------- | -------- | -------- | ------------------------------------------------------- |
| `id`      | `number` | **Yes**  | Query    | Application ID in the corresponding table               |
| `type`    | `string` | **Yes**  | Query    | Application type: `Fresh`, `Renewal`, or `Cancellation` |

**Example request:**

```
GET /api/documents?id=123&type=Fresh
GET /api/documents?id=456&type=Renewal
GET /api/documents?id=789&type=Cancellation
```

#### 3.2 Success Response (HTTP 200)

```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": [
    {
      "id": 1,
      "applicationId": 123,
      "applicationType": "Fresh",
      "fileType": "AADHAR_CARD",
      "fileName": "aadhar_card.pdf",
      "fileUrl": "https://example.com/uploads/aadhar_card.pdf",
      "fileSize": 2048576,
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "applicationId": 123,
      "applicationType": "Fresh",
      "fileType": "PHOTOGRAPH",
      "fileName": "photo.jpg",
      "fileUrl": "https://example.com/uploads/photo.jpg",
      "fileSize": 512000,
      "uploadedAt": "2024-01-15T10:31:00.000Z"
    }
  ]
}
```

#### 3.3 Error Responses

**400 Bad Request – Missing/invalid parameters:**

```json
{
  "success": false,
  "error": "Application ID is required"
}
```

```json
{
  "success": false,
  "error": "Invalid application type. Must be one of: Fresh, Renewal, Cancellation"
}
```

```json
{
  "success": false,
  "error": "Invalid application ID format"
}
```

**404 Not Found – Application does not exist:**

```json
{
  "success": false,
  "error": "Application with ID 999 not found in Fresh applications"
}
```

**401 Unauthorized – Missing/invalid token:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 4. Validation Rules

| Rule                  | Logic                                                                                                                                                                                  | Error Message                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id` presence         | Must be provided and parseable as a positive integer                                                                                                                                   | `"Application ID is required"`                                             |
| `id` format           | Must not be NaN, must be > 0                                                                                                                                                           | `"Invalid application ID format"`                                          |
| `type` presence       | Must be provided                                                                                                                                                                       | `"Application type is required"`                                           |
| `type` value          | Must be one of `Fresh`, `Renewal`, `Cancellation` (case-insensitive)                                                                                                                   | `"Invalid application type. Must be one of: Fresh, Renewal, Cancellation"` |
| Application existence | For `Fresh` – lookup `freshLicenseApplicationPersonalDetails` by id; for `Renewal` – lookup `renewalFormPersonalDetails` by id; for `Cancellation` – lookup `cancelFormRequests` by id | `"Application with ID {id} not found in {type} applications"`              |

---

## 5. Business Logic

1. **Parse & validate request** – Extract `id` and `type` from query parameters. Normalize `type` to title case.
2. **Validate application exists** – Query the appropriate table to confirm the application record exists. This prevents returning orphaned document records.
3. **Fetch documents** – Based on `type`:
   - **`Fresh`**: Query `FLAFFileUploads` where `applicationId = id`, ordered by `uploadedAt DESC`
   - **`Renewal`**: Query `RenewalFileUploads` where `applicationId = id`, ordered by `uploadedAt DESC`
   - **`Cancellation`**: Return empty array (no dedicated file upload table exists). Optionally check `cancelWorkflowHistories[].attachments` JSON field for any attachment metadata.
4. **Transform & return** – Map each file record to a normalized response shape that includes the `applicationType` field for disambiguation.

**Key design decisions:**

- Cancellation returns empty array because there is no dedicated file upload model for cancel requests.
- The `applicationType` field in the response helps consumers know which table the document came from.
- Results are ordered newest-first (`uploadedAt DESC`) for consumer convenience.

---

## 6. Database Flow

No schema changes. The endpoint queries existing tables:

```
Fresh type:
  prisma.fLAFFileUploads.findMany({
    where: { applicationId },
    orderBy: { uploadedAt: 'desc' }
  })

Renewal type:
  prisma.renewalFileUploads.findMany({
    where: { applicationId },
    orderBy: { uploadedAt: 'desc' }
  })

Cancellation type:
  []  (empty — no file upload table)
```

**Performance:** Each query uses the existing index on `applicationId` (implicit via the foreign key relation). Expected result size is small (< 20 rows per application).

---

## 7. Implementation Plan

### 7.1 Module Structure

Create a new module following the existing NestJS pattern:

```
backend/src/modules/documents/
├── documents.module.ts
├── documents.controller.ts
├── documents.service.ts
└── dto/
    └── get-documents.dto.ts
```

### 7.2 Step-by-Step

| Step | File                       | Action                                                                                                                |
| ---- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1    | `dto/get-documents.dto.ts` | Create DTO with `id` (number) and `type` (enum: Fresh\|Renewal\|Cancellation) fields, with class-validator decorators |
| 2    | `documents.service.ts`     | Create `DocumentsService` with a `getDocuments(id, type)` method                                                      |
| 3    | `documents.controller.ts`  | Create `DocumentsController` with `@Get()` handler, `@UseGuards(AuthGuard)`, query params validation                  |
| 4    | `documents.module.ts`      | Create module, register controller + service                                                                          |
| 5    | `app.module.ts`            | Import `DocumentsModule`                                                                                              |

### 7.3 Controller

```typescript
@ApiTags("Documents")
@Controller("documents")
@UseGuards(AuthGuard)
@ApiBearerAuth("JWT-auth")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: "Get documents for an application by type" })
  async getDocuments(@Query("id") id: string, @Query("type") type: string) {
    // Validate, parse, delegate to service, return response
  }
}
```

### 7.4 Service (`getDocuments` method)

```typescript
async getDocuments(applicationId: number, type: ApplicationType): Promise<DocumentResponse[]> {
  // 1. Validate application exists
  // 2. Fetch file uploads from the correct table
  // 3. Map to normalized response shape
  // 4. Return
}
```

### 7.5 Response Type

```typescript
interface DocumentResponse {
  id: number;
  applicationId: number;
  applicationType: "Fresh" | "Renewal" | "Cancellation";
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
}
```

---

## 8. Response Format

### 8.1 Success (HTTP 200)

```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": [ … ]
}
```

### 8.2 Application Not Found (HTTP 404)

```json
{
  "success": false,
  "error": "Application with ID 999 not found in Fresh applications"
}
```

### 8.3 Validation Error (HTTP 400)

```json
{
  "success": false,
  "error": "Invalid application type. Must be one of: Fresh, Renewal, Cancellation"
}
```

### 8.4 Empty Result (HTTP 200)

```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": []
}
```

---

## 9. Edge Cases

| Edge Case                                         | Expected Behavior                                            |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Application has no uploaded files                 | Return `{ success: true, data: [] }`                         |
| Application ID does not exist                     | Return 404 with descriptive error                            |
| Cancellation type                                 | Return empty `data` array (no file upload model)             |
| Invalid `type` value                              | Return 400 with validation error                             |
| `id` is not a number (e.g., string "abc")         | Return 400 with format error                                 |
| `id` is negative or zero                          | Return 400 with format error                                 |
| Missing both parameters                           | Return 400 with missing parameter error                      |
| Cancellation with attachments in workflow history | Currently returns empty (could be extended later)            |
| Database connection error                         | Let global exception filter handle; return 500               |
| Extremely large number of files per application   | No pagination needed (typically < 50 files); ordered by date |

---

## 10. Implementation Checklist

- [ ] **Create DTO** (`get-documents.dto.ts`) with class-validator and Swagger decorators
- [ ] **Create service** (`documents.service.ts`) with `getDocuments()` method
  - [ ] Application existence validation for Fresh type
  - [ ] Application existence validation for Renewal type
  - [ ] Application existence validation for Cancellation type
  - [ ] Document fetching from `FLAFFileUploads`
  - [ ] Document fetching from `RenewalFileUploads`
  - [ ] Normalized response mapping
- [ ] **Create controller** (`documents.controller.ts`)
  - [ ] `@Get()` handler with query params
  - [ ] Input validation/parsing
  - [ ] Swagger decorators
- [ ] **Create module** (`documents.module.ts`)
  - [ ] Register controller + service
- [ ] **Register in app module** (`app.module.ts`)
  - [ ] Import `DocumentsModule`
- [ ] **Verify compilation** (TypeScript checks pass)
- [ ] **Verify no duplicate code** – reuse existing patterns, no schema changes

---

## 11. Future Considerations (Out of Scope)

- **Cancellation attachments** – If future requirements add file uploads for cancellation requests, a new model would be needed or the existing `attachments` JSON field on `CancelWorkflowHistories` could be normalized.
- **Pagination** – If applications can have hundreds of documents, pagination via `page`/`limit` params could be added.
- **File download proxy** – A `/documents/:id/download` endpoint could stream file content with auth validation.
- **Multi-application batch** – Support `?ids=1,2,3&type=Fresh` to get documents for multiple applications in one call.
