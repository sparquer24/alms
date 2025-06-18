# Database Schema for ALMS Roles and Permissions

## 1. Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    designation VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    last_assigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Roles Table

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

## 3. Permissions Table

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

## 4. Role Permissions Table

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

## 5. Role Hierarchy Table

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



### 6.1 Roles

```sql
INSERT INTO roles (code, name, description, level) VALUES
('APPLICANT', 'Citizen Applicant', 'Individual applying for an arms license', 14),
('ZS', 'Zonal Superintendent', 'Initial processor of applications', 13),
('SHO', 'Station House Officer', 'Conducts field enquiries on applications', 12),
('ACP', 'Assistant Commissioner of Police', 'Reviews and forwards applications', 11),
('DCP', 'Deputy Commissioner of Police', 'Authority for TA license approval', 10),
('AS', 'Arms Superintendent', 'Handles administrative processing', 9),
('ADO', 'Administrative Officer', 'Processes documentation', 8),
('CADO', 'Chief Administrative Officer', 'Final administrative check', 7),
('JTCP', 'Joint Commissioner of Police', 'Reviews and forwards to CP', 6),
('CP', 'Commissioner of Police', 'Final approval authority for AI licenses', 5),
('ARMS_SUPDT', 'Arms Superintendent', 'Verifies application details', 4),
('ARMS_SEAT', 'Arms Seat', 'Processes application documentation', 3),
('ACO', 'Assistant Compliance Officer', 'Ensures compliance with regulations', 2),
('ADMIN', 'System Administrator', 'Administrator with full access', 1);
```

### 6.2 Permissions

```sql
-- View Permissions
INSERT INTO permissions (code, name, description, category) VALUES
('VIEW_FRESH_FORM', 'View Fresh Form', 'Ability to view newly created applications', 'VIEW'),
('VIEW_FORWARDED', 'View Forwarded', 'Ability to view applications forwarded to the user', 'VIEW'),
('VIEW_RETURNED', 'View Returned', 'Ability to view applications that have been returned', 'VIEW'),
('VIEW_RED_FLAGGED', 'View Red Flagged', 'Ability to view applications that have been red flagged', 'VIEW'),
('VIEW_DISPOSED', 'View Disposed', 'Ability to view applications that have been disposed', 'VIEW'),
('VIEW_SENT', 'View Sent', 'Ability to view applications sent by the user', 'VIEW'),
('VIEW_FINAL_DISPOSAL', 'View Final Disposal', 'Ability to view finally approved or rejected applications', 'VIEW'),
('VIEW_REPORTS', 'View Reports', 'Ability to view reports', 'VIEW'),
('ACCESS_SETTINGS', 'Access Settings', 'Ability to access system settings', 'VIEW');

-- Action Permissions
INSERT INTO permissions (code, name, description, category) VALUES
('SUBMIT_APPLICATION', 'Submit Application', 'Ability to submit new application', 'ACTION'),
('CAPTURE_UIN', 'Capture UIN', 'Ability to capture Unique Identification Number', 'ACTION'),
('CAPTURE_BIOMETRICS', 'Capture Biometrics', 'Ability to capture biometric data', 'ACTION'),
('UPLOAD_DOCUMENTS', 'Upload Documents', 'Ability to upload documents', 'ACTION'),
('FORWARD_TO_ACP', 'Forward to ACP', 'Ability to forward application to ACP', 'ACTION'),
('FORWARD_TO_SHO', 'Forward to SHO', 'Ability to forward application to SHO', 'ACTION'),
('FORWARD_TO_DCP', 'Forward to DCP', 'Ability to forward application to DCP', 'ACTION'),
('FORWARD_TO_AS', 'Forward to AS', 'Ability to forward application to Arms Superintendent', 'ACTION'),
('FORWARD_TO_ADO', 'Forward to ADO', 'Ability to forward application to Administrative Officer', 'ACTION'),
('FORWARD_TO_CADO', 'Forward to CADO', 'Ability to forward application to Chief Administrative Officer', 'ACTION'),
('FORWARD_TO_JTCP', 'Forward to JTCP', 'Ability to forward application to Joint Commissioner of Police', 'ACTION'),
('FORWARD_TO_CP', 'Forward to CP', 'Ability to forward application to Commissioner of Police', 'ACTION'),
('CONDUCT_ENQUIRY', 'Conduct Enquiry', 'Ability to conduct enquiry on application', 'ACTION'),
('ADD_REMARKS', 'Add Remarks', 'Ability to add remarks to application', 'ACTION'),
('APPROVE_TA', 'Approve TA', 'Ability to approve Transport Authority license', 'ACTION'),
('APPROVE_AI', 'Approve AI', 'Ability to approve Arms Import license', 'ACTION'),
('REJECT', 'Reject', 'Ability to reject application', 'ACTION'),
('REQUEST_RESUBMISSION', 'Request Resubmission', 'Ability to request resubmission of application', 'ACTION'),
('GENERATE_PDF', 'Generate PDF', 'Ability to generate PDF for application', 'ACTION'),
('RED_FLAG', 'Red Flag', 'Ability to red flag an application', 'ACTION'),
('RETURN_APPLICATION', 'Return Application', 'Ability to return an application', 'ACTION'),
('DISPOSE_APPLICATION', 'Dispose Application', 'Ability to dispose an application', 'ACTION');
```

### 6.3 Role Hierarchy

```sql
-- Define role forwarding hierarchy
INSERT INTO role_hierarchy (from_role_id, to_role_id)
SELECT r1.id, r2.id FROM roles r1, roles r2
WHERE (r1.code = 'ZS' AND r2.code = 'ACP') OR
      (r1.code = 'ZS' AND r2.code = 'DCP') OR
      (r1.code = 'SHO' AND r2.code = 'ACP') OR
      (r1.code = 'ACP' AND r2.code = 'SHO') OR
      (r1.code = 'ACP' AND r2.code = 'DCP') OR
      (r1.code = 'DCP' AND r2.code = 'ACP') OR
      (r1.code = 'DCP' AND r2.code = 'AS') OR
      (r1.code = 'DCP' AND r2.code = 'CP') OR
      (r1.code = 'AS' AND r2.code = 'ADO') OR
      (r1.code = 'AS' AND r2.code = 'DCP') OR
      (r1.code = 'ADO' AND r2.code = 'CADO') OR
      (r1.code = 'CADO' AND r2.code = 'JTCP') OR
      (r1.code = 'JTCP' AND r2.code = 'CP') OR
      (r1.code = 'CP' AND r2.code = 'DCP') OR
      (r1.code = 'ARMS_SUPDT' AND r2.code = 'ARMS_SEAT') OR
      (r1.code = 'ARMS_SUPDT' AND r2.code = 'ADO') OR
      (r1.code = 'ARMS_SEAT' AND r2.code = 'ADO') OR
      (r1.code = 'ARMS_SEAT' AND r2.code = 'ARMS_SUPDT') OR
      (r1.code = 'ACO' AND r2.code = 'ACP') OR
      (r1.code = 'ACO' AND r2.code = 'DCP') OR
      (r1.code = 'ACO' AND r2.code = 'CP');

-- Add admin forwarding capabilities to all roles
INSERT INTO role_hierarchy (from_role_id, to_role_id)
SELECT a.id, r.id FROM roles a, roles r
WHERE a.code = 'ADMIN' AND r.code != 'ADMIN';
```
