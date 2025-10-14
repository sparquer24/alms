# ✅ PATCH API Payload Structures - Complete Reference

## 📋 Backend Expected Payload Format

**Date:** October 13, 2025  
**Status:** ✅ All payloads updated to match backend requirements

---

## 🎯 Complete PATCH Request Structure

### API Endpoint
```
PATCH /application-form/:applicationId
```

### Complete Payload Example
```json
{
  "presentAddress": { ... },
  "permanentAddress": { ... },
  "occupationAndBusiness": { ... },
  "criminalHistories": [ ... ],
  "licenseHistories": [ ... ],
  "licenseDetails": [ ... ]
}
```

**Note:** All fields are **optional**. Send only the sections you want to update.

---

## 1️⃣ Address Details

### Frontend Form Fields → Backend Payload

```typescript
// Frontend form state
{
  presentAddress: string,
  presentState: string (ID as string),
  presentDistrict: string (ID as string),
  presentZone: string (ID as string),
  presentDivision: string (ID as string),
  presentPoliceStation: string (ID as string),
  presentSince: string (date),
  telOffice: string,
  telResidence: string,
  mobOffice: string,
  mobAlternative: string,
  // Same for permanent...
}
```

**Transformed to:**

```json
{
  "presentAddress": {
    "addressLine": "123 Main Street, Block A, Flat 4B",
    "stateId": 1,
    "districtId": 1,
    "policeStationId": 1,
    "zoneId": 1,
    "divisionId": 1,
    "sinceResiding": "2020-01-15T00:00:00.000Z",
    "telephoneOffice": "033-12345678",
    "officeMobileNumber": "9876543210",
    "alternativeMobile": "9876543211"
  },
  "permanentAddress": {
    "addressLine": "456 Village Road, House No. 12",
    "stateId": 1,
    "districtId": 2,
    "policeStationId": 2,
    "zoneId": 2,
    "divisionId": 2,
    "sinceResiding": "1990-05-20T00:00:00.000Z",
    "telephoneOffice": "033-87654321",
    "officeMobileNumber": "9123456789"
  }
}
```

**Transformation Logic:**
- ✅ String IDs → Integer IDs: `parseInt(formData.presentState)`
- ✅ Date strings → ISO format: `new Date(formData.presentSince).toISOString()`
- ✅ Flat fields → Nested objects

---

## 2️⃣ Occupation and Business

### Frontend Form Fields → Backend Payload

```typescript
// Frontend form state
{
  occupation: string,
  officeAddress: string,
  officeState: string (ID as string),
  officeDistrict: string (ID as string),
  cropLocation: string,
  cropArea: string
}
```

**Transformed to:**

```json
{
  "occupationAndBusiness": {
    "occupation": "Business Owner",
    "officeAddress": "789 Business Complex, Commercial Area",
    "stateId": 1,
    "districtId": 1,
    "cropLocation": "Agricultural land in Block DEF",
    "areaUnderCultivation": 10.5
  }
}
```

**Transformation Logic:**
- ✅ String IDs → Integer IDs: `parseInt(formData.officeState)`
- ✅ cropArea string → Float: `parseFloat(formData.cropArea)`

---

## 3️⃣ Criminal History

### Frontend Form State → Backend Payload

```typescript
// Frontend form state
{
  convicted: 'yes' | 'no',
  provisions: Array<{
    firNumber, underSection, policeStation, unit,
    district, state, offence, sentence, dateOfSentence
  }>,
  bond: 'yes' | 'no',
  bondDetails: { dateOfSentence, period },
  prohibited: 'yes' | 'no',
  prohibitedDetails: { dateOfSentence, period }
}
```

**Transformed to:**

```json
{
  "criminalHistories": [
    {
      "isConvicted": false,
      "convictionDetails": "{...JSON stringified provisions array...}",
      "isBondExecuted": false,
      "bondDetails": "{...JSON stringified bond details...}",
      "isProhibited": false,
      "prohibitionDetails": "{...JSON stringified prohibition details...}"
    }
  ]
}
```

