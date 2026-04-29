'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../elements/Input';
import { TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import FormFooter from '../elements/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';

interface LicenseDetailsData {
  needForLicense: string;
  armsCategory: string;
  requestedWeaponIds: number[];
  areaOfValidity: string;
  ammunitionDescription: string;
  specialConsiderationReason: string;
  licencePlaceArea: string;
  wildBeastsSpecification: string;
}

const initialState: LicenseDetailsData = {
  needForLicense: '',
  armsCategory: '',
  requestedWeaponIds: [],
  areaOfValidity: '',
  ammunitionDescription: '',
  specialConsiderationReason: '',
  licencePlaceArea: '',
  wildBeastsSpecification: '',
};

// Removed mockPrefill. Only real API data will be used.

const weaponsList = [
  { id: 1, name: 'Revolver' },
  { id: 2, name: 'Pistol' },
  { id: 3, name: 'Rifle' },
  { id: 4, name: 'Shotgun' },
  { id: 5, name: 'Airgun' },
];

const LicenseDetailsRenewal: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicantId = searchParams?.get('id') || searchParams?.get('applicantId');

  const { state, updateFormData, setIsSubmitting, setSubmitError, setSubmitSuccess } = useRenewalForm();
  const [form, setForm] = useState<LicenseDetailsData>(initialState);

  useEffect(() => {
    const fetchData = async () => {
      if (applicantId) {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
          // Try to get from context first
          const contextData = state.formData.licenseDetails;
          if (contextData && Array.isArray(contextData.licenseDetails) && contextData.licenseDetails.length > 0) {
            setForm(prev => ({ ...prev, ...contextData.licenseDetails[0] }));
            setSubmitSuccess('License details loaded');
            setTimeout(() => setSubmitSuccess(null), 3000);
          } else if (contextData && Object.keys(contextData).length > 0) {
            setForm(prev => ({ ...prev, ...contextData }));
            setSubmitSuccess('License details loaded');
            setTimeout(() => setSubmitSuccess(null), 3000);
          } else {
            // Otherwise, fetch from API
            const { FormDataLoader } = await import('../../../utils/formDataLoader');
            const data = await FormDataLoader.loadAllSections(applicantId);
            if (data.licenseDetails && Array.isArray(data.licenseDetails.licenseDetails) && data.licenseDetails.licenseDetails.length > 0) {
              setForm(prev => ({ ...prev, ...data.licenseDetails.licenseDetails[0] }));
              updateFormData('licenseDetails', data.licenseDetails);
              setSubmitSuccess('License details loaded');
              setTimeout(() => setSubmitSuccess(null), 3000);
            } else if (data.licenseDetails && Object.keys(data.licenseDetails).length > 0) {
              setForm(prev => ({ ...prev, ...data.licenseDetails }));
              updateFormData('licenseDetails', data.licenseDetails);
              setSubmitSuccess('License details loaded');
              setTimeout(() => setSubmitSuccess(null), 3000);
            }
          }
        } catch (err: any) {
          setSubmitError('Failed to load license details.');
        } finally {
          setIsSubmitting(false);
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleWeaponChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const weaponId = Number(e.target.value);
    if (weaponId === 0) return;

    setForm(prev => {
      const currentWeapons = prev.requestedWeaponIds || [];
      const updatedWeapons = currentWeapons.includes(weaponId)
        ? currentWeapons.filter(id => id !== weaponId)
        : [...currentWeapons, weaponId];
      return { ...prev, requestedWeaponIds: updatedWeapons };
    });
  };

  const handleAreaChange = (area: string, checked: boolean) => {
    setForm(prev => {
      const currentAreas = prev.areaOfValidity ? prev.areaOfValidity.split(', ').filter(Boolean) : [];
      const updatedAreas = checked
        ? [...currentAreas.filter(a => a !== area), area]
        : currentAreas.filter(a => a !== area);
      return { ...prev, areaOfValidity: updatedAreas.join(', ') };
    });
  };

  const handleSaveToDraft = () => {
    setIsSubmitting(true);
    updateFormData('licenseDetails', form);
    setSubmitSuccess('Saved to draft');
    setTimeout(() => setSubmitSuccess(null), 3000);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    updateFormData('licenseDetails', form);
    const nextRoute = getNextRenewalRoute('/forms/renewal/license-details');
    router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  const handlePrevious = () => {
    const prevRoute = getPreviousRenewalRoute('/forms/renewal/license-details');
    router.push(`${prevRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  return (
    <form className="p-6">
      <h2 className="text-xl font-bold mb-4">License Details</h2>

      {state.submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{state.submitSuccess}</div>
      )}
      {state.submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{state.submitError}</div>
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* Left column */}
        <div className="flex flex-col gap-8">
          {/* 15. Need for license */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              15. Need for license (see note 1 below)
            </label>
            <select
              name="needForLicense"
              value={form.needForLicense}
              onChange={handleChange}
              className="border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:ring-0 w-full py-2 bg-transparent"
            >
              <option value="">Select reason</option>
              <option value="SELF_PROTECTION">Self-Protection</option>
              <option value="SPORTS">Sports</option>
              <option value="HEIRLOOM_POLICY">Heirloom Policy</option>
            </select>
          </div>

          {/* 16. Description of arms */}
          <div className="mb-4">
            <div className="font-medium mb-2">16. Description of arms for which license is being sought</div>
            <div className="mb-2">(a) Select any of the options</div>
            <div className="flex gap-6 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="armsCategory"
                  value="RESTRICTED"
                  checked={form.armsCategory === 'RESTRICTED'}
                  onChange={handleChange}
                /> Restricted
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="armsCategory"
                  value="PERMISSIBLE"
                  checked={form.armsCategory === 'PERMISSIBLE'}
                  onChange={handleChange}
                /> Permissible
              </label>
            </div>
            <div className="mb-2">(b) Select weapon types (multiple allowed)</div>
            <select
              name="weaponSelection"
              value={0}
              onChange={handleWeaponChange}
              className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
            >
              <option value={0}>Select weapon type to add</option>
              {weaponsList.map(weapon => (
                <option key={weapon.id} value={weapon.id}>{weapon.name}</option>
              ))}
            </select>
            {form.requestedWeaponIds?.length > 0 && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-1">Selected Weapons:</div>
                <div className="flex flex-wrap gap-2">
                  {form.requestedWeaponIds.map(weaponId => {
                    const weapon = weaponsList.find(w => w.id === weaponId);
                    return weapon ? (
                      <span
                        key={weaponId}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {weapon.name}
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            requestedWeaponIds: prev.requestedWeaponIds.filter(id => id !== weaponId)
                          }))}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-8">
          {/* 17. Areas within which applicant wishes to carry arms */}
          <div className="mb-4">
            <div className="font-medium mb-1">17. Areas within which applicant wishes to carry arms</div>
            <div className="text-xs text-gray-600 mb-1">Tick any of the options</div>
            <div className="flex gap-6">
              <Checkbox
                label="District"
                name="areaDistrict"
                checked={form.areaOfValidity?.includes('District-wide') || false}
                onChange={checked => handleAreaChange('District-wide', checked)}
              />
              <Checkbox
                label="State"
                name="areaState"
                checked={form.areaOfValidity?.includes('State-wide') || false}
                onChange={checked => handleAreaChange('State-wide', checked)}
              />
              <Checkbox
                label="Throughout India"
                name="areaIndia"
                checked={form.areaOfValidity?.includes('Throughout India') || false}
                onChange={checked => handleAreaChange('Throughout India', checked)}
              />
            </div>
          </div>

          {/* Ammunition Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ammunition Description</label>
            <input
              type="text"
              name="ammunitionDescription"
              value={form.ammunitionDescription}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g., 50 rounds of .32 ammunition"
            />
          </div>

          {/* 18. Claims for special consideration */}
          <div className="mb-4">
            <label className="block font-medium mb-1">18. Claims for special consideration for obtaining the licence, if any</label>
            <span className="block italic text-xs text-gray-500 mb-2">(attach documentary evidence)</span>
            <textarea
              name="specialConsiderationReason"
              value={form.specialConsiderationReason}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={2}
              placeholder="Enter your claim (if any)"
            />
          </div>

          {/* 19. Details for an application for license in Form IV */}
          <div className="mb-4">
            <div className="font-medium mb-3">19. Details for an application for license in Form IV</div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                (a) Place or area for which the licence is sought
              </label>
              <input
                type="text"
                name="licencePlaceArea"
                value={form.licencePlaceArea}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter place or area"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                (b) Specification of the wild beasts which are permitted to be destroyed as per the permit granted under the Wild life (Protection) Act, 1972 (53 of 1972) to the applicant
              </label>
              <textarea
                name="wildBeastsSpecification"
                value={form.wildBeastsSpecification}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
                placeholder="Enter specification of wild beasts permitted to be destroyed"
              />
            </div>
          </div>
        </div>
      </div>

      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={state.isSubmitting}
      />
    </form>
  );
};

export default LicenseDetailsRenewal;