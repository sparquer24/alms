# ALMS Database Schema with Sample Data

This document provides a comprehensive database schema for the Arms License Management System (ALMS), including sample data for each table. The schema is designed based on the requirements in the PRD and the frontend implementation.

## 1. Users Table

### Schema Definition

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
    is_active BOOLEAN DEFAULT true,
    mobile VARCHAR(15),
    department VARCHAR(100),
    profile_image_url TEXT
);
```

### Sample Data

| id | username | password_hash | email | name | role | designation | created_at | updated_at | last_login | is_active | mobile | department | profile_image_url |
|----|----------|--------------|-------|------|------|------------|------------|------------|-----------|-----------|--------|------------|------------------|
| 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'john.applicant' | '$2a$12$1234567890abcdef1234567890abcdef1234567890abcdef1234567' | 'john@example.com' | 'John Doe' | 'APPLICANT' | 'Citizen' | '2023-01-01 10:00:00+00' | '2023-01-01 10:00:00+00' | '2023-06-15 14:30:00+00' | true | '9876543210' | 'N/A' | '/profiles/john.jpg' |
| 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | 'sarah.zs' | '$2a$12$abcdef1234567890abcdef1234567890abcdef1234567890abcdef12' | 'sarah@police.gov' | 'Sarah Johnson' | 'ZS' | 'Zonal Superintendent' | '2023-01-02 09:30:00+00' | '2023-01-02 09:30:00+00' | '2023-06-16 09:45:00+00' | true | '8765432109' | 'Police' | '/profiles/sarah.jpg' |
| 'c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8' | 'mike.sho' | '$2a$12$567890abcdef1234567890abcdef1234567890abcdef1234567890ab' | 'mike@police.gov' | 'Mike Brown' | 'SHO' | 'Station House Officer' | '2023-01-03 14:20:00+00' | '2023-01-03 14:20:00+00' | '2023-06-15 16:20:00+00' | true | '7654321098' | 'Police' | '/profiles/mike.jpg' |
| 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | 'lisa.acp' | '$2a$12$ef1234567890abcdef1234567890abcdef1234567890abcdef123456' | 'lisa@police.gov' | 'Lisa Wong' | 'ACP' | 'Assistant Commissioner of Police' | '2023-01-04 11:45:00+00' | '2023-01-04 11:45:00+00' | '2023-06-16 10:30:00+00' | true | '6543210987' | 'Police' | '/profiles/lisa.jpg' |
| 'e5f6g7h8-i9j0-1k2l-3m4n-o5p6q7r8s9t0' | 'david.dcp' | '$2a$12$7890abcdef1234567890abcdef1234567890abcdef1234567890abcd' | 'david@police.gov' | 'David Chen' | 'DCP' | 'Deputy Commissioner of Police' | '2023-01-05 08:15:00+00' | '2023-01-05 08:15:00+00' | '2023-06-15 11:40:00+00' | true | '5432109876' | 'Police' | '/profiles/david.jpg' |
| 'f6g7h8i9-j0k1-2l3m-4n5o-p6q7r8s9t0u1' | 'emily.cp' | '$2a$12$def1234567890abcdef1234567890abcdef1234567890abcdef12345' | 'emily@police.gov' | 'Emily Wilson' | 'CP' | 'Commissioner of Police' | '2023-01-06 13:10:00+00' | '2023-01-06 13:10:00+00' | '2023-06-16 14:20:00+00' | true | '4321098765' | 'Police' | '/profiles/emily.jpg' |
| 'g7h8i9j0-k1l2-3m4n-5o6p-q7r8s9t0u1v2' | 'james.admin' | '$2a$12$90abcdef1234567890abcdef1234567890abcdef1234567890abcdef' | 'james@admin.gov' | 'James Smith' | 'ADMIN' | 'System Administrator' | '2023-01-07 09:00:00+00' | '2023-01-07 09:00:00+00' | '2023-06-16 08:30:00+00' | true | '3210987654' | 'IT' | '/profiles/james.jpg' |

### Notes
- I've added `mobile`, `department`, and `profile_image_url` fields which weren't in the original schema but would be useful based on the frontend requirements
- Passwords are stored as hashed values for security
- The `role` field corresponds to the roles defined in the requirements document

## 2. Applications Table

### Schema Definition

```sql
CREATE TABLE applications (
    id VARCHAR(50) PRIMARY KEY,
    applicant_name VARCHAR(100) NOT NULL,
    applicant_middle_name VARCHAR(100),
    applicant_last_name VARCHAR(100),
    applicant_mobile VARCHAR(15) NOT NULL,
    applicant_email VARCHAR(255),
    father_name VARCHAR(100),
    gender VARCHAR(10),
    dob DATE,
    age INT,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
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
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    place_of_birth VARCHAR(100),
    pan_number VARCHAR(20),
    aadhar_number VARCHAR(20),
    date_of_birth_in_words TEXT,
    present_address TEXT,
    present_state VARCHAR(50),
    present_district VARCHAR(50),
    residing_since DATE,
    jurisdiction_police_station VARCHAR(100),
    alice_acknowledgement_number VARCHAR(50),
    application_filled_by VARCHAR(50)
);
```

### Sample Data

| id | applicant_name | applicant_middle_name | applicant_last_name | applicant_mobile | applicant_email | father_name | gender | dob | age | address | city | state | pincode | application_type | weapon_type | weapon_reason | license_type | license_validity | is_previously_held_license | previous_license_number | has_criminal_record | criminal_record_details | status | assigned_to | forwarded_from | forwarded_to | created_at | updated_at | created_by | place_of_birth | pan_number | aadhar_number |
|----|----------------|----------------------|----------------------|-----------------|-----------------|-------------|--------|-----|-----|---------|------|-------|---------|------------------|-------------|---------------|-------------|-----------------|----------------------------|------------------------|---------------------|-------------------------|--------|------------|---------------|--------------|------------|------------|------------|----------------|------------|---------------|
| 'ALMS-2023-123456' | 'Rahul' | 'Kumar' | 'Singh' | '9876543210' | 'rahul@example.com' | 'Rajesh Singh' | 'Male' | '1985-05-15' | 38 | '123 Main Street' | 'Delhi' | 'Delhi' | '110001' | 'NEW' | 'PISTOL' | 'Self Defense' | 'TA' | '2028-05-15' | false | NULL | false | NULL | 'FRESH_FORM' | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | NULL | NULL | '2023-06-10 09:30:00+00' | '2023-06-10 09:30:00+00' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Delhi' | 'ABCPS1234D' | '123456789012' |
| 'ALMS-2023-234567' | 'Priya' | 'J' | 'Patel' | '8765432109' | 'priya@example.com' | 'Jayesh Patel' | 'Female' | '1990-03-20' | 33 | '456 Park Avenue' | 'Mumbai' | 'Maharashtra' | '400001' | 'NEW' | 'RIFLE' | 'Sports Shooting' | 'TA' | '2028-03-20' | false | NULL | false | NULL | 'FORWARDED' | 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | '2023-06-11 14:20:00+00' | '2023-06-12 10:15:00+00' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Mumbai' | 'PQRST5678E' | '234567890123' |
| 'ALMS-2023-345678' | 'Amit' | 'R' | 'Sharma' | '7654321098' | 'amit@example.com' | 'Rakesh Sharma' | 'Male' | '1982-11-10' | 41 | '789 Lake Road' | 'Bangalore' | 'Karnataka' | '560001' | 'RENEWAL' | 'SHOTGUN' | 'Crop Protection' | 'AI' | '2028-11-10' | true | 'ALMS-2018-987654' | false | NULL | 'RED_FLAGGED' | 'c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8' | 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | 'c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8' | '2023-06-15 11:30:00+00' | '2023-06-16 09:45:00+00' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Chennai' | 'LMNOP6789F' | '345678901234' |
| 'ALMS-2023-456789' | 'Sneha' | 'M' | 'Gupta' | '6543210987' | 'sneha@example.com' | 'Mahesh Gupta' | 'Female' | '1988-07-25' | 35 | '101 Hill Avenue' | 'Chennai' | 'Tamil Nadu' | '600001' | 'NEW' | 'PISTOL' | 'Personal Security' | 'TA' | '2028-07-25' | false | NULL | false | NULL | 'RETURNED' | NULL | 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-18 16:40:00+00' | '2023-06-19 10:20:00+00' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Kolkata' | 'DEFGH7890G' | '456789012345' |
| 'ALMS-2023-567890' | 'Vikram' | 'S' | 'Rathore' | '5432109876' | 'vikram@example.com' | 'Suresh Rathore' | 'Male' | '1975-02-05' | 48 | '202 Valley Road' | 'Jaipur' | 'Rajasthan' | '302001' | 'NEW' | 'RIFLE' | 'Sport Shooting' | 'AI' | '2028-02-05' | false | NULL | false | NULL | 'DISPOSED' | NULL | 'e5f6g7h8-i9j0-1k2l-3m4n-o5p6q7r8s9t0' | NULL | '2023-06-20 09:15:00+00' | '2023-06-22 14:30:00+00' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Jaipur' | 'RSTUV8901H' | '567890123456' |

### Notes
- Added additional fields from the frontend code such as `applicant_middle_name`, `applicant_last_name`, `age`, `city`, `state`, `pincode`
- Changed the primary key from UUID to VARCHAR to match the application ID format (ALMS-YEAR-RANDOM)
- Added fields for `place_of_birth`, `pan_number`, `aadhar_number` and other fields found in the frontend form but not in the original schema
- Status values follow the defined application states: 'FRESH_FORM', 'FORWARDED', 'RETURNED', 'RED_FLAGGED', 'DISPOSED'

## 3. Documents Table

### Schema Definition

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    file_size INT,
    mime_type VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_comments TEXT
);
```

