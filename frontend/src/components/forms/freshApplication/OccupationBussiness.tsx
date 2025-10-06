"use client"
import React, { useState } from 'react';
import { Input, TextArea } from '../elements/Input';
import FormFooter from '../elements/footer';

const initialState = {
	occupation: '',
	officeAddress: '',
	officeState: '',
	officeDistrict: '',
	cropLocation: '',
	cropArea: '',
};

const OccupationBussiness = () => {
	const [form, setForm] = useState(initialState);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<form className="p-6">
						<h2 className="text-xl font-bold mb-4">Occupation and Business Details</h2>

			<Input
				label="10. Occupation"
				name="occupation"
				value={form.occupation}
				onChange={handleChange}
				placeholder="Enter occupation"
				className="mb-4"
			/>
			<TextArea
				label="11. Office/Business address"
				name="officeAddress"
				value={form.officeAddress}
				onChange={handleChange}
				placeholder="Enter office or business address"
				rows={2}
				className="mb-4"
			/>
			<div className="grid grid-cols-2 gap-6 mb-4">
				<Input
					label="State"
					name="officeState"
					value={form.officeState}
					onChange={handleChange}
					placeholder="Enter state"
				/>
				<Input
					label="District"
					name="officeDistrict"
					value={form.officeDistrict}
					onChange={handleChange}
					placeholder="Enter district"
				/>
			</div>
			<div className="mb-2 text-sm font-semibold">12. Additional particulars if the licence is required for crop protection under rule 35</div>
			<div className="grid grid-cols-2 gap-6">
				<Input
					label="Location"
					name="cropLocation"
					value={form.cropLocation}
					onChange={handleChange}
					placeholder="Enter location"
				/>
				<Input
					label="Area of land under cultivation"
					name="cropArea"
					value={form.cropArea}
					onChange={handleChange}
					placeholder="Enter area"
				/>
			</div>
			<FormFooter/>
		</form>
	);
};

export default OccupationBussiness;