**Transformation Logic:**
```typescript
const criminalHistories = [{
  isConvicted: convicted === 'yes',
  convictionDetails: convicted === 'yes' ? JSON.stringify(provisions) : undefined,
  isBondExecuted: bond === 'yes',
  bondDetails: bond === 'yes' ? JSON.stringify(bondDetails) : undefined,
  isProhibited: prohibited === 'yes',
  prohibitionDetails: prohibited === 'yes' ? JSON.stringify(prohibitedDetails) : undefined,
}];
```

**Backend Processing:**
- ✅ Boolean flags indicate if section has data
- ✅ Details stored as JSON strings
- ✅ Always sends array with single object

---

## 4️⃣ License History

### Frontend Form State → Backend Payload

```typescript
// Frontend form state
{
  appliedBefore: 'yes' | 'no',
  appliedDetails: { date, authority, result, status },
  suspended: 'yes' | 'no',
  suspendedDetails: { authority, reason },
  family: 'yes' | 'no',
  familyDetails: Array<{ name, licenseNumber, weapons: number[] }>,
  safePlace: 'yes' | 'no',
  safePlaceDetails: string,
  training: 'yes' | 'no',
  trainingDetails: string
}
```

**Transformed to:**

```json
{
  "licenseHistories": [
    {
      "hasAppliedBefore": false,
      "applicationDetails": "{...JSON stringified...}",
      "hasLicenceSuspended": false,
      "suspensionDetails": "{...JSON stringified...}",
      "hasFamilyLicence": false,
      "familyLicenceDetails": "{...JSON stringified...}",
      "hasSafePlace": true,
      "safePlaceDetails": "Fire-proof steel safe with digital lock",
      "hasTraining": true,
      "trainingDetails": "Professional firearms training from ABC Institute"
    }
  ]
}
```

**Transformation Logic:**
```typescript
const licenseHistories = [{
  hasAppliedBefore: appliedBefore === 'yes',
  applicationDetails: appliedBefore === 'yes' ? JSON.stringify(appliedDetails) : undefined,
  hasLicenceSuspended: suspended === 'yes',
  suspensionDetails: suspended === 'yes' ? JSON.stringify(suspendedDetails) : undefined,
  hasFamilyLicence: family === 'yes',
  familyLicenceDetails: family === 'yes' ? JSON.stringify(familyDetails) : undefined,
  hasSafePlace: safePlace === 'yes',
  safePlaceDetails: safePlace === 'yes' ? safePlaceDetails : undefined,
  hasTraining: training === 'yes',
  trainingDetails: training === 'yes' ? trainingDetails : undefined,
}];
```

**Backend Processing:**
- ✅ Boolean flags indicate if section has data
- ✅ Complex details (application, suspension, family) as JSON strings
- ✅ Simple details (safe place, training) as plain strings
- ✅ Always sends array with single object

---

## 5️⃣ License Details

### Frontend Form State → Backend Payload

```typescript
// Frontend form state
{
  needForLicense: string,
  armsOption: 'restricted' | 'permissible',
  weaponId: number,
  areaDistrict: boolean,
  areaState: boolean,
  areaIndia: boolean,
  ammunitionDescription: string,
  specialClaims: string,
  licencePlaceArea: string,
  wildBeastsSpecification: string
}
```

**Transformed to:**

```json
{
  "licenseDetails": [
    {
      "needForLicense": "CROP_PROTECTION",
      "armsCategory": "NON_PROHIBITED",
      "requestedWeaponIds": [4, 5],
      "areaOfValidity": "DISTRICT, STATE",
      "ammunitionDescription": "100 rounds of .22 caliber ammunition",
      "specialConsiderationReason": "Crop protection from wild animals",
      "licencePlaceArea": "Rural agricultural areas of district",
      "wildBeastsSpecification": "Wild boars, deer, and other crop-damaging animals"
    }
  ]
}
```

