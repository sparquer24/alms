"use client";
import React, { useState } from 'react';
import FormFooter from '../elements/footer';

const initialState = {
	signature: null,
	iris: null,
	photograph: null,
};

const BiometricInformation = () => {
	const [form, setForm] = useState(initialState);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, files } = e.target;
		if (files && files[0]) {
			setForm((prev) => ({ ...prev, [name]: files[0] }));
		}
	};

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">Biometric Information</h2>
			<div className="grid grid-cols-2 gap-8 mb-6">
				<div>
					<div className="font-semibold mb-2">Signature/Thumb Impression</div>
					<label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600 cursor-pointer hover:border-blue-400">
						Upload signature
						<input type="file" name="signature" className="hidden" onChange={handleFileChange} />
					</label>
				</div>
				<div>
					<div className="font-semibold mb-2">Iris Scan</div>
					<label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600 cursor-pointer hover:border-blue-400">
						Upload iris scan
						<input type="file" name="iris" className="hidden" onChange={handleFileChange} />
					</label>
				</div>
			</div>
			<div className="mb-6">
				<div className="font-semibold mb-2">Photograph</div>
				<label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600 cursor-pointer hover:border-blue-400">
					Upload photograph
					<input type="file" name="photograph" className="hidden" onChange={handleFileChange} />
				</label>
			</div>
			<FormFooter/>
		</form>
	);
};

export default BiometricInformation;

