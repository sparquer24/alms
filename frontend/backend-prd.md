# Arms License Management System (ALMS) - Backend PRD

## 1. System Overview

The Arms License Management System (ALMS) is a comprehensive solution for managing arms license applications and their lifecycle. The system implements a role-based workflow where applications move through various stages of approval by different authorities.

## 2. Required APIs

This section outlines the core APIs required for the Arms License Management System. Each API includes its endpoint, method, purpose, and essential business logic. Implementation examples are provided for key endpoints.

*For complete API implementation details including all endpoints, code samples, security measures, and best practices, refer to the `api-implementation-guide.md` document.*

### 2.1 Authentication APIs

#### Login
- **Endpoint:** `/api/auth/login`
- **Method:** POST
- **Purpose:** Authenticate users and provide JWT token
- **Business Logic:**
  - Validate user credentials
  - Generate JWT token with role information
  - Return user details and permissions
- **Implementation Example:**

```javascript
// Express route handler
router.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate request body
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Find user in database
      const user = await User.findOne({ where: { username, is_active: true } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        // Log failed login attempt
        await AuditLog.create({
          action: 'FAILED_LOGIN',
          user_id: user.id,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token with 1 hour expiry
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );
      
      // Generate refresh token with 7 days expiry
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      // Store refresh token
      await RefreshToken.create({
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      // Update last login timestamp
      await user.update({ last_login: new Date() });
      
      // Log successful login
      await AuditLog.create({
        action: 'LOGIN',
        user_id: user.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      // Get user permissions
      const permissions = await RolePermission.findAll({
        where: { role: user.role },
        attributes: ['permission']
      });
      
      // Return user information and token
      return res.status(200).json({
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          designation: user.designation,
          permissions: permissions.map(p => p.permission)
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }  });
```

#### Logout
- **Endpoint:** `/api/auth/logout`
- **Method:** POST
- **Purpose:** Invalidate user session
- **Business Logic:**
  - Blacklist JWT token
  - Clear session data
- **Implementation Example:**

```javascript
router.post('/api/auth/logout', authMiddleware, async (req, res) => {
    try {
      // Get token from authorization header
      const token = req.headers.authorization?.split(' ')[1];
      
      // Add token to blacklist with expiry time
      await TokenBlacklist.create({
        token,
        expires_at: req.user.exp * 1000 // Convert to milliseconds
      });
      
      // Remove refresh token
      await RefreshToken.destroy({
        where: { user_id: req.user.userId }
      });
      
      // Log logout action
      await AuditLog.create({
        action: 'LOGOUT',
        user_id: req.user.userId,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }  });
```

#### Get Current User
- **Endpoint:** `/api/auth/me`
- **Method:** GET
- **Purpose:** Get authenticated user details
- **Business Logic:**
  - Validate JWT token
  - Return user profile and permissions
- **Implementation Example:**

