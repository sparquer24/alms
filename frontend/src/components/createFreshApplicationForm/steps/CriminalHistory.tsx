import React from 'react';

const CriminalHistory: React.FC<{ formData:any; onChange:(e:any)=>void }> = ({ formData, onChange }) => {
  // align with spec: use formData.criminalHistory array and fields
  const records: any[] = formData.criminalHistory || [];

  const changeRecord = (idx:number, field:string, value:any) => {
    const next = [...records];
    next[idx] = { ...next[idx], [field]: value };
    onChange({ target: { name: 'criminalHistory', value: next } });
  };

  const addRecord = () => {
    const next = [...records, { convicted: false, isCriminalCasePending: 'No', firNumber: '', policeStation: '', sectionOfLaw: '', dateOfOffence: '', caseStatus: '' }];
    onChange({ target: { name: 'criminalHistory', value: next } });
  };

  const removeRecord = (idx:number) => {
    const next = records.filter((_:any, i:number) => i !== idx);
    onChange({ target: { name: 'criminalHistory', value: next } });
  };

  return (
    <div>
      <h3 className="text-lg font-bold">Criminal History</h3>
      <div className="mt-4">
        <label className="block text-sm font-medium">Any convictions / records?</label>
        <select name="hasCriminalHistory" value={formData.hasCriminalHistory ? 'true' : 'false'} onChange={(e)=>onChange({ target: { name: 'hasCriminalHistory', value: e.target.value === 'true' } })} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>

      <div className="mt-4">
        <h4 className="font-medium">Records</h4>
        {records.map((r:any, idx:number) => (
          <div key={idx} className="border p-3 rounded-md mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={Boolean(r.convicted)} onChange={(e)=>changeRecord(idx, 'convicted', e.target.checked)} className="mr-2" />
                  <span>Convicted</span>
                </label>
              </div>

              <div>
                <label className="block text-sm">Is case pending?</label>
                <select value={r.isCriminalCasePending || 'No'} onChange={(e)=>changeRecord(idx, 'isCriminalCasePending', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm">FIR Number</label>
                <input value={r.firNumber || ''} onChange={(e)=>changeRecord(idx, 'firNumber', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm">Police Station</label>
                <input value={r.policeStation || ''} onChange={(e)=>changeRecord(idx, 'policeStation', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm">Section of Law</label>
                <input value={r.sectionOfLaw || ''} onChange={(e)=>changeRecord(idx, 'sectionOfLaw', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm">Date of Offence</label>
                <input type="date" value={r.dateOfOffence || ''} onChange={(e)=>changeRecord(idx, 'dateOfOffence', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm">Case Status</label>
                <input value={r.caseStatus || ''} onChange={(e)=>changeRecord(idx, 'caseStatus', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div className="mt-2 text-right">
              <button type="button" onClick={()=>removeRecord(idx)} className="text-sm text-red-600">Remove</button>
            </div>
          </div>
        ))}

        <div className="mt-3">
          <button type="button" onClick={addRecord} className="px-3 py-1 bg-blue-600 text-white rounded-md">Add Record</button>
        </div>
      </div>
    </div>
  );
};

export default CriminalHistory;
