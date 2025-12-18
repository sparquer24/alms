# File Upload Implementation Plan

## Overview
This document outlines the implementation plan for replacing Base64 file storage with a proper file upload system in the ALMS (Arms License Management System) application.

## Current State
- Files (documents, biometric data) are currently stored as Base64 strings in the database
- This approach causes database bloat and performance issues
- Large payloads make API calls slow and unreliable

## Target Architecture
- Files stored on server filesystem in organized directory structure
- Database stores only file paths/references
- Dedicated file upload endpoints with proper validation
- Progressive file uploads during form completion

## Implementation Tasks

### Task 1: Backend API Development

#### 1.1 Create Dedicated File Upload Endpoint
- **Endpoint**: `POST /api/upload/document`
- **Content-Type**: `multipart/form-data`
- **Features**:
  - Accept multiple file types (images, PDFs, documents)
  - Generate unique filenames using UUID
  - Organize files by user ID: `/uploads/user-{id}/`
  - Return file path in response

#### 1.2 File Processing Logic
```typescript
// Expected response format
{
  success: true,
  data: {
    filePath: "uploads/user-123/documents/aadhaar_card_uuid-123.jpg",
    fileName: "aadhaar_card.jpg",
    fileSize: 2048576,
    fileType: "image/jpeg"
  }
}
```

#### 1.3 Database Schema Updates
**Current Schema (Problematic)**:
```sql
biometric_data TEXT, -- Stores Base64
documents TEXT       -- Stores Base64
```

**New Schema (Optimized)**:
```sql
biometric_data_path VARCHAR(500), -- Stores file path
documents_path VARCHAR(500)       -- Stores file path
```

### Task 2: Frontend Logic (Multi-Step Form)

#### 2.1 File Input Modifications
- Keep `File` objects in memory instead of converting to Base64
- Update `handleDocumentUpload` function
- Modify `documentFiles` state management

#### 2.2 Progressive Upload Implementation
```typescript
// Upload during step transitions
const handleNextStep = async () => {
  if (isDocumentStep || isBiometricStep) {
    await uploadCurrentStepFiles();
  }
  setFormStep(formStep + 1);
};
```

#### 2.3 File State Management
```typescript
interface FileUploadState {
  file: File;
  uploading: boolean;
  uploaded: boolean;
  filePath?: string;
  error?: string;
  progress?: number;
}
```

### Task 3: File Retrieval & Management

#### 3.1 Document Viewing Endpoint
- **Endpoint**: `GET /api/documents/view/:filePath`
- **Security**: Validate user access to requested files
- **Features**:
  - Serve files with proper MIME types
  - Handle different file formats
  - Implement caching headers

#### 3.2 File Management Features
- Delete uploaded files when applications are removed
- Replace documents during form editing
- Cleanup orphaned files

## Directory Structure

### Backend Structure
```
backend/src/modules/
├── FileUpload/
│   ├── file-upload.controller.ts
│   ├── file-upload.service.ts
│   ├── dto/
│   │   ├── upload-file.dto.ts
│   │   └── file-response.dto.ts
│   └── file-upload.module.ts
├── FreshLicenseApplicationForm/
│   ├── application-form.controller.ts (UPDATE)
│   └── application-form.service.ts (UPDATE)
```

### Frontend Structure
```
frontend/src/
├── hooks/
│   └── useFileUpload.ts (NEW)
├── services/
│   └── fileUploadService.ts (NEW)
├── components/
│   ├── FreshApplicationForm.tsx (UPDATE)
│   └── FilePreview.tsx (NEW)
```

### File Storage Structure
```
uploads/
├── user-123/
│   ├── documents/
│   │   ├── aadhaar_card_uuid-abc.jpg
│   │   ├── pan_card_uuid-def.pdf
│   │   └── passport_uuid-ghi.jpg
│   └── biometric/
│       ├── fingerprint_uuid-jkl.png
│       └── photo_uuid-mno.jpg
```

## Security Considerations

### File Validation
- **File Types**: Whitelist allowed extensions (.jpg, .jpeg, .png, .pdf, .doc, .docx)
- **File Size**: Maximum 10MB per file
- **Content Validation**: Check file headers to prevent malicious uploads
- **Virus Scanning**: Implement if required by security policy