### Sample Data

| id | application_id | name | type | url | uploaded_by | created_at | updated_at | file_size | mime_type | is_verified | verified_by | verified_at | verification_comments |
|----|---------------|------|------|-----|------------|------------|------------|-----------|-----------|-------------|------------|------------|----------------------|
| 'h8i9j0k1-l2m3-4n5o-6p7q-r8s9t0u1v2w3' | 'ALMS-2023-123456' | 'ID_Proof.pdf' | 'ID_PROOF' | '/uploads/ALMS-2023-123456-ID-PROOF-20230610093045.pdf' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-10 09:30:45+00' | '2023-06-10 09:30:45+00' | 2048576 | 'application/pdf' | true | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | '2023-06-10 10:15:30+00' | 'Document verified and valid' |
| 'i9j0k1l2-m3n4-5o6p-7q8r-s9t0u1v2w3x4' | 'ALMS-2023-123456' | 'Address_Proof.pdf' | 'ADDRESS_PROOF' | '/uploads/ALMS-2023-123456-ADDRESS-PROOF-20230610093130.pdf' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-10 09:31:30+00' | '2023-06-10 09:31:30+00' | 1572864 | 'application/pdf' | true | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | '2023-06-10 10:20:15+00' | 'Address verified' |
| 'j0k1l2m3-n4o5-6p7q-8r9s-t0u1v2w3x4y5' | 'ALMS-2023-123456' | 'Photo.jpg' | 'PHOTOGRAPH' | '/uploads/ALMS-2023-123456-PHOTOGRAPH-20230610093215.jpg' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-10 09:32:15+00' | '2023-06-10 09:32:15+00' | 524288 | 'image/jpeg' | true | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | '2023-06-10 10:25:45+00' | 'Photo matches description' |
| 'k1l2m3n4-o5p6-7q8r-9s0t-u1v2w3x4y5z6' | 'ALMS-2023-234567' | 'ID_Proof.pdf' | 'ID_PROOF' | '/uploads/ALMS-2023-234567-ID-PROOF-20230611142045.pdf' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-11 14:20:45+00' | '2023-06-11 14:20:45+00' | 1835008 | 'application/pdf' | true | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | '2023-06-11 15:10:30+00' | 'Document verified' |
| 'l2m3n4o5-p6q7-8r9s-0t1u-v2w3x4y5z6a7' | 'ALMS-2023-234567' | 'Address_Proof.pdf' | 'ADDRESS_PROOF' | '/uploads/ALMS-2023-234567-ADDRESS-PROOF-20230611142130.pdf' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-11 14:21:30+00' | '2023-06-11 14:21:30+00' | 1677721 | 'application/pdf' | true | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | '2023-06-11 15:15:45+00' | 'Address matches records' |
| 'm3n4o5p6-q7r8-9s0t-1u2v-w3x4y5z6a7b8' | 'ALMS-2023-345678' | 'ID_Proof.pdf' | 'ID_PROOF' | '/uploads/ALMS-2023-345678-ID-PROOF-20230615113045.pdf' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-15 11:30:45+00' | '2023-06-15 11:30:45+00' | 1966080 | 'application/pdf' | false | NULL | NULL | NULL |
| 'n4o5p6q7-r8s9-0t1u-2v3w-x4y5z6a7b8c9' | 'ALMS-2023-456789' | 'Character_Certificate.pdf' | 'CHARACTER_CERT' | '/uploads/ALMS-2023-456789-CHARACTER-CERT-20230618164545.pdf' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-18 16:45:45+00' | '2023-06-18 16:45:45+00' | 1310720 | 'application/pdf' | false | NULL | NULL | NULL |
| 'o5p6q7r8-s9t0-1u2v-3w4x-y5z6a7b8c9d0' | 'ALMS-2023-567890' | 'Training_Certificate.pdf' | 'TRAINING_CERT' | '/uploads/ALMS-2023-567890-TRAINING-CERT-20230620092545.pdf' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '2023-06-20 09:25:45+00' | '2023-06-20 09:25:45+00' | 2228224 | 'application/pdf' | true | 'e5f6g7h8-i9j0-1k2l-3m4n-o5p6q7r8s9t0' | '2023-06-20 14:30:15+00' | 'Training certificate verified with issuing authority' |