```javascript
router.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    // req.user is populated by the authMiddleware with JWT payload data
    const userId = req.user.userId;
    
    // Fetch user details from database
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'username', 'email', 'role', 'designation', 'created_at', 'last_login']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user permissions based on role
    const permissions = await RolePermission.findAll({
      where: { role: user.role },
      attributes: ['permission']
    });
    
    // Get available actions based on role
    const roleActions = await RoleAction.findAll({
      where: { role: user.role },
      attributes: ['action', 'resource']
    });
    
    // Log access
    await AuditLog.create({
      action: 'PROFILE_ACCESS',
      user_id: userId,
      ip_address: req.ip,
      details: JSON.stringify({
        endpoint: '/api/auth/me',
                method: 'GET'
      })
    });
    
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        designation: user.designation,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        permissions: permissions.map(p => p.permission),
        availableActions: roleActions.map(a => ({
          action: a.action,
          resource: a.resource
        }))
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2.2 Application Management APIs

#### Get All Applications
- **Endpoint:** `/api/applications`
- **Method:** GET
- **Purpose:** List applications with filtering and pagination
- **Business Logic:**
  - Filter by status, date range, search query
  - Implement role-based access control
  - Return paginated results

#### Get Application by ID
- **Endpoint:** `/api/applications/{id}`
- **Method:** GET
- **Purpose:** Get detailed application information
- **Business Logic:**
  - Check user permissions
  - Return full application details with history
  - Include available actions based on role

#### Create Application
- **Endpoint:** `/api/applications`
- **Method:** POST
- **Purpose:** Submit new license application
- **Business Logic:**
  - Validate application data
  - Create application record
  - Initialize workflow state
  - Assign to appropriate role
- **Implementation Example:**

```javascript
router.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    // Start a database transaction
    const transaction = await sequelize.transaction();
    
    try {
      const {
        applicantName,
        applicantMobile,
        applicantEmail,
        fatherName,
        gender,
        dob,
        address,
        applicationType,
        weaponType,
        weaponReason,
        licenseType,
        licenseValidity,
        isPreviouslyHeldLicense,
        previousLicenseNumber,
        hasCriminalRecord,
        criminalRecordDetails,
        documents
      } = req.body;
      
      // Validate required fields
      const requiredFields = ['applicantName', 'applicantMobile', 'applicationType', 'weaponType', 'weaponReason'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          fields: missingFields
        });
      }
      
      // Validate mobile number format
      if (!/^[0-9]{10}$/.test(applicantMobile)) {
        return res.status(400).json({
          error: 'Invalid mobile number format. Must be 10 digits.'
        });
      }
      
      // Validate email format if provided
      if (applicantEmail && !/^\S+@\S+\.\S+$/.test(applicantEmail)) {
        return res.status(400).json({
          error: 'Invalid email format.'
        });
      }
      
      // Generate application ID with prefix and random number
      const currentYear = new Date().getFullYear();
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const applicationId = `ALMS-${currentYear}-${randomNum}`;
      
      // Get initial workflow data
      const initialStatus = 'FRESH_FORM';
      const applicantRole = req.user.role; // Should be 'APPLICANT'
      const nextRole = await getNextRole(applicantRole, initialStatus);
      
      // Create application record
      const application = await Application.create({
        id: applicationId,
        applicant_name: applicantName,
        applicant_mobile: applicantMobile,
        applicant_email: applicantEmail,
        father_name: fatherName,
        gender,
        dob: dob ? new Date(dob) : null,
        address,
        application_type: applicationType,
        weapon_type: weaponType,
        weapon_reason: weaponReason,
        license_type: licenseType,
        license_validity: licenseValidity ? new Date(licenseValidity) : null,
        is_previously_held_license: isPreviouslyHeldLicense || false,
        previous_license_number: previousLicenseNumber,
        has_criminal_record: hasCriminalRecord || false,
        criminal_record_details: criminalRecordDetails,
        status: initialStatus,
        created_by: req.user.userId,
        assigned_to: null // Will be assigned when forwarded
      }, { transaction });
      
      // Create application history record
      await ApplicationHistory.create({
        application_id: applicationId,
        action: 'CREATE',
        performed_by: req.user.userId,
        comments: 'Application created',
        created_at: new Date()
      }, { transaction });
      
      // Process document uploads if provided
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          // Validate document data
          if (!doc.name || !doc.type || !doc.base64Data) {
            continue; // Skip invalid documents
          }
          
          // Generate safe filename
          const fileExt = doc.name.split('.').pop().toLowerCase();
          const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
          
          if (!allowedExts.includes(fileExt)) {
            continue; // Skip invalid file types
          }
          
          const safeFileName = `${applicationId}-${doc.type.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.${fileExt}`;
          
          // Get file buffer from base64
          const fileBuffer = Buffer.from(
            doc.base64Data.replace(/^data:.*?;base64,/, ''),
            'base64'
          );
          
          // Upload to cloud storage (implementation depends on your storage provider)
          const fileUrl = await uploadFile(
            fileBuffer,
            safeFileName,
            doc.name,
            fileExt
          );
          
          // Create document record
          await Document.create({
            application_id: applicationId,
            name: doc.name,
            type: doc.type,
            url: fileUrl,
            uploaded_by: req.user.userId,
            created_at: new Date()
          }, { transaction });
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      // Create audit log
      await AuditLog.create({
        action: 'APPLICATION_CREATED',
        user_id: req.user.userId,
        ip_address: req.ip,
        details: JSON.stringify({
          applicationId,
          applicationType,
          weaponType
        })
      });
      
      // Return success response
      return res.status(201).json({
        success: true,
        message: 'Application created successfully',
        applicationId,
        status: initialStatus,
        nextRole
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Create application error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to determine next role in workflow
async function getNextRole(currentRole, status) {
  // Get the valid next roles from role hierarchy
  const nextRoles = await RoleHierarchy.findAll({
    where: { from_role: currentRole }
  });
  
  // Default for applicant is ZS
  if (currentRole === 'APPLICANT' && status === 'FRESH_FORM') {
    return 'ZONAL_SUPERINTENDENT';
  }
  
  // Handle other workflow scenarios
  return nextRoles.length > 0 ? nextRoles[0].to_role : null;
}

// File upload helper function
async function uploadFile(buffer, fileName, originalName, fileExt) {
  // Implementation depends on your storage provider (AWS S3, Azure Blob, etc.)
  // This is a simple example using local file system
  const storagePath = path.join(process.env.UPLOAD_DIR, fileName);
  
  await fs.promises.writeFile(storagePath, buffer);
  
  // In production, return a URL to the uploaded file
  return `/uploads/${fileName}`;
}
```

#### Update Application Status
- **Endpoint:** `/api/applications/{id}/status`
- **Method:** PATCH
- **Purpose:** Update application status
- **Business Logic:**
  - Validate status transition
  - Check user permissions
  - Update status and history
  - Notify relevant parties

#### Forward Application
- **Endpoint:** `/api/applications/{id}/forward`
- **Method:** POST
- **Purpose:** Forward application to next authority
- **Business Logic:**
  - Validate forwarding rules
  - Check role hierarchy
  - Update workflow state
  - Notify next authority

### 2.3 Document Management APIs

#### Upload Document
- **Endpoint:** `/api/applications/{id}/documents`
- **Method:** POST
- **Purpose:** Upload application documents
- **Business Logic:**
  - Validate file type and size
  - Store in secure location
  - Update application record
  - Generate document URL

#### Get Documents
- **Endpoint:** `/api/applications/{id}/documents`
- **Method:** GET
- **Purpose:** List application documents
- **Business Logic:**
  - Check user permissions
  - Return document metadata
  - Generate secure URLs

#### Delete Document
- **Endpoint:** `/api/applications/{id}/documents/{documentId}`
- **Method:** DELETE
- **Purpose:** Remove application document
- **Business Logic:**
  - Check user permissions
  - Remove from storage
  - Update application record

### 2.4 Report APIs

#### Get Application Statistics
- **Endpoint:** `/api/reports/statistics`
- **Method:** GET
- **Purpose:** Get application statistics
- **Business Logic:**
  - Aggregate application data
  - Filter by date range
  - Calculate metrics
  - Return formatted statistics

#### Get Applications by Status
- **Endpoint:** `/api/reports/applications-by-status`
- **Method:** GET
- **Purpose:** List applications by status
- **Business Logic:**
  - Filter by status
  - Implement pagination
  - Return formatted results

#### Generate Application PDF
- **Endpoint:** `/api/applications/{id}/pdf`
- **Method:** GET
- **Purpose:** Generate application PDF
- **Business Logic:**
  - Check user permissions
  - Generate PDF from application data
  - Return PDF file

### 2.5 User Management APIs

#### Get Users by Role
- **Endpoint:** `/api/users`
- **Method:** GET
- **Purpose:** List users by role
- **Business Logic:**
  - Filter by role
  - Return user details
  - Implement pagination

### 2.6 Role-Based Action APIs

#### Get Available Actions
- **Endpoint:** `/api/roles/actions`
- **Method:** GET
- **Purpose:** Get available actions for role
- **Business Logic:**
  - Check user role
  - Return available actions
  - Include permissions

#### Get Role Hierarchy
- **Endpoint:** `/api/roles/hierarchy`
- **Method:** GET
- **Purpose:** Get role hierarchy
- **Business Logic:**
  - Return role hierarchy
  - Include forwarding rules

### 2.7 Batch Action APIs

#### Batch Process Applications
- **Endpoint:** `/api/applications/batch`
- **Method:** POST
- **Purpose:** Process multiple applications
- **Business Logic:**
  - Validate batch action
  - Process applications
  - Return results

## 3. Business Logic

### 3.1 Role-Based Workflow

The system implements a hierarchical workflow with the following roles:

1. **Applicant**
   - Submit new applications
   - Upload required documents
   - Track application status

2. **Zonal Superintendent (ZS)**
   - Capture UIN and biometrics
   - Upload documents
   - Forward to ACP/DCP
   - Generate PDFs

3. **Station House Officer (SHO)**
   - Conduct enquiries
   - Upload documents
   - Forward to ACP
   - Add remarks

4. **Assistant Commissioner of Police (ACP)**
   - Review applications
   - Forward to SHO/DCP
   - Approve/Reject applications
   - Add remarks

5. **Deputy Commissioner of Police (DCP)**
   - Review applications
   - Forward to AS/CP
   - Approve/Reject applications
   - Request resubmission

6. **Commissioner of Police (CP)**
   - Final approval authority
   - Approve/Reject applications
   - Request resubmission

### 3.2 Application States

Applications can be in the following states:

1. **Fresh Form**
   - Initial state
   - Requires document upload
   - Can be forwarded to ZS

2. **Forwarded**
   - Under review by authority
   - Can be forwarded to next authority
   - Can be returned/flagged

3. **Returned**
   - Requires resubmission
   - Applicant can update
   - Can be resubmitted

4. **Red Flagged**
   - Requires investigation
   - Special handling required
   - Can be disposed

5. **Disposed**
   - Final state
   - No further actions
   - Can be archived

### 3.3 Business Rules

1. **Document Requirements**
   - ID proof
   - Address proof
   - Character certificate
   - Photo
   - Additional documents based on application type

2. **Forwarding Rules**
   - Applications must follow role hierarchy
   - Each role can forward to specific roles
   - Forwarding requires comments
   - Optional recommendations

3. **Approval Rules**
   - Multiple levels of approval required
   - Each level can approve/reject
   - Rejection requires reason
   - Final approval by CP

4. **Security Rules**
   - Role-based access control
   - Document access restrictions
   - Audit logging
   - Secure file storage

### 3.4 Role Permissions Matrix

The system implements a comprehensive role-based access control system with the following permission structure:

#### User Roles
- **Applicant (APPLICANT)**: Citizen who applies for a license
- **Zonal Superintendent (ZS)**: Initial processor of applications
- **Station House Officer (SHO)**: Conducts field enquiries on applications
- **Assistant Commissioner of Police (ACP)**: Reviews and forwards applications
- **Deputy Commissioner of Police (DCP)**: Authority for TA license approval
- **Arms Superintendent (AS)**: Handles administrative processing
- **Administrative Officer (ADO)**: Processes documentation
- **Chief Administrative Officer (CADO)**: Final administrative check
- **Joint Commissioner of Police (JTCP)**: Reviews and forwards to CP
- **Commissioner of Police (CP)**: Final approval authority for AI licenses
- **Arms Superintendent (ARMS_SUPDT)**: Verifies application details
- **Arms Seat (ARMS_SEAT)**: Processes application documentation
- **Assistant Compliance Officer (ACO)**: Ensures compliance with regulations
- **Admin (ADMIN)**: System administrator with full access

#### View Permissions
Each role is granted specific view permissions that determine what sections of the application they can access:

| Role | Fresh Form | Forwarded | Returned | Red Flagged | Disposed | Sent | Final Disposal | Reports |
|------|------------|-----------|----------|-------------|----------|------|---------------|---------|
| APPLICANT | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| ZS | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| SHO | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| ACP | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DCP | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Other roles | Varies | ✅ | ✅ | Varies | Varies | ✅ | Varies | ✅ |

#### Action Permissions
Action permissions control what operations each role can perform:

| Action | Primary Roles | Description |
|--------|---------------|-------------|
| Submit Application | APPLICANT | Create new license application |
| Capture UIN/Biometrics | ZS | Record identification information |
| Upload Documents | APPLICANT, ZS, SHO | Attach required documentation |
| Forward Application | All except APPLICANT | Send to next authority in workflow |
| Conduct Enquiry | SHO | Perform field verification |
| Add Remarks | All except APPLICANT | Add comments to application |
| Approve TA | DCP, ACO | Approve Transport Authority license |
| Approve AI | CP | Approve Arms Import license |
| Reject | ACP, DCP, CP, ACO | Decline application with reason |
| Request Resubmission | ZS, ACP, DCP, CP | Return to applicant for correction |
| Generate PDF | ZS, ARMS_SEAT | Create official documentation |
| Red Flag | Most roles | Mark application for special attention |
| Dispose | DCP, CP | Finalize application processing |

#### Role Hierarchy for Forwarding
The forwarding hierarchy defines the valid paths for application movement:

1. Applicant → Zonal Superintendent (initial submission)
2. Zonal Superintendent → ACP or DCP
3. ACP ↔ SHO (for enquiry)
4. ACP → DCP (with recommendation)
5. DCP → AS (for administrative processing)
6. DCP → CP (for final approval of AI)
7. AS → ADO (documentation processing)
8. ADO → CADO (administrative review)
9. CADO → JTCP (senior review)
10. JTCP → CP (final authority)

*For the complete permissions matrix and role hierarchy details, refer to the `role-permissions-matrix.md` document.*

### 3.5 Application Workflow

The application follows a structured flow through the system:

1. **Submission Phase**
   - Applicant creates and submits application (FRESH_FORM)
   - ZS reviews and processes application
   - ZS forwards to appropriate authority (FORWARDED)

2. **Enquiry Phase**
   - ACP reviews application and may forward to SHO
   - SHO conducts field enquiry
   - SHO returns application to ACP with findings

3. **Review Phase**
   - ACP provides recommendation
   - DCP reviews application with recommendations
   - DCP may approve TA license or forward to CP for AI license

4. **Administrative Processing**
   - AS handles processing for complex cases
   - ADO processes documentation requirements
   - CADO performs administrative review
   - JTCP adds senior-level recommendation

5. **Final Decision Phase**
   - CP makes final decision on AI licenses
   - Application is either approved or rejected (DISPOSED)
   - License is generated for approved applications

6. **Post-Decision Processing**
   - ARMS office processes approved applications
   - Documentation is completed
   - License is issued to applicant

Throughout the workflow, applications can be returned to applicant (RETURNED) for correction or red-flagged (FLAGGED) for special handling.

*For a more detailed explanation of the complete application workflow, state transitions, and processing rules, refer to the `application-workflow.md` document.*

## 4. Database Schema

The following schema outlines the core tables required for the ALMS system. The schema includes tables for users, applications, documents, history, roles, and permissions.

*For a more comprehensive database schema with enhanced role and permission tables, including sample data insertion scripts, refer to the `database-schema-roles-permissions.md` document.*

### 4.1 Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
```

### 4.2 Applications Table

```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_name VARCHAR(100) NOT NULL,
    applicant_mobile VARCHAR(15) NOT NULL,
    applicant_email VARCHAR(255),
    father_name VARCHAR(100),
    gender VARCHAR(10),
    dob DATE,
    address TEXT,
    application_type VARCHAR(50) NOT NULL,
    weapon_type VARCHAR(50),
    weapon_reason TEXT,
    license_type VARCHAR(50),
    license_validity DATE,
    is_previously_held_license BOOLEAN DEFAULT false,
    previous_license_number VARCHAR(50),
    has_criminal_record BOOLEAN DEFAULT false,
    criminal_record_details TEXT,
    status VARCHAR(20) NOT NULL,
    assigned_to UUID REFERENCES users(id),
    forwarded_from UUID REFERENCES users(id),
    forwarded_to UUID REFERENCES users(id),
    forward_comments TEXT,
    return_reason TEXT,
    flag_reason TEXT,
    disposal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Documents Table

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.4 Application History Table

```sql
CREATE TABLE application_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by UUID REFERENCES users(id),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 Roles Table

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL, -- Hierarchy level of the role (1 being the highest)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.6 Permissions Table
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- View, Action, Admin, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.7 Role Permissions Table
```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);
```

### 4.8 Role Hierarchy Table
```sql
CREATE TABLE role_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    to_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_role_id, to_role_id)
);
```

## 5. Security Considerations

1. **Authentication**
   - JWT-based authentication
   - Token expiration and refresh
   - Secure password hashing

2. **Authorization**
   - Role-based access control
   - Permission-based actions
   - API endpoint protection

3. **Data Protection**
   - Encrypted sensitive data
   - Secure file storage
   - Audit logging

4. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration

## 6. Performance Considerations

1. **Database Optimization**
   - Indexed fields
   - Efficient queries
   - Connection pooling

2. **API Performance**
   - Pagination
   - Caching
   - Background processing

3. **File Handling**
   - Efficient storage
   - CDN integration
   - File compression

## 7. Monitoring and Logging

### 7.1 Application Logs

1. **Error Logging**
   - Stack traces and error details
   - Error severity categorization (Critical, Error, Warning)
   - Context information (user, request data, timestamp)
   - Error notifications for critical issues

2. **Access Logging**
   - Request timestamps and durations
   - User identifiers and IP addresses
   - Endpoints accessed and HTTP methods
   - Response status codes
   - Request parameters (sanitized for sensitive data)

3. **Audit Logging**
   - All data modifications (create, update, delete operations)
   - Role-based actions (approvals, rejections, forwarding)
   - Document access events
   - Admin-level system configuration changes
   - User session activities (login, logout, token refresh)

### 7.2 Performance Metrics

1. **Response Times**
   - Average response time by endpoint
   - 95th and 99th percentile latencies
   - Database query execution times
   - File upload/download durations
   - API gateway latency

2. **Error Rates**
   - Percentage of failed requests by endpoint
   - Error trends over time
   - Most common error types
   - Client-side vs. server-side errors
   - API timeout occurrences

3. **Resource Usage**
   - CPU and memory utilization
   - Database connection pool status
   - Storage utilization for document uploads
   - Network bandwidth consumption
   - API rate limit usage

### 7.3 Security Monitoring

1. **Authentication Events**
   - Failed login attempts (with IP address patterns)
   - Password reset requests
   - Account lockouts
   - Session hijacking attempts
   - Token validation failures

2. **Suspicious Activities**
   - Multiple rapid requests from single sources
   - Unusual access patterns or after-hours activity
   - Attempts to access unauthorized resources
   - Unusual geographic access locations
   - Brute force detection for sensitive endpoints

3. **API Usage Patterns**
   - API request volume by endpoint and user role
   - Unusual spikes in API traffic
   - Access attempts to deprecated endpoints
   - API versioning usage statistics
   - Third-party integration monitoring

### 7.4 Monitoring Infrastructure

1. **Log Management**
   - Centralized logging system (ELK stack or similar)
   - Log retention policies (90 days online, 1 year archived)
   - Log rotation and compression
   - Searchable and filterable log interface
   - Log backup and disaster recovery

2. **Alerting System**
   - Real-time alerts for critical errors
   - Threshold-based alerts for performance issues
   - Escalation paths for different alert types
   - Alert aggregation to prevent notification storms
   - On-call rotation integration

3. **Visualization and Reporting**
   - Real-time monitoring dashboards
   - Custom report generation for stakeholders
   - Trend analysis and forecasting
   - Service level agreement (SLA) compliance tracking
   - Periodic system health reports

## 8. Detailed Documentation References

Additional detailed documentation has been created to supplement this PRD:

1. **Role Permissions Matrix**
   - Comprehensive matrix of all roles and their permissions
   - Detailed breakdown of view and action permissions by role
   - Complete role hierarchy for application forwarding
   - File: `role-permissions-matrix.md`

2. **Database Schema for Roles and Permissions**
   - Expanded database schema for the role-based access control system
   - Enhanced table structures for roles, permissions and hierarchy
   - Sample data insertion scripts for roles, permissions and role hierarchy
   - File: `database-schema-roles-permissions.md`

3. **Application Workflow Documentation**
   - Detailed end-to-end application workflow
   - State transition diagrams and rules
   - Role-based processing steps and responsibilities
   - Key workflow rules and constraints
   - File: `application-workflow.md`

4. **API Implementation Guide**
   - Code examples and implementation details for all APIs
   - Authentication and authorization patterns
   - Error handling and response formats
   - Security best practices implementation
   - File: `api-implementation-guide.md`

These supplementary documents provide the detailed information needed for implementation while keeping this PRD focused on high-level requirements and architecture.

Implementation teams should refer to these supplementary documents for detailed specifications when building each component of the system.