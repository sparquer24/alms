# 🎯 Quick Reference - Form Components API Integration

## ✅ Integration Status

| Component | GET | PATCH | Previous | Next | Status |
|-----------|-----|-------|----------|------|--------|
| PersonalInformation | ✅ | ✅ | ❌ First | ✅ AddressDetails | ✅ |
| AddressDetails | ✅ | ✅ | ✅ PersonalInfo | ✅ OccupationBusiness | ✅ |
| OccupationBusiness | ✅ | ✅ | ✅ AddressDetails | ✅ CriminalHistory | ✅ |
| **CriminalHistory** | ✅ | ✅ | ✅ OccupationBusiness | ✅ LicenseHistory | ✅ **NEW** |
| **LicenseHistory** | ✅ | ✅ | ✅ CriminalHistory | ✅ LicenseDetails | ✅ **NEW** |
| **LicenseDetails** | ✅ | ✅ | ✅ LicenseHistory | ✅ BiometricInfo | ✅ **NEW** |

---

## 🔄 Standard Pattern (All Components Follow This)

```typescript
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

const Component = () => {
  const {
    form,              // Form state
    setForm,           // Update form state
    applicantId,       // Application ID
    isLoading,         // Loading from GET
    isSubmitting,      // Saving via PATCH
    submitError,       // Error message
    submitSuccess,     // Success message
    saveFormData,      // Call PATCH API
    navigateToNext,    // Navigate with ID
    loadExistingData,  // Call GET API
  } = useApplicationForm({
    initialState,
    formSection: 'section-name',
  });

  const handleSaveToDraft = async () => {
    await saveFormData();
  };

  const handleNext = async () => {
    const savedId = await saveFormData();
    if (savedId) {
      navigateToNext(FORM_ROUTES.NEXT_STEP, savedId);
    }
  };

  const handlePrevious = async () => {
    if (applicantId) {
      await loadExistingData(applicantId);
      navigateToNext(FORM_ROUTES.PREVIOUS_STEP, applicantId);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <form>
      {applicantId && <ApplicationIdDisplay />}
      {submitSuccess && <SuccessMessage />}
      {submitError && <ErrorMessage />}
      
      {/* Form fields */}
      
      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={isSubmitting}
      />
    </form>
  );
};
```

---

## 📝 Component-Specific Details

### CriminalHistory
```typescript
formSection: 'criminal'
Data: { criminalHistories: Array }
Previous: OCCUPATION_DETAILS
Next: LICENSE_HISTORY
```

### LicenseHistory
```typescript
formSection: 'license-history'
Data: { licenseHistories: Array }
Previous: CRIMINAL_HISTORY
Next: LICENSE_DETAILS
```

### LicenseDetails
```typescript
formSection: 'license-details'
Data: { needForLicense, armsOption, weaponId, ... }
Previous: LICENSE_HISTORY
Next: BIOMETRIC_INFO
```

---

## 🧪 Quick Test Commands

### Test CriminalHistory:
```
Navigate: /forms/createFreshApplication/criminal-history?id=14
Check: Console logs "Loaded criminal histories"
Action: Add provision, fill fields, click Next
Verify: Navigates to license-history with same ID
```

### Test LicenseHistory:
```
Navigate: /forms/createFreshApplication/license-history?id=14
Check: Console logs "Loaded license histories"
Action: Select yes/no options, click Next
Verify: Navigates to license-details with same ID
```

### Test LicenseDetails:
```
Navigate: /forms/createFreshApplication/license-details?id=14
Check: Form loads, weapon dropdown populated
Action: Select weapon, check areas, click Next
Verify: Navigates to biometric-information with same ID
```

---

## 🐛 Debug Checklist

If component not working:

1. ✅ Check browser console for errors
2. ✅ Verify `useApplicationForm` hook imported
3. ✅ Verify `FORM_ROUTES` imported
4. ✅ Check Network tab for GET/PATCH requests
5. ✅ Verify form section name matches backend
6. ✅ Check `applicationService.ts` has section in `extractSectionData`
7. ✅ Check `applicationService.ts` has section in `preparePayload`

---

**Last Updated:** October 13, 2025