### Notes
- Added additional fields for document management: `file_size`, `mime_type`, `is_verified`, `verified_by`, `verified_at`, and `verification_comments`
- Document types include ID_PROOF, ADDRESS_PROOF, PHOTOGRAPH, CHARACTER_CERT, TRAINING_CERT, and others as needed
- Changed the `application_id` foreign key type to VARCHAR to match the applications table
- All documents have a verification status to track document validation

## 4. Application History Table

### Schema Definition

```sql
CREATE TABLE application_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by UUID REFERENCES users(id),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    forwarded_to UUID REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    additional_data JSONB
);
```

### Sample Data

| id | application_id | action | performed_by | comments | created_at | old_status | new_status | forwarded_to | ip_address | user_agent |
|----|---------------|--------|--------------|----------|------------|------------|------------|--------------|------------|------------|
| 'p6q7r8s9-t0u1-2v3w-4x5y-z6a7b8c9d0e1' | 'ALMS-2023-123456' | 'CREATE' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Application created' | '2023-06-10 09:30:00+00' | NULL | 'FRESH_FORM' | NULL | '192.168.1.100' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' |
| 'q7r8s9t0-u1v2-3w4x-5y6z-a7b8c9d0e1f2' | 'ALMS-2023-123456' | 'UPLOAD_DOCUMENT' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Uploaded ID proof document' | '2023-06-10 09:30:45+00' | 'FRESH_FORM' | 'FRESH_FORM' | NULL | '192.168.1.100' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' |
| 'r8s9t0u1-v2w3-4x5y-6z7a-b8c9d0e1f2g3' | 'ALMS-2023-123456' | 'UPLOAD_DOCUMENT' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Uploaded address proof document' | '2023-06-10 09:31:30+00' | 'FRESH_FORM' | 'FRESH_FORM' | NULL | '192.168.1.100' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' |
| 's9t0u1v2-w3x4-5y6z-7a8b-c9d0e1f2g3h4' | 'ALMS-2023-123456' | 'UPLOAD_DOCUMENT' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Uploaded photograph' | '2023-06-10 09:32:15+00' | 'FRESH_FORM' | 'FRESH_FORM' | NULL | '192.168.1.100' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' |
| 't0u1v2w3-x4y5-6z7a-8b9c-d0e1f2g3h4i5' | 'ALMS-2023-123456' | 'VERIFY_DOCUMENT' | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | 'ID proof verified' | '2023-06-10 10:15:30+00' | 'FRESH_FORM' | 'FRESH_FORM' | NULL | '192.168.1.101' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' |
| 'u1v2w3x4-y5z6-7a8b-9c0d-e1f2g3h4i5j6' | 'ALMS-2023-123456' | 'FORWARD' | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | 'Application forwarded to ACP' | '2023-06-10 14:45:00+00' | 'FRESH_FORM' | 'FORWARDED' | 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | '192.168.1.101' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' |
| 'v2w3x4y5-z6a7-8b9c-0d1e-f2g3h4i5j6k7' | 'ALMS-2023-234567' | 'CREATE' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | 'Application created' | '2023-06-11 14:20:00+00' | NULL | 'FRESH_FORM' | NULL | '192.168.1.102' | 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' |
| 'w3x4y5z6-a7b8-9c0d-1e2f-g3h4i5j6k7l8' | 'ALMS-2023-234567' | 'FORWARD' | 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7' | 'Application forwarded to ACP after initial review' | '2023-06-12 10:15:00+00' | 'FRESH_FORM' | 'FORWARDED' | 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | '192.168.1.101' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' |
| 'x4y5z6a7-b8c9-0d1e-2f3g-h4i5j6k7l8m9' | 'ALMS-2023-345678' | 'RED_FLAG' | 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | 'Red flagged due to suspicious documents' | '2023-06-16 09:45:00+00' | 'FORWARDED' | 'RED_FLAGGED' | 'c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8' | '192.168.1.103' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' |
| 'y5z6a7b8-c9d0-1e2f-3g4h-i5j6k7l8m9n0' | 'ALMS-2023-456789' | 'RETURN' | 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9' | 'Returned for additional documentation' | '2023-06-19 10:20:00+00' | 'FORWARDED' | 'RETURNED' | 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' | '192.168.1.103' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' |
| 'z6a7b8c9-d0e1-2f3g-4h5i-j6k7l8m9n0o1' | 'ALMS-2023-567890' | 'APPROVE' | 'f6g7h8i9-j0k1-2l3m-4n5o-p6q7r8s9t0u1' | 'Application approved' | '2023-06-22 14:30:00+00' | 'FORWARDED' | 'DISPOSED' | NULL | '192.168.1.104' | 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15' |

