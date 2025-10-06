"use client";
import React, { useState } from 'react';
import { Checkbox } from '../elements/Checkbox';
import { Frown } from 'lucide-react';
import FormFooter from '../elements/footer';

const initialState = {
	declareTrue: false,
	declareFalseInfo: false,
	declareTerms: false,
};

const Declaration = () => {
	const [form, setForm] = useState(initialState);

	const handleCheck = (name: string, checked: boolean) => {
		setForm((prev) => ({ ...prev, [name]: checked }));
	};

	return (
		<form className="p-6 mx-full">
			<h2 className="text-xl font-bold mb-4">Declaration & Submit</h2>
			<div className="font-semibold mb-2">Declaration</div>
			<div className="flex flex-col gap-2 mb-6">
				<Checkbox
					label="I hereby declare that the information provided above is true and correct to the best of my knowledge and belief."
					name="declareTrue"
					checked={form.declareTrue}
					onChange={(checked) => handleCheck('declareTrue', checked)}
				/>
				<Checkbox
					label="I understand that providing false information may result in legal consequences and rejection of my application."
					name="declareFalseInfo"
					checked={form.declareFalseInfo}
					onChange={(checked) => handleCheck('declareFalseInfo', checked)}
				/>
				<Checkbox
					label="I agree to abide by all terms and conditions related to the arms license and will use the weapon responsibly."
					name="declareTerms"
					checked={form.declareTerms}
					onChange={(checked) => handleCheck('declareTerms', checked)}
				/>
			</div>
			<hr className="my-6" />
			   <FormFooter isDeclarationStep />
		</form>
	);
};

export default Declaration;