**Transformation Logic:**
```typescript
const licenseDetails = [{
  needForLicense: formData.needForLicense || undefined,
  armsCategory: formData.armsOption === 'restricted' ? 'PROHIBITED' : 'NON_PROHIBITED',
  requestedWeaponIds: formData.weaponId ? [formData.weaponId] : [],
  areaOfValidity: [
    formData.areaDistrict && 'DISTRICT',
    formData.areaState && 'STATE',
    formData.areaIndia && 'INDIA'
  ].filter(Boolean).join(', ') || undefined,
  ammunitionDescription: formData.ammunitionDescription || undefined,
  specialConsiderationReason: formData.specialClaims || undefined,
  licencePlaceArea: formData.licencePlaceArea || undefined,
  wildBeastsSpecification: formData.wildBeastsSpecification || undefined,
}];
```

**Backend Processing:**
- ✅ `armsOption` mapped to enum: `restricted` → `PROHIBITED`, `permissible` → `NON_PROHIBITED`
- ✅ Single weapon ID converted to array
- ✅ Area checkboxes combined into comma-separated string
- ✅ Always sends array with single object

---

## 🔄 Data Flow Summary

### Frontend → Backend (PATCH)

```
1. User fills form
   ↓
2. User clicks Next/Save
   ↓
3. Component calls setForm() with local state
   ↓
4. saveFormData() called
   ↓
5. applicationService.preparePayload() transforms data
   ↓
6. PATCH /application-form/:id with transformed payload
   ↓
7. Backend validates and saves
   ↓
8. Success/Error message shown
```

### Backend → Frontend (GET)

```
1. Component mounts with ID in URL
   ↓
2. useApplicationForm calls loadExistingData()
   ↓
3. GET /application-form?applicationId=:id
   ↓
4. applicationService.extractSectionData() parses response
   ↓
5. setForm() updates state with parsed data
   ↓
6. Form fields populated
```

---

## 📝 Implementation Files

### 1. `applicationService.ts`
- **Line 3-65:** `ApplicationFormData` interface with all fields
- **Line 117-165:** `extractSectionData()` - Parse GET response
- **Line 183-290:** `preparePayload()` - Transform for PATCH request

### 2. Component Files
- **CriminalHistory.tsx:** Lines 70-97 - Transformation logic
- **LicenseHistory.tsx:** Lines 146-159 - Transformation logic
- **LicenseDetails.tsx:** Uses form state directly (transformed in service)

---

## ✅ Validation Checklist

Before sending PATCH request:

### Address Details:
- ✅ All IDs converted to integers
- ✅ Dates in ISO format
- ✅ Optional fields handled (undefined, not null)

### Occupation/Business:
- ✅ State/District IDs as integers
- ✅ cropArea as float if present

### Criminal History:
- ✅ Single object in array
- ✅ Boolean flags set correctly
- ✅ Details stringified when present

### License History:
- ✅ Single object in array
- ✅ Boolean flags set correctly
- ✅ safePlaceDetails and trainingDetails as strings
- ✅ Other details stringified

### License Details:
- ✅ Single object in array
- ✅ armsCategory mapped to enum
- ✅ weaponId in array format
- ✅ areaOfValidity combined string

---

## 🧪 Testing Payload Structure

### Test in Browser Console:
```javascript
// After filling form, before clicking Next/Save
console.log('Form state:', form);

// During PATCH request (check Network tab)
console.log('🟢 Final payload:', payload);
```

### Expected Console Logs:
```
🟠 Preparing [section] payload from form data: { ... }
🟢 Final [section] payload: { ... }
```

---

**Status:** ✅ All payloads match backend requirements  
**Last Updated:** October 13, 2025  
**Ready for:** Production deployment