### Notes
- Added additional fields for tracking: `old_status`, `new_status`, `ip_address`, `user_agent`, and `additional_data` (as JSONB)
- The `action` field includes values like CREATE, UPLOAD_DOCUMENT, VERIFY_DOCUMENT, FORWARD, RED_FLAG, RETURN, APPROVE, etc.
- Changed the `application_id` foreign key type to VARCHAR to match the applications table
- Added `forwarded_to` to track the recipient of forwarded applications

## 5. Roles Table

### Schema Definition

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    -- level INTEGER NOT NULL, -- Hierarchy level of the role (1 being the highest)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    can_create_application BOOLEAN DEFAULT false,
    can_approve_application BOOLEAN DEFAULT false,
    can_reject_application BOOLEAN DEFAULT false,
    can_forward_application BOOLEAN DEFAULT false,
    can_return_application BOOLEAN DEFAULT false,
    can_red_flag_application BOOLEAN DEFAULT false
);
```

### Sample Data

| id | code | name | description | level | is_active | created_at | updated_at | can_create_application | can_approve_application | can_reject_application | can_forward_application | can_return_application | can_red_flag_application |
|----|------|------|-------------|-------|-----------|------------|------------|------------------------|-------------------------|------------------------|-------------------------|------------------------|--------------------------|
| 'a7b8c9d0-e1f2-3g4h-5i6j-k7l8m9n0o1p2' | 'ADMIN' | 'System Administrator' | 'Full administrative control over the system' | 1 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | false | false | false |
| 'b8c9d0e1-f2g3-4h5i-6j7k-l8m9n0o1p2q3' | 'CP' | 'Commissioner of Police' | 'Final approval authority for AI licenses' | 2 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | true | true | false | true | true |
| 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | 'DCP' | 'Deputy Commissioner of Police' | 'Authority for TA license approval' | 3 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | true | true | true | true | true |
| 'd0e1f2g3-h4i5-6j7k-8l9m-n0o1p2q3r4s5' | 'ACP' | 'Assistant Commissioner of Police' | 'Reviews and forwards applications' | 4 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | true | true | true | true |
| 'e1f2g3h4-i5j6-7k8l-9m0n-o1p2q3r4s5t6' | 'SHO' | 'Station House Officer' | 'Conducts field enquiries on applications' | 5 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | true | false | true |
| 'f2g3h4i5-j6k7-8l9m-0n1o-p2q3r4s5t6u7' | 'ZS' | 'Zonal Superintendent' | 'Initial processor of applications' | 6 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | true | true | true |
| 'g3h4i5j6-k7l8-9m0n-1o2p-q3r4s5t6u7v8' | 'APPLICANT' | 'Citizen Applicant' | 'Citizen who applies for a license' | 7 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true | false | false | false | false | false |
| 'h4i5j6k7-l8m9-0n1o-2p3q-r4s5t6u7v8w9' | 'AS' | 'Arms Superintendent' | 'Handles administrative processing' | 5 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | true | false | true |
| 'i5j6k7l8-m9n0-1o2p-3q4r-s5t6u7v8w9x0' | 'ADO' | 'Administrative Officer' | 'Processes documentation' | 6 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | true | false | false |
| 'j6k7l8m9-n0o1-2p3q-4r5s-t6u7v8w9x0y1' | 'CADO' | 'Chief Administrative Officer' | 'Final administrative check' | 5 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | true | false | true |
| 'k7l8m9n0-o1p2-3q4r-5s6t-u7v8w9x0y1z2' | 'JTCP' | 'Joint Commissioner of Police' | 'Reviews and forwards to CP' | 3 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | true | false | true |
| 'l8m9n0o1-p2q3-4r5s-6t7u-v8w9x0y1z2a3' | 'ARMS_SUPDT' | 'Arms Superintendent' | 'Verifies application details' | 5 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | true | false | true |
| 'm9n0o1p2-q3r4-5s6t-7u8v-w9x0y1z2a3b4' | 'ARMS_SEAT' | 'Arms Seat' | 'Processes application documentation' | 6 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | false | false | false | false | false |
| 'n0o1p2q3-r4s5-6t7u-8v9w-x0y1z2a3b4c5' | 'ACO' | 'Assistant Compliance Officer' | 'Ensures compliance with regulations' | 5 | true | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | false | true | true | true | true | true |

### Notes
- Added boolean fields to directly represent capabilities: `can_create_application`, `can_approve_application`, etc.
- The `level` field represents the role hierarchy, with 1 being the highest (ADMIN) and 7 being the lowest (APPLICANT)
- All roles from the requirements document are included with appropriate descriptions and capabilities

## 6. Permissions Table

### Schema Definition

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- View, Action, Admin, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### Sample Data

| id | code | name | description | category | created_at | updated_at | is_active |
|----|------|------|-------------|----------|------------|------------|-----------|
| 'o1p2q3r4-s5t6-7u8v-9w0x-y1z2a3b4c5d6' | 'VIEW_FRESH_FORM' | 'View Fresh Form Applications' | 'Permission to view applications in FRESH_FORM status' | 'VIEW' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'p2q3r4s5-t6u7-8v9w-0x1y-z2a3b4c5d6e7' | 'VIEW_FORWARDED' | 'View Forwarded Applications' | 'Permission to view applications in FORWARDED status' | 'VIEW' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'q3r4s5t6-u7v8-9w0x-1y2z-a3b4c5d6e7f8' | 'VIEW_RETURNED' | 'View Returned Applications' | 'Permission to view applications in RETURNED status' | 'VIEW' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'r4s5t6u7-v8w9-0x1y-2z3a-b4c5d6e7f8g9' | 'VIEW_RED_FLAGGED' | 'View Red Flagged Applications' | 'Permission to view applications in RED_FLAGGED status' | 'VIEW' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 's5t6u7v8-w9x0-1y2z-3a4b-c5d6e7f8g9h0' | 'VIEW_DISPOSED' | 'View Disposed Applications' | 'Permission to view applications in DISPOSED status' | 'VIEW' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 't6u7v8w9-x0y1-2z3a-4b5c-d6e7f8g9h0i1' | 'VIEW_SENT' | 'View Sent Applications' | 'Permission to view sent applications' | 'VIEW' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'u7v8w9x0-y1z2-3a4b-5c6d-e7f8g9h0i1j2' | 'VIEW_FINAL_DISPOSAL' | 'View Final Disposal' | 'Permission to view finally disposed applications' | 'VIEW' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'v8w9x0y1-z2a3-4b5c-6d7e-f8g9h0i1j2k3' | 'VIEW_REPORTS' | 'View Reports' | 'Permission to view application reports' | 'VIEW' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'w9x0y1z2-a3b4-5c6d-7e8f-g9h0i1j2k3l4' | 'SUBMIT_APPLICATION' | 'Submit Application' | 'Permission to create and submit new license applications' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'x0y1z2a3-b4c5-6d7e-8f9g-h0i1j2k3l4m5' | 'CAPTURE_BIOMETRICS' | 'Capture UIN and Biometrics' | 'Permission to record identification information' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'y1z2a3b4-c5d6-7e8f-9g0h-i1j2k3l4m5n6' | 'UPLOAD_DOCUMENTS' | 'Upload Documents' | 'Permission to attach required documentation' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'z2a3b4c5-d6e7-8f9g-0h1i-j2k3l4m5n6o7' | 'FORWARD_APPLICATION' | 'Forward Application' | 'Permission to send to next authority in workflow' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'a3b4c5d6-e7f8-9g0h-1i2j-k3l4m5n6o7p8' | 'CONDUCT_ENQUIRY' | 'Conduct Enquiry' | 'Permission to perform field verification' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'b4c5d6e7-f8g9-0h1i-2j3k-l4m5n6o7p8q9' | 'ADD_REMARKS' | 'Add Remarks' | 'Permission to add comments to application' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'c5d6e7f8-g9h0-1i2j-3k4l-m5n6o7p8q9r0' | 'APPROVE_TA' | 'Approve Transport Authority License' | 'Permission to approve TA license' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'd6e7f8g9-h0i1-2j3k-4l5m-n6o7p8q9r0s1' | 'APPROVE_AI' | 'Approve Arms Import License' | 'Permission to approve AI license' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'e7f8g9h0-i1j2-3k4l-5m6n-o7p8q9r0s1t2' | 'REJECT' | 'Reject Application' | 'Permission to decline application with reason' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'f8g9h0i1-j2k3-4l5m-6n7o-p8q9r0s1t2u3' | 'REQUEST_RESUBMISSION' | 'Request Resubmission' | 'Permission to return to applicant for correction' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'g9h0i1j2-k3l4-5m6n-7o8p-q9r0s1t2u3v4' | 'GENERATE_PDF' | 'Generate PDF' | 'Permission to create official documentation' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'h0i1j2k3-l4m5-6n7o-8p9q-r0s1t2u3v4w5' | 'RED_FLAG' | 'Red Flag Application' | 'Permission to mark application for special attention' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'i1j2k3l4-m5n6-7o8p-9q0r-s1t2u3v4w5x6' | 'DISPOSE_APPLICATION' | 'Dispose Application' | 'Permission to finalize application processing' | 'ACTION' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'j2k3l4m5-n6o7-8p9q-0r1s-t2u3v4w5x6y7' | 'MANAGE_USERS' | 'Manage Users' | 'Permission to create, update, and delete users' | 'ADMIN' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'k3l4m5n6-o7p8-9q0r-1s2t-u3v4w5x6y7z8' | 'MANAGE_ROLES' | 'Manage Roles' | 'Permission to manage roles and permissions' | 'ADMIN' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |
| 'l4m5n6o7-p8q9-0r1s-2t3u-v4w5x6y7z8a9' | 'VIEW_AUDIT_LOGS' | 'View Audit Logs' | 'Permission to view system audit logs' | 'ADMIN' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | true |

### Notes
- Permissions are categorized as VIEW, ACTION, or ADMIN
- VIEW permissions control what sections of the application users can access
- ACTION permissions control what operations users can perform
- ADMIN permissions are for system administration tasks
- Each permission has a unique code that can be referenced in the application code

## 7. Role Permissions Table

### Schema Definition

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(role_id, permission_id)
);
```

