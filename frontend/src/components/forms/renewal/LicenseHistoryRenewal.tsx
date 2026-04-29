'use client';
import React, { useState, useEffect } from 'react';
import { Input, TextArea } from '../elements/Input';
import FormFooter from '../elements/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';

interface LicenseHistoryData {
  licenseHistories: any[];
}

const initialState: LicenseHistoryData = {
  licenseHistories: [],
};

// Removed mockPrefill. Only real API data will be used.

const LicenseHistoryRenewal: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicantId = searchParams?.get('id') || searchParams?.get('applicantId');

  const {
    state,
    updateFormData,
    setIsSubmitting,
    setSubmitError,
    setSubmitSuccess,
  } = useRenewalForm();

  const [appliedBefore, setAppliedBefore] = useState('no');
  const [appliedDetails, setAppliedDetails] = useState({ date: '', authority: '', result: '' });
  const [suspended, setSuspended] = useState('no');
  const [suspendedDetails, setSuspendedDetails] = useState({ authority: '', reason: '' });
  const [family, setFamily] = useState('no');
  const [familyDetails, setFamilyDetails] = useState([{ name: '', licenseNumber: '', weapons: [0] }]);
  const [safePlace, setSafePlace] = useState('no');
  const [safePlaceDetails, setSafePlaceDetails] = useState('');
  const [training, setTraining] = useState('no');
  const [trainingDetails, setTrainingDetails] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (applicantId) {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
          // Try to get from context first
          const contextData = state.formData.licenseHistory;
          if (contextData && contextData.licenseHistories && contextData.licenseHistories.length > 0) {
            const lh = contextData.licenseHistories[0];
            setAppliedBefore(lh.hasAppliedBefore ? 'yes' : 'no');
            setAppliedDetails({
              date: lh.dateAppliedFor ? new Date(lh.dateAppliedFor).toISOString().split('T')[0] : '',
              authority: lh.previousAuthorityName || '',
              result: lh.previousResult || '',
            });
            setSuspended(lh.hasLicenceSuspended ? 'yes' : 'no');
            setSuspendedDetails({
              authority: lh.suspensionAuthorityName || '',
              reason: lh.suspensionReason || '',
            });
            setFamily(lh.hasFamilyLicence ? 'yes' : 'no');
            setFamilyDetails([{ name: lh.familyMemberName || '', licenseNumber: lh.familyLicenceNumber || '', weapons: lh.familyWeaponsEndorsed || [0] }]);
            setSafePlace(lh.hasSafePlace ? 'yes' : 'no');
            setSafePlaceDetails(lh.safePlaceDetails || '');
            setTraining(lh.hasTraining ? 'yes' : 'no');
            setTrainingDetails(lh.trainingDetails || '');
            setSubmitSuccess('License history data loaded');
            setTimeout(() => setSubmitSuccess(null), 3000);
          } else {
            // Otherwise, fetch from API
            const { FormDataLoader } = await import('../../../utils/formDataLoader');
            const data = await FormDataLoader.loadAllSections(applicantId);
            if (data.licenseHistory && data.licenseHistory.licenseHistories && data.licenseHistory.licenseHistories.length > 0) {
              const lh = data.licenseHistory.licenseHistories[0];
              setAppliedBefore(lh.hasAppliedBefore ? 'yes' : 'no');
              setAppliedDetails({
                date: lh.dateAppliedFor ? new Date(lh.dateAppliedFor).toISOString().split('T')[0] : '',
                authority: lh.previousAuthorityName || '',
                result: lh.previousResult || '',
              });
              setSuspended(lh.hasLicenceSuspended ? 'yes' : 'no');
              setSuspendedDetails({
                authority: lh.suspensionAuthorityName || '',
                reason: lh.suspensionReason || '',
              });
              setFamily(lh.hasFamilyLicence ? 'yes' : 'no');
              setFamilyDetails([{ name: lh.familyMemberName || '', licenseNumber: lh.familyLicenceNumber || '', weapons: lh.familyWeaponsEndorsed || [0] }]);
              setSafePlace(lh.hasSafePlace ? 'yes' : 'no');
              setSafePlaceDetails(lh.safePlaceDetails || '');
              setTraining(lh.hasTraining ? 'yes' : 'no');
              setTrainingDetails(lh.trainingDetails || '');
              updateFormData('licenseHistory', data.licenseHistory);
              setSubmitSuccess('License history data loaded');
              setTimeout(() => setSubmitSuccess(null), 3000);
            }
          }
        } catch (err: any) {
          setSubmitError('Failed to load license history data.');
        } finally {
          setIsSubmitting(false);
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const handleAppliedDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAppliedDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSuspendedDetails = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSuspendedDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleFamilyDetails = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFamilyDetails(prev => prev.map((fam, i) => i === idx ? { ...fam, [name]: value } : fam));
  };

  const removeFamily = (idx: number) => setFamilyDetails(prev => prev.filter((_, i) => i !== idx));

  const handleSaveToDraft = async () => {
    const licenseHistories = [{
      hasAppliedBefore: appliedBefore === 'yes',
      dateAppliedFor: appliedBefore === 'yes' && appliedDetails.date ? new Date(appliedDetails.date).toISOString() : null,
      previousAuthorityName: appliedBefore === 'yes' ? appliedDetails.authority || null : null,
      previousResult: appliedBefore === 'yes' ? appliedDetails.result?.toUpperCase() || null : null,
      hasLicenceSuspended: suspended === 'yes',
      suspensionAuthorityName: suspended === 'yes' ? suspendedDetails.authority || null : null,
      suspensionReason: suspended === 'yes' ? suspendedDetails.reason || null : null,
      hasFamilyLicence: family === 'yes',
      familyMemberName: family === 'yes' && familyDetails.length > 0 ? familyDetails[0].name || null : null,
      familyLicenceNumber: family === 'yes' && familyDetails.length > 0 ? familyDetails[0].licenseNumber || null : null,
      familyWeaponsEndorsed: [],
      hasSafePlace: safePlace === 'yes',
      safePlaceDetails: safePlace === 'yes' ? safePlaceDetails || null : null,
      hasTraining: training === 'yes',
      trainingDetails: training === 'yes' ? trainingDetails || null : null,
    }];

    setIsSubmitting(true);
    updateFormData('licenseHistory', { licenseHistories });
    setSubmitSuccess('Draft saved!');
    setTimeout(() => setSubmitSuccess(null), 3000);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    const licenseHistories = [{
      hasAppliedBefore: appliedBefore === 'yes',
      dateAppliedFor: appliedBefore === 'yes' && appliedDetails.date ? new Date(appliedDetails.date).toISOString() : null,
      previousAuthorityName: appliedBefore === 'yes' ? appliedDetails.authority || null : null,
      previousResult: appliedBefore === 'yes' ? appliedDetails.result?.toUpperCase() || null : null,
      hasLicenceSuspended: suspended === 'yes',
      suspensionAuthorityName: suspended === 'yes' ? suspendedDetails.authority || null : null,
      suspensionReason: suspended === 'yes' ? suspendedDetails.reason || null : null,
      hasFamilyLicence: family === 'yes',
      familyMemberName: family === 'yes' && familyDetails.length > 0 ? familyDetails[0].name || null : null,
      familyLicenceNumber: family === 'yes' && familyDetails.length > 0 ? familyDetails[0].licenseNumber || null : null,
      familyWeaponsEndorsed: [],
      hasSafePlace: safePlace === 'yes',
      safePlaceDetails: safePlace === 'yes' ? safePlaceDetails || null : null,
      hasTraining: training === 'yes',
      trainingDetails: training === 'yes' ? trainingDetails || null : null,
    }];

    updateFormData('licenseHistory', { licenseHistories });
    const nextRoute = getNextRenewalRoute('/forms/renewal/license-history');
    router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  const handlePrevious = () => {
    const prevRoute = getPreviousRenewalRoute('/forms/renewal/license-history');
    router.push(`${prevRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };


  return (
    <form className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">License History</h2>
        <p className="text-sm text-gray-600">Step 5 of 10 - Renewal Application</p>
      </div>
      {applicantId && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
          <div className="flex flex-col">
            <strong>Application ID: {applicantId}</strong>
          </div>
          <button
            type="button"
            onClick={async () => {
              setIsSubmitting(true);
              setSubmitError(null);
              try {
                const { FormDataLoader } = await import('../../../utils/formDataLoader');
                const data = await FormDataLoader.loadAllSections(applicantId);
                if (data.licenseHistory && data.licenseHistory.licenseHistories && data.licenseHistory.licenseHistories.length > 0) {
                  const lh = data.licenseHistory.licenseHistories[0];
                  setAppliedBefore(lh.hasAppliedBefore ? 'yes' : 'no');
                  setAppliedDetails({
                    date: lh.dateAppliedFor ? new Date(lh.dateAppliedFor).toISOString().split('T')[0] : '',
                    authority: lh.previousAuthorityName || '',
                    result: lh.previousResult || '',
                  });
                  setSuspended(lh.hasLicenceSuspended ? 'yes' : 'no');
                  setSuspendedDetails({
                    authority: lh.suspensionAuthorityName || '',
                    reason: lh.suspensionReason || '',
                  });
                  setFamily(lh.hasFamilyLicence ? 'yes' : 'no');
                  setFamilyDetails([{ name: lh.familyMemberName || '', licenseNumber: lh.familyLicenceNumber || '', weapons: lh.familyWeaponsEndorsed || [0] }]);
                  setSafePlace(lh.hasSafePlace ? 'yes' : 'no');
                  setSafePlaceDetails(lh.safePlaceDetails || '');
                  setTraining(lh.hasTraining ? 'yes' : 'no');
                  setTrainingDetails(lh.trainingDetails || '');
                  updateFormData('licenseHistory', data.licenseHistory);
                  setSubmitSuccess('Data refreshed');
                  setTimeout(() => setSubmitSuccess(null), 3000);
                }
              } catch (err: any) {
                setSubmitError('Failed to refresh data.');
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      )}

      {state.submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{state.submitSuccess}</div>
      )}
      {state.submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{state.submitError}</div>
      )}

      <div className="mb-6">
        <div className="font-semibold mb-2">14. Whether the applicant has applied for -</div>
        <div className="mb-2">(a) Arms License before?</div>
        <div className="flex gap-6 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="appliedBefore" 
              value="yes" 
              checked={appliedBefore === 'yes'} 
              onChange={() => setAppliedBefore('yes')} 
              className="cursor-pointer"
            /> Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="appliedBefore" 
              value="no" 
              checked={appliedBefore === 'no'} 
              onChange={() => setAppliedBefore('no')} 
              className="cursor-pointer"
            /> No
          </label>
        </div>
        {appliedBefore === 'yes' && (
          <div className="grid grid-cols-2 gap-6 mb-2">
            <Input label="Date of Application" name="date" type="date" value={appliedDetails.date} onChange={handleAppliedDetails} placeholder="DD/MM/YYYY" />
            <Input label="To which authority" name="authority" value={appliedDetails.authority} onChange={handleAppliedDetails} placeholder="Enter authority" />
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
              <select name="result" value={appliedDetails.result} onChange={(e) => setAppliedDetails(prev => ({ ...prev, result: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Result</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-2">(b) License been revoked or suspended</div>
        <div className="flex gap-6 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="suspended" 
              value="yes" 
              checked={suspended === 'yes'} 
              onChange={() => setSuspended('yes')} 
              className="cursor-pointer"
            /> Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="suspended" 
              value="no" 
              checked={suspended === 'no'} 
              onChange={() => setSuspended('no')} 
              className="cursor-pointer"
            /> No
          </label>
        </div>
        {suspended === 'yes' && (
          <div className="grid grid-cols-2 gap-6 mb-2">
            <Input label="By which authority" name="authority" value={suspendedDetails.authority} onChange={handleSuspendedDetails} placeholder="Enter authority" />
            <Input label="Reason" name="reason" value={suspendedDetails.reason} onChange={handleSuspendedDetails} placeholder="Enter reason" />
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-2">(c) Any member of the family holds a license</div>
        <div className="flex gap-6 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="family" 
              value="yes" 
              checked={family === 'yes'} 
              onChange={() => setFamily('yes')} 
              className="cursor-pointer"
            /> Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="family" 
              value="no" 
              checked={family === 'no'} 
              onChange={() => setFamily('no')} 
              className="cursor-pointer"
            /> No
          </label>
        </div>
        {family === 'yes' && familyDetails.map((fam, idx) => (
          <div key={idx} className="mb-4 border-b pb-2">
            <div className="grid grid-cols-2 gap-6 mb-2">
              <Input label="Name" name="name" value={fam.name} onChange={e => handleFamilyDetails(idx, e)} placeholder="Enter name" />
              <Input label="License Number" name="licenseNumber" value={fam.licenseNumber} onChange={e => handleFamilyDetails(idx, e)} placeholder="Enter license number" />
            </div>
            {familyDetails.length > 1 && <button type="button" className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 mt-2" onClick={() => removeFamily(idx)}>- Remove</button>}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="mb-2">(d) The applicant has a safe place to keep the arms and ammunition</div>
        <div className="flex gap-6 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="safePlace" 
              value="yes" 
              checked={safePlace === 'yes'} 
              onChange={() => setSafePlace('yes')} 
              className="cursor-pointer"
            /> Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="safePlace" 
              value="no" 
              checked={safePlace === 'no'} 
              onChange={() => setSafePlace('no')} 
              className="cursor-pointer"
            /> No
          </label>
        </div>
        {safePlace === 'yes' && (
          <TextArea label="If Yes details thereof" name="safePlaceDetails" value={safePlaceDetails} onChange={e => setSafePlaceDetails(e.target.value)} placeholder="Enter details" />
        )}
      </div>

      <div className="mb-6">
        <div className="mb-2">(e) The applicant has undergone training as specified under rule 10 <span className="italic text-xs">(whenever made applicable by the Central Government)</span></div>
        <div className="flex gap-6 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="training" 
              value="yes" 
              checked={training === 'yes'} 
              onChange={() => setTraining('yes')} 
              className="cursor-pointer"
            /> Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="training" 
              value="no" 
              checked={training === 'no'} 
              onChange={() => setTraining('no')} 
              className="cursor-pointer"
            /> No
          </label>
        </div>
        {training === 'yes' && (
          <TextArea label="If Yes details thereof" name="trainingDetails" value={trainingDetails} onChange={e => setTrainingDetails(e.target.value)} placeholder="Enter details" />
        )}
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

export default LicenseHistoryRenewal;