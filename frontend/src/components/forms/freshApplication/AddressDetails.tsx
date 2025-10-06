"use client";
import React, { useState } from 'react';
import { Input } from '../elements/Input';
import { TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import FormFooter from '../elements/footer';

const initialState = {
	presentAddress: '',
	presentState: '',
	presentDistrict: '',
	presentJurisdiction: '',
	presentSince: '',
	sameAsPresent: false,
	permanentAddress: '',
	permanentState: '',
	permanentDistrict: '',
	permanentJurisdiction: '',
	telOffice: '',
	telResidence: '',
	mobOffice: '',
	mobAlternative: '',
};

const AddressDetails: React.FC = () => {
	const [form, setForm] = useState(initialState);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleCheckbox = (checked: boolean) => {
		setForm((prev) => ({ ...prev, sameAsPresent: checked }));
		if (checked) {
			setForm((prev) => ({
				...prev,
				permanentAddress: prev.presentAddress,
				permanentState: prev.presentState,
				permanentDistrict: prev.presentDistrict,
				permanentJurisdiction: prev.presentJurisdiction,
			}));
		}
	};

	return (
		<form className="p-6">
        <h2 className="text-xl font-bold mb-4">Address Details</h2>
			<div className="grid grid-cols-2 gap-6 mb-2">
				<div className="col-span-2">
					<TextArea
						label="8. Present address"
						name="presentAddress"
						value={form.presentAddress}
						onChange={handleChange}
						placeholder="Enter present address"
						rows={2}
					/>
				</div>
				<Input
					label="State"
					name="presentState"
					value={form.presentState}
					onChange={handleChange}
					placeholder="Enter state"
				/>
				<Input
					label="District"
					name="presentDistrict"
					value={form.presentDistrict}
					onChange={handleChange}
					placeholder="Enter district"
				/>
				<Input
					label="Jurisdiction police station"
					name="presentJurisdiction"
					value={form.presentJurisdiction}
					onChange={handleChange}
					placeholder="Enter police station"
				/>
				<Input
					label="Since when residing at present address"
					name="presentSince"
					type="date"
					value={form.presentSince}
					onChange={handleChange}
					placeholder="DD/MM/YYYY"
				/>
			</div>
			<div className="text-xs text-gray-700 mb-2">
				NOTE: Nearest Police Station means the Police Station under whose jurisdiction the place given in the address comes
			</div>
			<Checkbox
				label="Same as present address"
				name="sameAsPresent"
				checked={form.sameAsPresent}
				onChange={handleCheckbox}
				className="mb-2"
			/>
			<br/>
			<div className="grid grid-cols-2 gap-6 mb-2">
				<div className="col-span-2">
					<TextArea
						label="9. Permanent address"
						name="permanentAddress"
						value={form.permanentAddress}
						onChange={handleChange}
						placeholder="Enter permanent address"
						rows={2}
					/>
				</div>
				<Input
					label="State"
					name="permanentState"
					value={form.permanentState}
					onChange={handleChange}
					placeholder="Enter state"
				/>
				<Input
					label="District"
					name="permanentDistrict"
					value={form.permanentDistrict}
					onChange={handleChange}
					placeholder="Enter district"
				/>
				<Input
					label="Jurisdiction police station"
					name="permanentJurisdiction"
					value={form.permanentJurisdiction}
					onChange={handleChange}
					placeholder="Enter police station"
				/>
			</div>
			<div className="text-xs text-gray-700 mb-4">
				NOTE: Nearest Police Station means the Police Station under whose jurisdiction the place given in the address comes
			</div>
			<div className="bg-blue-50 rounded-lg p-4 grid grid-cols-4 gap-4 mb-2 h-30">
				<Input
					label="Telephone Number\nOffice"
					name="telOffice"
					value={form.telOffice}
					onChange={handleChange}
					placeholder="0000 0000 0000"
				/>
				<Input
					label="Residence"
					name="telResidence"
					value={form.telResidence}
					onChange={handleChange}
					placeholder="0000 0000 0000"
				/>
				<Input
					label="Mobile Number\nOffice"
					name="mobOffice"
					value={form.mobOffice}
					onChange={handleChange}
					placeholder="0000 0000 0000"
				/>
				<Input
					label="Alternative Mobile Number"
					name="mobAlternative"
					value={form.mobAlternative}
					onChange={handleChange}
					placeholder="0000 0000 0000"
				/>
			</div>
			<FormFooter/>
		</form>
	);
};

export default AddressDetails;
