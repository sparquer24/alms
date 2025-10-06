"use client";
import React, { useState } from 'react';
import { Input } from '../elements/Input';
import FormFooter from '../elements/footer';
// Checkbox is not used, so no need to import it

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

const CriminalHistory = () => {
	const [convicted, setConvicted] = useState('no');
	const [provisions, setProvisions] = useState([{ ...initialProvision }]);
	const [bond, setBond] = useState('no');
	const [bondDetails, setBondDetails] = useState({ dateOfSentence: '', period: '' });
	const [prohibited, setProhibited] = useState('no');
	const [prohibitedDetails, setProhibitedDetails] = useState({ dateOfSentence: '', period: '' });

	const handleProvisionChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setProvisions((prev) => prev.map((prov, i) => i === idx ? { ...prov, [name]: value } : prov));
	};

	const addProvision = () => setProvisions((prev) => [...prev, { ...initialProvision }]);
	const removeProvision = (idx: number) => setProvisions((prev) => prev.filter((_, i) => i !== idx));

	return (
		<form className="p-6">
        <h2 className="text-xl font-bold mb-4">Criminal History</h2>
			<div className="mb-4">
				<div className="font-semibold mb-2">13. Whether the applicant has been -</div>
				<div className="mb-2">(a) Convicted</div>
				<div className="flex gap-6 mb-4">
					<label className="flex items-center gap-2">
						<input type="radio" name="convicted" value="yes" checked={convicted === 'yes'} onChange={() => setConvicted('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="convicted" value="no" checked={convicted === 'no'} onChange={() => setConvicted('no')} /> No
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
								   Add <span role="img" aria-label="add">➕</span>
							   </button>
							   {idx > 0 && (
								   <button type="button" className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1" onClick={() => removeProvision(idx)}>
									   <span role="img" aria-label="delete">🗑️</span>
								   </button>
							   )}
						   </div>
					   </div>
				   ))}
			</div>
			<div className="mb-4">
				<div className="mb-2">(b) Ordered to execute a bond under Chapter IX of Bharath Nagarik Suraksha Sameeksha, 1973 (2 of 1947) for keeping the peace or for good behavior</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="bond" value="yes" checked={bond === 'yes'} onChange={() => setBond('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="bond" value="no" checked={bond === 'no'} onChange={() => setBond('no')} /> No
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
					<label className="flex items-center gap-2">
						<input type="radio" name="prohibited" value="yes" checked={prohibited === 'yes'} onChange={() => setProhibited('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="prohibited" value="no" checked={prohibited === 'no'} onChange={() => setProhibited('no')} /> No
					</label>
				</div>
				{prohibited === 'yes' && (
					<div className="grid grid-cols-2 gap-6 mb-2">
						<Input label="Date of Sentence" name="dateOfSentence" type="date" value={prohibitedDetails.dateOfSentence} onChange={e => setProhibitedDetails(d => ({ ...d, dateOfSentence: e.target.value }))} placeholder="DD/MM/YYYY" />
						<Input label="Period of which bound" name="period" value={prohibitedDetails.period} onChange={e => setProhibitedDetails(d => ({ ...d, period: e.target.value }))} placeholder="Enter period" />
					</div>
				)}
			</div>
			<FormFooter/>
		</form>
	);
};

export default CriminalHistory;