### Sample Data

| id | role_id | permission_id | created_at | updated_at | created_by |
|----|---------|---------------|------------|------------|------------|
| 'm5n6o7p8-q9r0-1s2t-3u4v-w5x6y7z8a9b0' | 'a7b8c9d0-e1f2-3g4h-5i6j-k7l8m9n0o1p2' | 'j2k3l4m5-n6o7-8p9q-0r1s-t2u3v4w5x6y7' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'n6o7p8q9-r0s1-2t3u-4v5w-x6y7z8a9b0c1' | 'a7b8c9d0-e1f2-3g4h-5i6j-k7l8m9n0o1p2' | 'k3l4m5n6-o7p8-9q0r-1s2t-u3v4w5x6y7z8' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'o7p8q9r0-s1t2-3u4v-5w6x-y7z8a9b0c1d2' | 'a7b8c9d0-e1f2-3g4h-5i6j-k7l8m9n0o1p2' | 'l4m5n6o7-p8q9-0r1s-2t3u-v4w5x6y7z8a9' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'p8q9r0s1-t2u3-4v5w-6x7y-z8a9b0c1d2e3' | 'b8c9d0e1-f2g3-4h5i-6j7k-l8m9n0o1p2q3' | 'p2q3r4s5-t6u7-8v9w-0x1y-z2a3b4c5d6e7' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'q9r0s1t2-u3v4-5w6x-7y8z-a9b0c1d2e3f4' | 'b8c9d0e1-f2g3-4h5i-6j7k-l8m9n0o1p2q3' | 's5t6u7v8-w9x0-1y2z-3a4b-c5d6e7f8g9h0' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'r0s1t2u3-v4w5-6x7y-8z9a-b0c1d2e3f4g5' | 'b8c9d0e1-f2g3-4h5i-6j7k-l8m9n0o1p2q3' | 'd6e7f8g9-h0i1-2j3k-4l5m-n6o7p8q9r0s1' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 's1t2u3v4-w5x6-7y8z-9a0b-c1d2e3f4g5h6' | 'g3h4i5j6-k7l8-9m0n-1o2p-q3r4s5t6u7v8' | 'w9x0y1z2-a3b4-5c6d-7e8f-g9h0i1j2k3l4' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 't2u3v4w5-x6y7-8z9a-0b1c-d2e3f4g5h6i7' | 'g3h4i5j6-k7l8-9m0n-1o2p-q3r4s5t6u7v8' | 'q3r4s5t6-u7v8-9w0x-1y2z-a3b4c5d6e7f8' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'u3v4w5x6-y7z8-9a0b-1c2d-e3f4g5h6i7j8' | 'g3h4i5j6-k7l8-9m0n-1o2p-q3r4s5t6u7v8' | 't6u7v8w9-x0y1-2z3a-4b5c-d6e7f8g9h0i1' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'v4w5x6y7-z8a9-0b1c-2d3e-f4g5h6i7j8k9' | 'f2g3h4i5-j6k7-8l9m-0n1o-p2q3r4s5t6u7' | 'o1p2q3r4-s5t6-7u8v-9w0x-y1z2a3b4c5d6' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'w5x6y7z8-a9b0-1c2d-3e4f-g5h6i7j8k9l0' | 'f2g3h4i5-j6k7-8l9m-0n1o-p2q3r4s5t6u7' | 'p2q3r4s5-t6u7-8v9w-0x1y-z2a3b4c5d6e7' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'x6y7z8a9-b0c1-2d3e-4f5g-h6i7j8k9l0m1' | 'f2g3h4i5-j6k7-8l9m-0n1o-p2q3r4s5t6u7' | 'x0y1z2a3-b4c5-6d7e-8f9g-h0i1j2k3l4m5' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'y7z8a9b0-c1d2-3e4f-5g6h-i7j8k9l0m1n2' | 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | 'c5d6e7f8-g9h0-1i2j-3k4l-m5n6o7p8q9r0' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'z8a9b0c1-d2e3-4f5g-6h7i-j8k9l0m1n2o3' | 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | 'e7f8g9h0-i1j2-3k4l-5m6n-o7p8q9r0s1t2' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |
| 'a9b0c1d2-e3f4-5g6h-7i8j-k9l0m1n2o3p4' | 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | 'z2a3b4c5-d6e7-8f9g-0h1i-j2k3l4m5n6o7' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL |

