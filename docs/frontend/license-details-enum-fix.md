# License Details Enum Value Fix

## 🐛 Issue

**Error:** `Invalid value for argument needForLicense. Expected LicensePurpose`

The form was sending lowercase/incorrect enum values that didn't match the backend Prisma schema expectations.

---

## 🔍 Root Cause Analysis

### Sent Payload (Incorrect)
```json
{
  "needForLicense": "sports",           // ❌ lowercase
  "armsCategory": "NON_PROHIBITED",      // ❌ doesn't exist in schema
  "requestedWeaponIds": [3],
  "areaOfValidity": "DISTRICT"
}
```

### Backend Schema Enums
```prisma
enum LicensePurpose {
  SELF_PROTECTION
  SPORTS
  HEIRLOOM_POLICY
}

enum ArmsCategory {
  RESTRICTED
  PERMISSIBLE
}

enum AreaOfUse {
  DISTRICT
  STATE
  INDIA
}
```

### The Mismatches
1. ❌ `"needForLicense": "sports"` → Should be `"SPORTS"` (uppercase)
2. ❌ `"armsCategory": "NON_PROHIBITED"` → Should be `"RESTRICTED"` or `"PERMISSIBLE"`
3. ❌ Form dropdown values were lowercase: `"self-protection"`, `"sports"`, `"heirloom"`
4. ❌ Radio button values were lowercase: `"restricted"`, `"permissible"`
5. ❌ Payload mapping was incorrect: `restricted` → `PROHIBITED`, `permissible` → `NON_PROHIBITED`

---

## ✅ Fixes Applied

### 1. LicenseDetails.tsx - Need for License Dropdown

**Before:**
```tsx
<option value="self-protection">Self-Protection</option>
<option value="sports">Sports</option>
<option value="heirloom">Heirloom Policy</option>
```

**After:**
```tsx
<option value="SELF_PROTECTION">Self-Protection</option>
<option value="SPORTS">Sports</option>
<option value="HEIRLOOM_POLICY">Heirloom Policy</option>
```

✅ Now sends: `"needForLicense": "SPORTS"` (matches `LicensePurpose` enum)

---

### 2. LicenseDetails.tsx - Arms Category Radio Buttons

**Before:**
```tsx
<input type="radio" name="armsOption" value="restricted" 
       checked={form.armsOption === 'restricted'} /> Restricted
<input type="radio" name="armsOption" value="permissible" 
       checked={form.armsOption === 'permissible'} /> Permissible
```

**After:**
```tsx
<input type="radio" name="armsOption" value="RESTRICTED" 
       checked={form.armsOption === 'RESTRICTED'} /> Restricted
<input type="radio" name="armsOption" value="PERMISSIBLE" 
       checked={form.armsOption === 'PERMISSIBLE'} /> Permissible
```

✅ Now sends: `"armsCategory": "RESTRICTED"` or `"PERMISSIBLE"` (matches `ArmsCategory` enum)

---

### 3. applicationService.ts - Payload Mapping

**Before:**
```typescript
armsCategory: formData.armsOption === 'restricted' ? 'PROHIBITED' : 'NON_PROHIBITED',
```

**After:**
```typescript
armsCategory: formData.armsOption || undefined,
```

✅ Now passes the enum value directly without incorrect mapping

---

## 📊 Correct Payload Structure

### Expected Payload (After Fix)
```json
{
  "needForLicense": "SPORTS",              // ✅ Uppercase enum value
  "armsCategory": "RESTRICTED",             // ✅ Correct enum: RESTRICTED or PERMISSIBLE
  "requestedWeaponIds": [3],
  "areaOfValidity": "DISTRICT, STATE"       // ✅ Comma-separated string
}
```

### Complete Example
```json
{
  "needForLicense": "CROP_PROTECTION",
  "armsCategory": "PERMISSIBLE",
  "requestedWeaponIds": [4, 5],
  "areaOfValidity": "DISTRICT",
  "ammunitionDescription": "100 rounds of .22 caliber ammunition",
  "specialConsiderationReason": "Crop protection from wild animals",
  "licencePlaceArea": "Rural agricultural areas of district",
  "wildBeastsSpecification": "Wild boars, deer, and other crop-damaging animals"
}
```

