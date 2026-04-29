'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../elements/Input';
import FormFooter from '../elements/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';

const initialProvision = {
  firNumber: '',
  underSection: '',
  policeStation: '',
  unit: '',
  district: '',
  state: '',
  offence: '',
  sentence: '',
  dateOfSentence: '',
};

interface CriminalHistoryData {
  criminalHistories: any[];
}

const initialState: CriminalHistoryData = {
  criminalHistories: [],
};

// Removed mockPrefill. Only real API data will be used.

const validateCriminalHistory = (formData: CriminalHistoryData): string[] => {
  return [];
};

const CriminalHistoryRenewal: React.FC = () => {
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

  const [convicted, setConvicted] = useState('no');
  const [provisions, setProvisions] = useState([{ ...initialProvision }]);
  const [bond, setBond] = useState('no');
  const [bondDetails, setBondDetails] = useState({ dateOfSentence: '', period: '' });
  const [prohibited, setProhibited] = useState('no');
  const [prohibitedDetails, setProhibitedDetails] = useState({ dateOfSentence: '', period: '' });

  useEffect(() => {
    const fetchData = async () => {
      if (applicantId) {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
          // Try to get from context first
          const contextData = state.formData.criminalHistory;
          if (contextData && contextData.criminalHistories && contextData.criminalHistories.length > 0) {
            const ch = contextData.criminalHistories[0];
            setConvicted(ch.isConvicted ? 'yes' : 'no');
            setBond(ch.isBondExecuted ? 'yes' : 'no');
            setBondDetails({ dateOfSentence: ch.bondDate || '', period: ch.bondPeriod || '' });
            setProhibited(ch.isProhibited ? 'yes' : 'no');
            setProhibitedDetails({ dateOfSentence: ch.prohibitionDate || '', period: ch.prohibitionPeriod || '' });
            setProvisions(ch.firDetails && ch.firDetails.length > 0 ? ch.firDetails.map((prov: any) => ({
              firNumber: prov.firNumber || '',
              underSection: prov.underSection || '',
              policeStation: prov.policeStation || '',
              unit: prov.unit || '',
              district: prov.District || '',
              state: prov.state || '',
              offence: prov.offence || '',
              sentence: prov.sentence || '',
              dateOfSentence: prov.DateOfSentence || '',
            })) : [{ ...initialProvision }]);
            setSubmitSuccess('Criminal history data loaded');
            setTimeout(() => setSubmitSuccess(null), 3000);
          } else {
            // Otherwise, fetch from API
            const { FormDataLoader } = await import('../../../utils/formDataLoader');
            const data = await FormDataLoader.loadAllSections(applicantId);
            if (data.criminalHistory && data.criminalHistory.criminalHistories && data.criminalHistory.criminalHistories.length > 0) {
              const ch = data.criminalHistory.criminalHistories[0];
              setConvicted(ch.isConvicted ? 'yes' : 'no');
              setBond(ch.isBondExecuted ? 'yes' : 'no');
              setBondDetails({ dateOfSentence: ch.bondDate || '', period: ch.bondPeriod || '' });
              setProhibited(ch.isProhibited ? 'yes' : 'no');
              setProhibitedDetails({ dateOfSentence: ch.prohibitionDate || '', period: ch.prohibitionPeriod || '' });
              setProvisions(ch.firDetails && ch.firDetails.length > 0 ? ch.firDetails.map((prov: any) => ({
                firNumber: prov.firNumber || '',
                underSection: prov.underSection || '',
                policeStation: prov.policeStation || '',
                unit: prov.unit || '',
                district: prov.District || '',
                state: prov.state || '',
                offence: prov.offence || '',
                sentence: prov.sentence || '',
                dateOfSentence: prov.DateOfSentence || '',
              })) : [{ ...initialProvision }]);
              updateFormData('criminalHistory', data.criminalHistory);
              setSubmitSuccess('Criminal history data loaded');
              setTimeout(() => setSubmitSuccess(null), 3000);
            }
          }
        } catch (err: any) {
          setSubmitError('Failed to load criminal history data.');
        } finally {
          setIsSubmitting(false);
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const handleProvisionChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProvisions((prev) => prev.map((prov, i) => i === idx ? { ...prov, [name]: value } : prov));
  };

  const addProvision = () => setProvisions((prev) => [...prev, { ...initialProvision }]);
  const removeProvision = (idx: number) => setProvisions((prev) => prev.filter((_, i) => i !== idx));

  const handleSaveToDraft = async () => {
    const criminalHistories = [{
      isConvicted: convicted === 'yes',
      isBondExecuted: bond === 'yes',
      bondDate: bondDetails.dateOfSentence || null,
      bondPeriod: bondDetails.period || null,
      isProhibited: prohibited === 'yes',
      prohibitionDate: prohibitedDetails.dateOfSentence || null,
      prohibitionPeriod: prohibitedDetails.period || null,
      firDetails: convicted === 'yes' ? provisions.filter(prov => 
        prov.firNumber || prov.underSection || prov.policeStation || 
        prov.unit || prov.district || prov.state || 
        prov.offence || prov.sentence || prov.dateOfSentence
      ).map(prov => ({
        firNumber: prov.firNumber || "",
        underSection: prov.underSection || "",
        policeStation: prov.policeStation || "",
        unit: prov.unit || "",
        District: prov.district || "",
        state: prov.state || "",
        offence: prov.offence || "",
        sentence: prov.sentence || "",
        DateOfSentence: prov.dateOfSentence || null
      })) : []
    }];

    setIsSubmitting(true);
    updateFormData('criminalHistory', { criminalHistories });
    setSubmitSuccess('Draft saved!');
    setTimeout(() => setSubmitSuccess(null), 3000);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    const criminalHistories = [{
      isConvicted: convicted === 'yes',
      isBondExecuted: bond === 'yes',
      bondDate: bondDetails.dateOfSentence || null,
      bondPeriod: bondDetails.period || null,
      isProhibited: prohibited === 'yes',
      prohibitionDate: prohibitedDetails.dateOfSentence || null,
      prohibitionPeriod: prohibitedDetails.period || null,
      firDetails: convicted === 'yes' ? provisions.filter(prov => 
        prov.firNumber || prov.underSection || prov.policeStation || 
        prov.unit || prov.district || prov.state || 
        prov.offence || prov.sentence || prov.dateOfSentence
      ).map(prov => ({
        firNumber: prov.firNumber || "",
        underSection: prov.underSection || "",
        policeStation: prov.policeStation || "",
        unit: prov.unit || "",
        District: prov.district || "",
        state: prov.state || "",
        offence: prov.offence || "",
        sentence: prov.sentence || "",
        DateOfSentence: prov.dateOfSentence || null
      })) : []
    }];

    updateFormData('criminalHistory', { criminalHistories });
    const nextRoute = getNextRenewalRoute('/forms/renewal/criminal-history');
    router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  const handlePrevious = () => {
    const prevRoute = getPreviousRenewalRoute('/forms/renewal/criminal-history');
    router.push(`${prevRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  return (
    <form className="p-6">
      <h2 className="text-xl font-bold mb-4">Criminal History</h2>

      {state.submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{state.submitSuccess}</div>
      )}
      {state.submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{state.submitError}</div>
      )}

      <div className="mb-4">
        <div className="font-semibold mb-2">13. Whether the applicant has been -</div>
        <div className="mb-2">(a) Convicted</div>
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="convicted" 
              value="yes" 
              checked={convicted === 'yes'} 
              onChange={() => setConvicted('yes')} 
              className="cursor-pointer"
            /> Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="convicted" 
              value="no" 
              checked={convicted === 'no'} 
              onChange={() => setConvicted('no')} 
              className="cursor-pointer"
            /> No
          </label>
        </div>
        {convicted === 'yes' && provisions.map((prov, idx) => (
          <div key={idx} className="mb-6 border-b pb-4">
            <div className="font-medium mb-2">{idx === 0 ? 'i. Provisions to Enter–' : `ii. Provisions to Enter–`}</div>
            <div className="grid grid-cols-3 gap-6 mb-2">
              <Input label="FIR Number" name="firNumber" value={prov.firNumber} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter FIR number" />
              <Input label="Under Section" name="underSection" value={prov.underSection} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter section" />
              <Input label="Police Station" name="policeStation" value={prov.policeStation} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter police station" />
            </div>
            <div className="grid grid-cols-3 gap-6 mb-2">
              <Input label="Unit" name="unit" value={prov.unit} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter unit" />
              <Input label="District" name="district" value={prov.district} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter district" />
              <Input label="State" name="state" value={prov.state} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter state" />
            </div>
            <div className="font-medium mb-2">If Yes details thereof-</div>
            <div className="grid grid-cols-3 gap-6 mb-2">
              <Input label="Offence" name="offence" value={prov.offence} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter offence" />
              <Input label="Sentence" name="sentence" value={prov.sentence} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter sentence" />
              <Input label="Date of Sentence" name="dateOfSentence" type="date" value={prov.dateOfSentence} onChange={e => handleProvisionChange(idx, e)} placeholder="DD/MM/YYYY" />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="button" className="bg-blue-900 text-white px-4 py-1 rounded flex items-center gap-1" onClick={addProvision}>
                Add <span>➕</span>
              </button>
              {idx > 0 && (
                <button type="button" className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1" onClick={() => removeProvision(idx)}>
                  <span>🗑️</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="mb-2">(b) Ordered to execute a bond under Chapter IX of Bharath Nagarik Suraksha Sameeksha, 1973 (2 of 1947) for keeping the peace or for good behavior</div>
        <div className="flex gap-6 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="bond" 
              value="yes" 
              checked={bond === 'yes'} 
              onChange={() => setBond('yes')} 
              className="cursor-pointer"
            /> Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="bond" 
              value="no" 
              checked={bond === 'no'} 
              onChange={() => setBond('no')} 
              className="cursor-pointer"
            /> No
          </label>
        </div>
        {bond === 'yes' && (
          <div className="grid grid-cols-2 gap-6 mb-2">
            <Input label="Date of Sentence" name="dateOfSentence" type="date" value={bondDetails.dateOfSentence} onChange={e => setBondDetails(d => ({ ...d, dateOfSentence: e.target.value }))} placeholder="DD/MM/YYYY" />
            <Input label="Period of which bound" name="period" value={bondDetails.period} onChange={e => setBondDetails(d => ({ ...d, period: e.target.value }))} placeholder="Enter period" />
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="mb-2">(c) Prohibited under the Arms Act, 1959, or any other law from having the arms off ammunition</div>
        <div className="flex gap-6 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="prohibited" 
              value="yes" 
              checked={prohibited === 'yes'} 
              onChange={() => setProhibited('yes')} 
              className="cursor-pointer"
            /> Yes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="prohibited" 
              value="no" 
              checked={prohibited === 'no'} 
              onChange={() => setProhibited('no')} 
              className="cursor-pointer"
            /> No
          </label>
        </div>
        {prohibited === 'yes' && (
          <div className="grid grid-cols-2 gap-6 mb-2">
            <Input label="Date of Sentence" name="dateOfSentence" type="date" value={prohibitedDetails.dateOfSentence} onChange={e => setProhibitedDetails(d => ({ ...d, dateOfSentence: e.target.value }))} placeholder="DD/MM/YYYY" />
            <Input label="Period of which bound" name="period" value={prohibitedDetails.period} onChange={e => setProhibitedDetails(d => ({ ...d, period: e.target.value }))} placeholder="Enter period" />
          </div>
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

export default CriminalHistoryRenewal;