"use client";
import React, { useState } from 'react';
import { Input, TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import FormFooter from '../elements/footer';

const initialFamily = { name: '', licenseNumber: '', weapons: [''] };

const LicenseHistory = () => {
	const [appliedBefore, setAppliedBefore] = useState('no');
	const [appliedDetails, setAppliedDetails] = useState({ date: '', authority: '', result: '', status: '' });
	const [rejectedFile, setRejectedFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string>('');
	const [suspended, setSuspended] = useState('no');
	const [suspendedDetails, setSuspendedDetails] = useState({ authority: '', reason: '' });
	const [family, setFamily] = useState('no');
	const [familyDetails, setFamilyDetails] = useState([{ ...initialFamily }]);
	const [safePlace, setSafePlace] = useState('no');
	const [safePlaceDetails, setSafePlaceDetails] = useState('');
	const [training, setTraining] = useState('no');
	const [trainingDetails, setTrainingDetails] = useState('');

	const handleAppliedDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setAppliedDetails((prev) => ({ ...prev, [name]: value }));
	};
	const handleSuspendedDetails = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setSuspendedDetails((prev) => ({ ...prev, [name]: value }));
	};
	const handleFamilyDetails = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFamilyDetails((prev) => prev.map((f, i) => i === idx ? { ...f, [name]: value } : f));
	};
	const handleWeaponChange = (idx: number, widx: number, e: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		setFamilyDetails((prev) => prev.map((f, i) => i === idx ? { ...f, weapons: f.weapons.map((w, wi) => wi === widx ? value : w) } : f));
	};
	const addFamily = () => setFamilyDetails((prev) => [...prev, { ...initialFamily }]);
	const removeFamily = (idx: number) => setFamilyDetails((prev) => prev.filter((_, i) => i !== idx));
	const addWeapon = (idx: number) => setFamilyDetails((prev) => prev.map((f, i) => i === idx ? { ...f, weapons: [...f.weapons, ''] } : f));
	const removeWeapon = (idx: number, widx: number) => setFamilyDetails((prev) => prev.map((f, i) => i === idx ? { ...f, weapons: f.weapons.filter((_, wi) => wi !== widx) } : f));

	return (
		<form className="p-6">
            			<h2 className="text-xl font-bold mb-4">Lincense History</h2>

			<div className="mb-6">
				<div className="font-medium mb-2">14. Whether -</div>
				<div className="mb-2">(a) The applicant applied for a licence before – if so, when, to whom and with what result</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="appliedBefore" value="yes" checked={appliedBefore === 'yes'} onChange={() => setAppliedBefore('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="appliedBefore" value="no" checked={appliedBefore === 'no'} onChange={() => setAppliedBefore('no')} /> No
					</label>
				</div>
				{appliedBefore === 'yes' && (
					<div className="grid grid-cols-3 gap-6 mb-2">
						<Input label="Date of Applied for" name="date" type="date" value={appliedDetails.date} onChange={handleAppliedDetails} placeholder="DD/MM/YYYY" />
						<Input label="Name of the License Authority" name="authority" value={appliedDetails.authority} onChange={handleAppliedDetails} placeholder="Enter authority" />
						<Input label="Result (Pl. specify)" name="result" value={appliedDetails.result} onChange={handleAppliedDetails} placeholder="Enter result" />
					</div>
				)}
				<div className="mb-2">Status</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="status" value="approved" checked={appliedDetails.status === 'approved'} onChange={handleAppliedDetails} /> Approved
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="status" value="pending" checked={appliedDetails.status === 'pending'} onChange={handleAppliedDetails} /> Pending
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="status" value="rejected" checked={appliedDetails.status === 'rejected'} onChange={handleAppliedDetails} /> Rejected
					</label>
				</div>
				   <div className="mb-2">Upload previously Rejected License Copy</div>
				   <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 flex flex-col items-center mb-2">
					   <span className="text-blue-500 text-2xl mb-2">📤</span>
					   <span>Drag your file(s) or <span className="text-blue-700 underline cursor-pointer">browse</span></span>
					   <span className="text-xs text-gray-500">Max 1 MB file allowed</span>
					   <input
						   type="file"
						   className="hidden"
						   onChange={e => {
							   const file = e.target.files?.[0] || null;
							   if (file && file.size > 1024 * 1024) {
								   setFileError('File size must be less than 1MB');
								   setRejectedFile(null);
							   } else {
								   setFileError('');
								   setRejectedFile(file);
							   }
						   }}
					   />
					   {fileError && <span className="text-xs text-red-500 mt-1">{fileError}</span>}
				   </div>
				   <button type="button" className="border border-purple-500 text-purple-700 px-4 py-1 rounded flex items-center gap-1 ml-auto">+ Upload</button>
			</div>
			<div className="mb-6">
				<div className="mb-2">(b) The applicant license ever suspended or cancelled/revoked-</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="suspended" value="yes" checked={suspended === 'yes'} onChange={() => setSuspended('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="suspended" value="no" checked={suspended === 'no'} onChange={() => setSuspended('no')} /> No
					</label>
				</div>
				{suspended === 'yes' && (
					<>
						<Input label="Name of the Licensing Authority" name="authority" value={suspendedDetails.authority} onChange={handleSuspendedDetails} placeholder="Enter authority" />
						<TextArea label="Reason" name="reason" value={suspendedDetails.reason} onChange={handleSuspendedDetails} placeholder="Enter reason" />
					</>
				)}
			</div>
			<div className="mb-6">
				<div className="mb-2">(c) Any other member of the applicant’s family is in possession of any arms license, if so, particulars thereof</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="family" value="yes" checked={family === 'yes'} onChange={() => setFamily('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="family" value="no" checked={family === 'no'} onChange={() => setFamily('no')} /> No
					</label>
				</div>
				{family === 'yes' && familyDetails.map((fam, idx) => (
					<div key={idx} className="mb-4 border-b pb-2">
						<div className="grid grid-cols-2 gap-6 mb-2">
							<Input label="Name" name="name" value={fam.name} onChange={e => handleFamilyDetails(idx, e)} placeholder="Enter name" />
							<Input label="License Number" name="licenseNumber" value={fam.licenseNumber} onChange={e => handleFamilyDetails(idx, e)} placeholder="Enter license number" />
						</div>
						<div className="mb-2">Weapons Endorsed</div>
						{fam.weapons.map((w, widx) => (
							<div key={widx} className="flex items-center gap-2 mb-1">
								<Input label={`Weapon ${widx + 1}`} name={`weapon${widx}`} value={w} onChange={e => handleWeaponChange(idx, widx, e)} placeholder={`Weapon ${widx + 1}`} />
								<button type="button" className="bg-blue-900 text-white px-2 py-1 rounded" onClick={() => addWeapon(idx)}>+</button>
								{fam.weapons.length > 1 && <button type="button" className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => removeWeapon(idx, widx)}>-</button>}
							</div>
						))}
						<button type="button" className="bg-blue-900 text-white px-3 py-1 rounded flex items-center gap-1 mt-2" onClick={addFamily}>+ Add</button>
						{familyDetails.length > 1 && <button type="button" className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 mt-2 ml-2" onClick={() => removeFamily(idx)}>- Remove</button>}
					</div>
				))}
			</div>
			<div className="mb-6">
				<div className="mb-2">(d) The applicant has a safe place to keep the arms and ammunition</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="safePlace" value="yes" checked={safePlace === 'yes'} onChange={() => setSafePlace('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="safePlace" value="no" checked={safePlace === 'no'} onChange={() => setSafePlace('no')} /> No
					</label>
				</div>
				{safePlace === 'yes' && (
					<TextArea label="If Yes details thereof" name="safePlaceDetails" value={safePlaceDetails} onChange={e => setSafePlaceDetails(e.target.value)} placeholder="Enter details" />
				)}
			</div>
			<div className="mb-6">
				<div className="mb-2">(e) The applicant has undergone training as specified under rule 10 <span className="italic text-xs">(whenever made applicable by the Central Government)</span></div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="training" value="yes" checked={training === 'yes'} onChange={() => setTraining('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="training" value="no" checked={training === 'no'} onChange={() => setTraining('no')} /> No
					</label>
				</div>
				{training === 'yes' && (
					<TextArea label="If Yes details thereof" name="trainingDetails" value={trainingDetails} onChange={e => setTrainingDetails(e.target.value)} placeholder="Enter details" />
				)}
			</div>
			<FormFooter />
		</form>
	);
};

export default LicenseHistory;
