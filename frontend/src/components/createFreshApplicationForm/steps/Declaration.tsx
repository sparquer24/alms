import React from 'react';

const Declaration: React.FC<{ formData:any; onChange:(e:any)=>void }> = ({ formData, onChange }) => (
  <div>
    <h3 className="text-lg font-bold">Declaration</h3>
    <div className="mt-4 space-y-3">
      <label className="inline-flex items-center">
        <input type="checkbox" name="declaration.agreeToTruth" checked={Boolean(formData.declaration?.agreeToTruth)} onChange={(e:any)=>onChange({ target: { name: 'declaration.agreeToTruth', value: e.target.checked } })} />
        <span className="ml-2">I declare that the information provided is true</span>
      </label>

      <label className="inline-flex items-center">
        <input type="checkbox" name="declaration.understandLegalConsequences" checked={Boolean(formData.declaration?.understandLegalConsequences)} onChange={(e:any)=>onChange({ target: { name: 'declaration.understandLegalConsequences', value: e.target.checked } })} />
        <span className="ml-2">I understand the legal consequences of providing false information</span>
      </label>

      <label className="inline-flex items-center">
        <input type="checkbox" name="declaration.agreeToTerms" checked={Boolean(formData.declaration?.agreeToTerms)} onChange={(e:any)=>onChange({ target: { name: 'declaration.agreeToTerms', value: e.target.checked } })} />
        <span className="ml-2">I agree to the terms and conditions</span>
      </label>

      <label className="inline-flex items-center">
        <input type="checkbox" name="hasSubmittedTrueInfo" checked={Boolean(formData.hasSubmittedTrueInfo)} onChange={(e:any)=>onChange({ target: { name: 'hasSubmittedTrueInfo', value: e.target.checked } })} />
        <span className="ml-2">I confirm I have submitted true information</span>
      </label>
    </div>
  </div>
);

export default Declaration;