---

## 🎯 Enum Reference

### LicensePurpose
| Display Text | Form Value | Backend Enum |
|--------------|------------|--------------|
| Self-Protection | `SELF_PROTECTION` | `SELF_PROTECTION` |
| Sports | `SPORTS` | `SPORTS` |
| Heirloom Policy | `HEIRLOOM_POLICY` | `HEIRLOOM_POLICY` |

### ArmsCategory
| Display Text | Form Value | Backend Enum |
|--------------|------------|--------------|
| Restricted | `RESTRICTED` | `RESTRICTED` |
| Permissible | `PERMISSIBLE` | `PERMISSIBLE` |

### AreaOfUse
| Display Text | Form Value | Backend Enum |
|--------------|------------|--------------|
| District | `DISTRICT` | `DISTRICT` |
| State | `STATE` | `STATE` |
| Throughout India | `INDIA` | `INDIA` |

---

## 🧪 Testing Scenarios

### Test 1: SPORTS + RESTRICTED
```json
Form Input:
- Need: "Sports" → SPORTS
- Arms: "Restricted" → RESTRICTED
- Weapon: Rifle (ID: 3)
- Area: District ✓

Expected Payload:
{
  "needForLicense": "SPORTS",
  "armsCategory": "RESTRICTED",
  "requestedWeaponIds": [3],
  "areaOfValidity": "DISTRICT"
}
```

### Test 2: SELF_PROTECTION + PERMISSIBLE
```json
Form Input:
- Need: "Self-Protection" → SELF_PROTECTION
- Arms: "Permissible" → PERMISSIBLE
- Weapon: Pistol (ID: 2)
- Area: District ✓, State ✓

Expected Payload:
{
  "needForLicense": "SELF_PROTECTION",
  "armsCategory": "PERMISSIBLE",
  "requestedWeaponIds": [2],
  "areaOfValidity": "DISTRICT, STATE"
}
```

### Test 3: HEIRLOOM_POLICY
```json
Form Input:
- Need: "Heirloom Policy" → HEIRLOOM_POLICY
- Arms: "Permissible" → PERMISSIBLE
- Weapon: Revolver (ID: 1)
- Area: Throughout India ✓

Expected Payload:
{
  "needForLicense": "HEIRLOOM_POLICY",
  "armsCategory": "PERMISSIBLE",
  "requestedWeaponIds": [1],
  "areaOfValidity": "INDIA"
}
```

---

## ⚠️ Important Notes

### DO NOT Use These Values (They Don't Exist in Schema)
❌ `PROHIBITED`  
❌ `NON_PROHIBITED`  
❌ `CROP_PROTECTION` (not in LicensePurpose enum - use SELF_PROTECTION instead)

### Valid Values Only
✅ LicensePurpose: `SELF_PROTECTION`, `SPORTS`, `HEIRLOOM_POLICY`  
✅ ArmsCategory: `RESTRICTED`, `PERMISSIBLE`  
✅ AreaOfUse: `DISTRICT`, `STATE`, `INDIA`

---

## 📝 Summary of Changes

| File | Change | Status |
|------|--------|--------|
| `LicenseDetails.tsx` | Updated needForLicense dropdown values to uppercase enum | ✅ Fixed |
| `LicenseDetails.tsx` | Updated armsOption radio button values to match ArmsCategory enum | ✅ Fixed |
| `applicationService.ts` | Removed incorrect PROHIBITED/NON_PROHIBITED mapping | ✅ Fixed |
| `applicationService.ts` | Pass armsOption value directly to API | ✅ Fixed |

---

## 🎉 Result

**Before:** ❌ `Invalid value for argument needForLicense. Expected LicensePurpose`

**After:** ✅ Payload validates successfully against Prisma schema

All enum values now match the backend schema exactly:
- ✅ `needForLicense` → `SPORTS`, `SELF_PROTECTION`, `HEIRLOOM_POLICY`
- ✅ `armsCategory` → `RESTRICTED`, `PERMISSIBLE`
- ✅ `areaOfValidity` → `"DISTRICT"`, `"STATE"`, `"INDIA"`, or combinations

---

**Status:** ✅ Complete  
**Date:** October 13, 2025  
**Impact:** License Details form enum validation