### Notes
- This table establishes many-to-many relationships between roles and permissions
- Added `created_by` to track who assigned permissions to roles
- Each role is assigned multiple permissions based on the role permissions matrix
- The sample data shows examples of permissions assigned to different roles, but the full mapping would include many more rows

## 8. Role Hierarchy Table

### Schema Definition

```sql
CREATE TABLE role_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    to_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    is_default_path BOOLEAN DEFAULT false,
    requires_comments BOOLEAN DEFAULT true,
    UNIQUE(from_role_id, to_role_id)
);
```

### Sample Data

| id | from_role_id | to_role_id | created_at | updated_at | created_by | is_default_path | requires_comments |
|----|--------------|------------|------------|------------|------------|-----------------|-------------------|
| 'b0c1d2e3-f4g5-6h7i-8j9k-l0m1n2o3p4q5' | 'g3h4i5j6-k7l8-9m0n-1o2p-q3r4s5t6u7v8' | 'f2g3h4i5-j6k7-8l9m-0n1o-p2q3r4s5t6u7' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | false |
| 'c1d2e3f4-g5h6-7i8j-9k0l-m1n2o3p4q5r6' | 'f2g3h4i5-j6k7-8l9m-0n1o-p2q3r4s5t6u7' | 'd0e1f2g3-h4i5-6j7k-8l9m-n0o1p2q3r4s5' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | true |
| 'd2e3f4g5-h6i7-8j9k-0l1m-n2o3p4q5r6s7' | 'f2g3h4i5-j6k7-8l9m-0n1o-p2q3r4s5t6u7' | 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | false | true |
| 'e3f4g5h6-i7j8-9k0l-1m2n-o3p4q5r6s7t8' | 'd0e1f2g3-h4i5-6j7k-8l9m-n0o1p2q3r4s5' | 'e1f2g3h4-i5j6-7k8l-9m0n-o1p2q3r4s5t6' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | true |
| 'f4g5h6i7-j8k9-0l1m-2n3o-p4q5r6s7t8u9' | 'd0e1f2g3-h4i5-6j7k-8l9m-n0o1p2q3r4s5' | 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | false | true |
| 'g5h6i7j8-k9l0-1m2n-3o4p-q5r6s7t8u9v0' | 'e1f2g3h4-i5j6-7k8l-9m0n-o1p2q3r4s5t6' | 'd0e1f2g3-h4i5-6j7k-8l9m-n0o1p2q3r4s5' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | true |
| 'h6i7j8k9-l0m1-2n3o-4p5q-r6s7t8u9v0w1' | 'd0e1f2g3-h4i5-6j7k-8l9m-n0o1p2q3r4s5' | 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | true |
| 'i7j8k9l0-m1n2-3o4p-5q6r-s7t8u9v0w1x2' | 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | 'h4i5j6k7-l8m9-0n1o-2p3q-r4s5t6u7v8w9' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | false | true |
| 'j8k9l0m1-n2o3-4p5q-6r7s-t8u9v0w1x2y3' | 'c9d0e1f2-g3h4-5i6j-7k8l-m9n0o1p2q3r4' | 'b8c9d0e1-f2g3-4h5i-6j7k-l8m9n0o1p2q3' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | false | true |
| 'k9l0m1n2-o3p4-5q6r-7s8t-u9v0w1x2y3z4' | 'h4i5j6k7-l8m9-0n1o-2p3q-r4s5t6u7v8w9' | 'i5j6k7l8-m9n0-1o2p-3q4r-s5t6u7v8w9x0' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | true |
| 'l0m1n2o3-p4q5-6r7s-8t9u-v0w1x2y3z4a5' | 'i5j6k7l8-m9n0-1o2p-3q4r-s5t6u7v8w9x0' | 'j6k7l8m9-n0o1-2p3q-4r5s-t6u7v8w9x0y1' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | true |
| 'm1n2o3p4-q5r6-7s8t-9u0v-w1x2y3z4a5b6' | 'j6k7l8m9-n0o1-2p3q-4r5s-t6u7v8w9x0y1' | 'k7l8m9n0-o1p2-3q4r-5s6t-u7v8w9x0y1z2' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | true |
| 'n2o3p4q5-r6s7-8t9u-0v1w-x2y3z4a5b6c7' | 'k7l8m9n0-o1p2-3q4r-5s6t-u7v8w9x0y1z2' | 'b8c9d0e1-f2g3-4h5i-6j7k-l8m9n0o1p2q3' | '2023-01-01 00:00:00+00' | '2023-01-01 00:00:00+00' | NULL | true | true |

### Notes
- Added fields to enhance workflow: `is_default_path` and `requires_comments`
- `is_default_path` indicates the preferred/default forwarding path
- `requires_comments` indicates whether comments are mandatory when forwarding
- The table represents the forwarding hierarchy as described in the requirements document
- This table is crucial for the application workflow as it defines valid paths for application movement

## 9. Additional Tables

In addition to the core tables above, the following tables would also be needed to fully implement the system requirements:

### 9.1 RefreshToken Table

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_ip VARCHAR(45),
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE
);
```

### 9.2 TokenBlacklist Table

```sql
CREATE TABLE token_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    blacklisted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(100)
);
```

### 9.3 AuditLog Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 9.4 Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100)
);
```

### 9.5 Settings Table

```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    data_type VARCHAR(20) NOT NULL, -- string, number, boolean, json
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT false,
    is_visible_to_users BOOLEAN DEFAULT true
);
```

### 9.6 RoleAction Table

```sql
CREATE TABLE role_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(role, action, resource)
);
```

### 9.7 BiometricData Table

```sql
CREATE TABLE biometric_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    fingerprint_data BYTEA,
    iris_data BYTEA,
    photo_data BYTEA,
    signature_data BYTEA,
    captured_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE
);
```