### Access Control
- Users can only access their own files
- Validate file paths to prevent directory traversal attacks
- Implement proper authentication for file retrieval

### Storage Security
- Files stored outside web root
- Proper file permissions (read-only for web server)
- Regular cleanup of orphaned files

## API Endpoints

### File Upload Endpoints
```typescript
// Upload single document
POST /api/upload/document
Content-Type: multipart/form-data
Body: { file: File, documentType: string }

// Upload multiple documents
POST /api/upload/documents
Content-Type: multipart/form-data
Body: { files: File[], documentTypes: string[] }

// Upload biometric data
POST /api/upload/biometric
Content-Type: multipart/form-data
Body: { file: File, biometricType: string }
```

### File Retrieval Endpoints
```typescript
// View document
GET /api/documents/view/:filePath
Headers: Authorization: Bearer <token>

// Download document
GET /api/documents/download/:filePath
Headers: Authorization: Bearer <token>

// Delete document
DELETE /api/documents/:filePath
Headers: Authorization: Bearer <token>
```

### Application Endpoints (Updated)
```typescript
// Create application (now with file paths)
POST /api/application-form
Body: {
  // ... other form fields
  biometricDataPath: "uploads/user-123/biometric/photo_uuid.jpg",
  documentsPath: "uploads/user-123/documents/aadhaar_uuid.jpg"
}
```

## Implementation Phases

### Phase 1: Backend Infrastructure (Week 1)
1. Create file upload module
2. Implement file storage service
3. Update database schema
4. Create migration scripts

### Phase 2: Frontend File Handling (Week 2)
1. Create file upload hook
2. Update form components
3. Implement progressive upload
4. Add upload progress UI

### Phase 3: Integration & Testing (Week 3)
1. Integration testing
2. Performance optimization
3. Security validation
4. Error handling refinement

### Phase 4: Deployment & Migration (Week 4)
1. Production deployment
2. Data migration from Base64 to files
3. Monitoring and optimization
4. Documentation updates

## Configuration

### Environment Variables
```env
# File upload settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
CLEANUP_ORPHANED_FILES_DAYS=7

# Security settings
ENABLE_VIRUS_SCAN=false
FILE_ACCESS_TOKEN_EXPIRY=3600  # 1 hour
```

### Deployment Considerations
- Ensure upload directory has proper permissions
- Configure web server to serve static files
- Set up file backup strategy
- Monitor disk space usage
- Implement log rotation for file operations

## Testing Strategy

### Unit Tests
- File upload service tests
- File validation tests
- Path generation tests
- Error handling tests

### Integration Tests
- End-to-end file upload flow
- Form submission with files
- File retrieval and display
- Error scenarios

### Performance Tests
- Large file upload performance
- Concurrent upload handling
- Database query performance
- File serving performance

## Migration Strategy

### Data Migration
1. **Assessment**: Analyze existing Base64 data
2. **Conversion**: Convert Base64 to files (if needed)
3. **Validation**: Verify file integrity
4. **Cleanup**: Remove Base64 data after successful migration

### Rollback Plan
1. Keep Base64 data until migration is confirmed successful
2. Implement feature flags for gradual rollout
3. Monitor system performance and error rates
4. Prepare rollback scripts if needed

## Monitoring and Maintenance

### Metrics to Monitor
- File upload success/failure rates
- Upload performance (time and throughput)
- Storage usage and growth
- Error rates and types

### Maintenance Tasks
- Regular cleanup of orphaned files
- Monitor and rotate logs
- Update security policies
- Performance optimization

## Success Criteria

### Performance Improvements
- Reduce database size by 60-80%
- Improve API response times by 70%
- Reduce memory usage during form submission

### User Experience
- Faster form loading and submission
- Progressive upload with visual feedback
- Better error handling and recovery

### System Reliability
- Reduced database load
- Better scalability for file storage
- Improved backup and recovery processes

---

**Document Version**: 1.0  
**Last Updated**: September 17, 2025  
**Status**: Planning Phase
