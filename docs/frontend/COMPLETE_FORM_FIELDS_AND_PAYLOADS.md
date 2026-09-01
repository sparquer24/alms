# Complete Form Fields and Expected Payloads - All Tabs

## 📋 Table of Contents
1. [Personal Information](#1-personal-information)
2. [Address Details](#2-address-details)
3. [Occupation Details](#3-occupation-details)
4. [Criminal History](#4-criminal-history)
5. [License History](#5-license-history)
6. [License Details](#6-license-details)

---

## 1. Personal Information

### Form Section: `personal`
### Route: `/forms/createFreshApplication/personal-info`

### 📝 Form Fields (Frontend)

| # | Field Name | Input Type | Form State Key | Required | Validation |
|---|------------|------------|----------------|----------|------------|
| - | Alice Acknowledgement Number | text | `acknowledgementNo` | ❌ | Optional, unique |
| 1 | Applicant First Name | text | `firstName` | ✅ | Required |
| 1 | Applicant Middle Name | text | `middleName` | ❌ | Optional |
| 1 | Applicant Last Name | text | `lastName` | ✅ | Required |
| - | Application filled by | text | `filledBy` | ❌ | Optional (Zonal Superintendent) |
| 2 | Parent/Spouse Name | text | `parentOrSpouseName` | ✅ | Required |
| 3 | Sex | radio | `sex` | ✅ | Required (Male/Female) |
| 4 | Place of Birth (Nativity) | text | `placeOfBirth` | ❌ | Optional |
| 5 | Date of Birth | date | `dateOfBirth` | ❌ | Must be 21+ years |
| 6 | PAN | text | `panNumber` | ❌ | Optional (10 chars) |
| 7 | Aadhar Number | text | `aadharNumber` | ❌ | Optional (12 digits) |
| - | Date of Birth in Words | text | `dobInWords` | ❌ | Optional |

**Total Fields:** 12

### 🎯 Expected PATCH API Payload

```typescript
{
  // Optional acknowledgement number
  "acknowledgementNo": "ALMS1696050000000",
  
  // Required fields
  "firstName": "XYZ",
  "middleName": "K",  // Optional
  "lastName": "Sharma",
  "parentOrSpouseName": "Ramesh Sharma",
  
  // Who filled the application
  "filledBy": "Self",  // Optional
  
  // Enum: MALE or FEMALE (uppercase)
  "sex": "MALE",
  
  // Optional fields
  "placeOfBirth": "Kolkata",
  "dateOfBirth": "1990-05-10T00:00:00.000Z",  // ISO date string
  "dobInWords": "Tenth May Nineteen Ninety",
  
  // Numeric strings
  "aadharNumber": "123456789012",  // 12 digits
  "panNumber": "ABCDE1234F"  // 10 characters
}
```

### ⚠️ Important Notes
- `sex` must be uppercase: `"MALE"` or `"FEMALE"` (not "Male"/"Female")
- `dateOfBirth` must be valid ISO date string
- Age validation: Must be 21+ years on application date
- Current frontend sends: `"Male"` ❌ → Should send: `"MALE"` ✅

---

## 2. Address Details

### Form Section: `address`
### Route: `/forms/createFreshApplication/address-details`

### 📝 Form Fields (Frontend)

| # | Field Name | Input Type | Form State Key | Required | Notes |
|---|------------|------------|----------------|----------|-------|
| 8 | Present Address | textarea | `presentAddress` | ✅ | Address line |
| 8 | Present State | dropdown | `presentState` | ✅ | State ID |
| 8 | Present District | dropdown | `presentDistrict` | ✅ | District ID |
| 8 | Present Zone | dropdown | `presentZone` | ✅ | Zone ID |
| 8 | Present Division | dropdown | `presentDivision` | ✅ | Division ID |
| 8 | Present Police Station | dropdown | `presentPoliceStation` | ✅ | Police Station ID |
| 8 | Since when residing | date | `presentSince` | ✅ | Date |
| - | Same as present | checkbox | `sameAsPresent` | ❌ | Copy present to permanent |
| 9 | Permanent Address | textarea | `permanentAddress` | ✅ | Address line |
| 9 | Permanent State | dropdown | `permanentState` | ✅ | State ID |
| 9 | Permanent District | dropdown | `permanentDistrict` | ✅ | District ID |
| 9 | Permanent Zone | dropdown | `permanentZone` | ✅ | Zone ID |
| 9 | Permanent Division | dropdown | `permanentDivision` | ✅ | Division ID |
| 9 | Permanent Police Station | dropdown | `permanentPoliceStation` | ✅ | Police Station ID |
| - | Telephone Office | text | `telOffice` | ❌ | Optional |
| - | Telephone Residence | text | `telResidence` | ❌ | Optional |
| - | Mobile Office | text | `mobOffice` | ❌ | Optional |
| - | Mobile Alternative | text | `mobAlternative` | ❌ | Optional |

**Total Fields:** 18

### 🎯 Expected PATCH API Payload

```typescript
{
  "presentAddress": {
    "addressLine": "123 Main Street, Block A",
    "stateId": 1,
    "districtId": 1,
    "zoneId": 1,
    "divisionId": 1,
    "policeStationId": 1,
    "sinceResiding": "2020-01-15T00:00:00.000Z"  // ISO date
  },
  "permanentAddress": {
    "addressLine": "456 Park Avenue, Block B",
    "stateId": 2,
    "districtId": 2,
    "zoneId": 2,
    "divisionId": 2,
    "policeStationId": 2
  },
  // Optional contact details
  "telephoneOffice": "033-12345678",
  "telephoneResidence": "033-87654321",
  "mobileOffice": "9876543210",
  "mobileAlternative": "9876543211"
}
```

### ⚠️ Important Notes
- Both `presentAddress` and `permanentAddress` are nested objects
- All location fields must be numeric IDs (not names)
- `sinceResiding` must be valid ISO date string
- `sameAsPresent` is UI-only, copies present → permanent

---

## 3. Occupation Details

### Form Section: `occupation`
### Route: `/forms/createFreshApplication/occupation-details`

### 📝 Form Fields (Frontend)

| # | Field Name | Input Type | Form State Key | Required | Type |
|---|------------|------------|----------------|----------|------|
| - | Occupation | text | `occupation` | ✅ | string |
| - | Employer Name | text | `employerName` | ❌ | string |
| - | Business Details | text | `businessDetails` | ❌ | string |
| - | Annual Income | number | `annualIncome` | ✅ | number |
| - | Work Experience (Years) | number | `workExperience` | ❌ | number |
| - | Business Type | text | `businessType` | ❌ | string |

**Total Fields:** 6

### 🎯 Expected PATCH API Payload

**⚠️ MISMATCH DETECTED:** Frontend fields don't match backend DTO!

#### Frontend Sends:
```typescript
{
  "occupation": "Software Engineer",
  "employerName": "Tech Corp",
  "businessDetails": "Software Development",
  "annualIncome": "500000",
  "workExperience": "5",
  "businessType": "IT Services"
}
```

#### Backend Expects (PatchOccupationBusinessDto):
```typescript
{
  "occupation": "Software Engineer",  // ✅ Matches
  "officeAddress": "456 Corporate Plaza, IT Park",  // ❌ MISSING in frontend
  "stateId": 1,  // ❌ MISSING in frontend
  "districtId": 1,  // ❌ MISSING in frontend
  "cropLocation": "Village ABC",  // ❌ MISSING in frontend (optional)
  "areaUnderCultivation": 5.5  // ❌ MISSING in frontend (optional)
}
```

### 🚨 Issues Found
1. ❌ Frontend has `employerName` → Backend doesn't expect it
2. ❌ Frontend has `businessDetails` → Backend doesn't expect it
3. ❌ Frontend has `annualIncome` → Backend doesn't expect it
4. ❌ Frontend has `workExperience` → Backend doesn't expect it
5. ❌ Frontend has `businessType` → Backend doesn't expect it
6. ❌ Frontend missing `officeAddress` (required)
7. ❌ Frontend missing `stateId` (required)
8. ❌ Frontend missing `districtId` (required)
9. ❌ Frontend missing `cropLocation` (optional for farmers)
10. ❌ Frontend missing `areaUnderCultivation` (optional for farmers)

### ✅ Correct Expected Payload
```typescript
{
  "occupation": "Software Engineer",
  "officeAddress": "456 Corporate Plaza, IT Park",
  "stateId": 1,
  "districtId": 1,
  "cropLocation": "Village ABC, Block XYZ",  // Optional
  "areaUnderCultivation": 5.5  // Optional, in acres
}
```

---

## 4. Criminal History

### Form Section: `criminal`
### Route: `/forms/createFreshApplication/criminal-history`

### 📝 Form Fields (Frontend)

| Question | Field Name | Input Type | Form State | Required | Default |
|----------|-----------|------------|------------|----------|---------|
| 13(a) | Convicted | radio | `convicted` | ✅ | "no" |
| 13(a).i | FIR Number | text | `provisions[].firNumber` | Conditional | - |
| 13(a).i | Under Section | text | `provisions[].underSection` | Conditional | - |
| 13(a).i | Police Station | text | `provisions[].policeStation` | Conditional | - |
| 13(a).i | Unit | text | `provisions[].unit` | Conditional | - |
| 13(a).i | District | text | `provisions[].district` | Conditional | - |
| 13(a).i | State | text | `provisions[].state` | Conditional | - |
| 13(a).i | Offence | text | `provisions[].offence` | Conditional | - |
| 13(a).i | Sentence | text | `provisions[].sentence` | Conditional | - |
| 13(a).i | Date of Sentence | date | `provisions[].dateOfSentence` | Conditional | - |
| 13(b) | Bond Executed | radio | `bond` | ✅ | "no" |
| 13(b) | Date of Sentence | date | `bondDetails.dateOfSentence` | Conditional | - |
| 13(b) | Period | text | `bondDetails.period` | Conditional | - |
| 13(c) | Prohibited | radio | `prohibited` | ✅ | "no" |
| 13(c) | Date of Sentence | date | `prohibitedDetails.dateOfSentence` | Conditional | - |
| 13(c) | Period | text | `prohibitedDetails.period` | Conditional | - |

**Total Fields:** 16 fields

### 🎯 Expected PATCH API Payload

```typescript
{
  "criminalHistories": [
    {
      // (a) Convicted - Boolean (not "yes"/"no" string)
      "isConvicted": false,  // Default false
      "convictionDetails": undefined,  // Only if isConvicted = true
      
      // If isConvicted = true, convictionDetails contains:
      // JSON.stringify([{
      //   firNumber: "FIR123",
      //   underSection: "Section 302",
      //   policeStation: "Kolkata PS",
      //   unit: "Unit 1",
      //   district: "Kolkata",
      //   state: "West Bengal",
      //   offence: "Theft",
      //   sentence: "2 years imprisonment",
      //   dateOfSentence: "2018-05-15"
      // }])
      
      // (b) Bond Executed - Boolean
      "isBondExecuted": false,  // Default false
      "bondDetails": undefined,  // Only if isBondExecuted = true
      
      // If isBondExecuted = true, bondDetails contains:
      // JSON.stringify({
      //   dateOfSentence: "2019-03-20",
      //   period: "6 months"
      // })
      
      // (c) Prohibited - Boolean
      "isProhibited": false,  // Default false
      "prohibitionDetails": undefined  // Only if isProhibited = true
      
      // If isProhibited = true, prohibitionDetails contains:
      // JSON.stringify({
      //   dateOfSentence: "2020-07-10",
      //   period: "5 years"
      // })
    }
  ]
}
```

### ✅ Example with "Yes" Selections

```typescript
{
  "criminalHistories": [
    {
      "isConvicted": true,
      "convictionDetails": "[{\"firNumber\":\"FIR123\",\"underSection\":\"Section 302\",\"policeStation\":\"Kolkata PS\",\"unit\":\"Unit 1\",\"district\":\"Kolkata\",\"state\":\"West Bengal\",\"offence\":\"Theft\",\"sentence\":\"2 years\",\"dateOfSentence\":\"2018-05-15\"}]",
      "isBondExecuted": true,
      "bondDetails": "{\"dateOfSentence\":\"2019-03-20\",\"period\":\"6 months\"}",
      "isProhibited": false,
      "prohibitionDetails": undefined
    }
  ]
}
```

### ⚠️ Important Notes
- Boolean fields default to `false` (not `null` or `undefined`)
- Details are JSON stringified objects/arrays
- Details only sent when corresponding boolean is `true`
- Array of objects (can have multiple provisions for convicted)

---

## 5. License History

### Form Section: `license-history`
### Route: `/forms/createFreshApplication/license-history`

### 📝 Form Fields (Frontend)

| Question | Field Name | Input Type | Form State | Required | Default |
|----------|-----------|------------|------------|----------|---------|
| 14(a) | Applied Before | radio | `appliedBefore` | ✅ | "no" |
| 14(a) | Date | date | `appliedDetails.date` | Conditional | - |
| 14(a) | Authority | text | `appliedDetails.authority` | Conditional | - |
| 14(a) | Result | text | `appliedDetails.result` | Conditional | - |
| 14(a) | Status | dropdown | `appliedDetails.status` | Conditional | - |
| 14(a) | Rejection Doc | file | `rejectedFile` | Conditional | - |
| 14(b) | Suspended | radio | `suspended` | ✅ | "no" |
| 14(b) | Authority | text | `suspendedDetails.authority` | Conditional | - |
| 14(b) | Reason | text | `suspendedDetails.reason` | Conditional | - |
| 14(c) | Family License | radio | `family` | ✅ | "no" |
| 14(c) | Name | text | `familyDetails[].name` | Conditional | - |
| 14(c) | License Number | text | `familyDetails[].licenseNumber` | Conditional | - |
| 14(c) | Weapons | dropdown[] | `familyDetails[].weapons[]` | Conditional | [0] |
| 14(d) | Safe Place | radio | `safePlace` | ✅ | "no" |
| 14(d) | Details | textarea | `safePlaceDetails` | Conditional | - |
| 14(e) | Training | radio | `training` | ✅ | "no" |
| 14(e) | Details | textarea | `trainingDetails` | Conditional | - |

**Total Fields:** 17 fields (plus dynamic weapon/family arrays)

### 🎯 Expected PATCH API Payload

```typescript
{
  "licenseHistories": [
    {
      // (a) Applied before - Boolean
      "hasAppliedBefore": false,  // Default false
      "applicationDetails": undefined,  // Only if hasAppliedBefore = true
      
      // If hasAppliedBefore = true, applicationDetails contains:
      // JSON.stringify({
      //   date: "2019-06-15",
      //   authority: "District Magistrate, Kolkata",
      //   result: "Approved",
      //   status: "approved"
      // })
      
      // (b) Suspended - Boolean
      "hasLicenceSuspended": false,  // Default false
      "suspensionDetails": undefined,  // Only if hasLicenceSuspended = true
      
      // If hasLicenceSuspended = true, suspensionDetails contains:
      // JSON.stringify({
      //   authority: "District Magistrate, Mumbai",
      //   reason: "Violation of terms"
      // })
      
      // (c) Family License - Boolean
      "hasFamilyLicence": false,  // Default false
      "familyLicenceDetails": undefined,  // Only if hasFamilyLicence = true
      
      // If hasFamilyLicence = true, familyLicenceDetails contains:
      // JSON.stringify([{
      //   name: "John Doe",
      //   licenseNumber: "LIC123456",
      //   weapons: [1, 2, 3]  // Array of weapon IDs
      // }])
      
      // (d) Safe Place - Boolean
      "hasSafePlace": false,  // Default false
      "safePlaceDetails": undefined,  // Only if hasSafePlace = true
      // If true: "Steel almirah with double lock"
      
      // (e) Training - Boolean
      "hasTraining": false,  // Default false
      "trainingDetails": undefined  // Only if hasTraining = true
      // If true: "Basic firearms training, Certificate: ABC123"
    }
  ]
}
```

### ✅ Example with "Yes" Selections

```typescript
{
  "licenseHistories": [
    {
      "hasAppliedBefore": true,
      "applicationDetails": "{\"date\":\"2019-06-15\",\"authority\":\"DM Kolkata\",\"result\":\"Approved\",\"status\":\"approved\"}",
      "hasLicenceSuspended": false,
      "suspensionDetails": undefined,
      "hasFamilyLicence": true,
      "familyLicenceDetails": "[{\"name\":\"John Doe\",\"licenseNumber\":\"LIC123\",\"weapons\":[1,2]}]",
      "hasSafePlace": true,
      "safePlaceDetails": "Steel almirah with double lock in bedroom",
      "hasTraining": false,
      "trainingDetails": undefined
    }
  ]
}
```

### ⚠️ Important Notes
- Boolean fields default to `false`
- `applicationDetails`, `suspensionDetails`, `familyLicenceDetails` are JSON strings
- `safePlaceDetails` and `trainingDetails` are plain strings (not JSON)
- `familyDetails` is an array (can have multiple family members)
- Weapon IDs are integers (not names)

---

## 6. License Details

### Form Section: `license-details`
### Route: `/forms/createFreshApplication/license-details`

### 📝 Form Fields (Frontend)

| # | Field Name | Input Type | Form State Key | Required | Type |
|---|------------|------------|----------------|----------|------|
| 15 | Need for License | dropdown | `needForLicense` | ✅ | enum |
| 16(a) | Arms Category | radio | `armsOption` | ✅ | enum |
| 16(b) | Weapon Type | dropdown | `weaponId` | ✅ | number |
| 16(b) | Arms Type | text | `armsType` | ❌ | string (auto-filled) |
| 17 | Area District | checkbox | `areaDistrict` | ❌ | boolean |
| 17 | Area State | checkbox | `areaState` | ❌ | boolean |
| 17 | Area India | checkbox | `areaIndia` | ❌ | boolean |
| 18 | Special Claims | textarea | `specialClaims` | ❌ | string |
| 18 | Claims Evidence | file | `specialClaimsEvidence` | ❌ | file |

**Total Fields:** 9 fields

### 🎯 Expected PATCH API Payload

```typescript
{
  "licenseDetails": [
    {
      // 15. Need for License - ENUM (uppercase)
      "needForLicense": "SPORTS",  // SELF_PROTECTION | SPORTS | HEIRLOOM_POLICY
      
      // 16(a). Arms Category - ENUM (uppercase)
      "armsCategory": "PERMISSIBLE",  // RESTRICTED | PERMISSIBLE
      
      // 16(b). Requested Weapons - Array of weapon IDs
      "requestedWeaponIds": [3],  // Array of integers
      
      // 17. Area of Validity - Comma-separated string
      "areaOfValidity": "DISTRICT, STATE",  // DISTRICT | STATE | INDIA
      
      // 18. Special Consideration (optional fields)
      "ammunitionDescription": undefined,  // ❌ MISSING in frontend
      "specialConsiderationReason": "Crop protection from wild animals",
      "licencePlaceArea": undefined,  // ❌ MISSING in frontend
      "wildBeastsSpecification": undefined  // ❌ MISSING in frontend
    }
  ]
}
```

### ✅ Complete Example

```typescript
{
  "licenseDetails": [
    {
      "needForLicense": "SELF_PROTECTION",
      "armsCategory": "RESTRICTED",
      "requestedWeaponIds": [1, 2],
      "areaOfValidity": "DISTRICT, STATE, INDIA",
      "ammunitionDescription": "100 rounds of .22 caliber",
      "specialConsiderationReason": "Personal protection due to threats",
      "licencePlaceArea": "Urban areas of Kolkata district",
      "wildBeastsSpecification": "Wild boars, deer as per Wildlife Act"
    }
  ]
}
```

### 🚨 Issues Found
1. ❌ Frontend missing `ammunitionDescription` field
2. ❌ Frontend missing `licencePlaceArea` field
3. ❌ Frontend missing `wildBeastsSpecification` field
4. ❌ Frontend has `specialClaims` → Should be `specialConsiderationReason`
5. ❌ Frontend has `specialClaimsEvidence` → File upload not handled in payload

### ⚠️ Enum Values Reference

#### LicensePurpose
```typescript
enum LicensePurpose {
  SELF_PROTECTION,
  SPORTS,
  HEIRLOOM_POLICY
}
```

#### ArmsCategory
```typescript
enum ArmsCategory {
  RESTRICTED,
  PERMISSIBLE
}
```

#### AreaOfUse
```typescript
enum AreaOfUse {
  DISTRICT,
  STATE,
  INDIA
}
```

---

## 📊 Summary of Issues

### ✅ Working Correctly
1. **Personal Information** - Minor issue: sex should be uppercase
2. **Address Details** - ✅ Perfect match
3. **Criminal History** - ✅ Perfect match
4. **License History** - ✅ Perfect match

### 🚨 Critical Issues

#### Occupation Details (HIGH PRIORITY)
- **Frontend:** 6 fields (`occupation`, `employerName`, `businessDetails`, `annualIncome`, `workExperience`, `businessType`)
- **Backend:** 6 fields (`occupation`, `officeAddress`, `stateId`, `districtId`, `cropLocation`, `areaUnderCultivation`)
- **Match:** ❌ Only `occupation` matches
- **Action:** Complete frontend rewrite needed

#### License Details (MEDIUM PRIORITY)
- **Missing Fields:** 3 (`ammunitionDescription`, `licencePlaceArea`, `wildBeastsSpecification`)
- **Enum Issues:** ✅ Fixed (was using wrong enum values)
- **Action:** Add missing form fields

#### Personal Information (LOW PRIORITY)
- **Issue:** Sex enum sent as "Male"/"Female" instead of "MALE"/"FEMALE"
- **Action:** Simple transformation fix needed

---

## 🎯 Action Items

### Immediate Fixes Required

1. **Occupation Details Form** ⚠️ CRITICAL
   ```typescript
   // Remove these fields:
   - employerName
   - businessDetails
   - annualIncome
   - workExperience
   - businessType
   
   // Add these fields:
   + officeAddress (text, required)
   + stateId (dropdown, required)
   + districtId (dropdown, required)
   + cropLocation (text, optional for farmers)
   + areaUnderCultivation (number, optional for farmers)
   ```

2. **License Details Form** ⚠️ MEDIUM
   ```typescript
   // Add these optional fields:
   + ammunitionDescription (text)
   + licencePlaceArea (text)
   + wildBeastsSpecification (text)
   ```

3. **Personal Information** ⚠️ LOW
   ```typescript
   // Transform sex value before sending:
   sex: form.sex.toUpperCase()  // "Male" → "MALE"
   ```

---

## 📝 Field Count Summary

| Tab | Frontend Fields | Backend Fields | Match | Status |
|-----|----------------|----------------|-------|--------|
| Personal Information | 12 | 12 | ✅ 100% | Minor transform needed |
| Address Details | 18 | 18 | ✅ 100% | Perfect |
| Occupation Details | 6 | 6 | ❌ 16% | Complete mismatch |
| Criminal History | 16 | 6 booleans + details | ✅ 100% | Perfect |
| License History | 17 | 10 booleans + details | ✅ 100% | Perfect |
| License Details | 9 | 8 + missing 3 | ⚠️ 75% | Missing fields |
| **TOTAL** | **78** | **68** | **82%** | **Needs fixes** |

---

**Document Created:** October 13, 2025  
**Last Updated:** October 13, 2025  
**Status:** 🔴 Issues Identified - Action Required
